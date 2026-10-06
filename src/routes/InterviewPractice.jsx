import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import Header from '../components/layout/Header.jsx';
import GradientButton from '../components/ui/GradientButton.jsx';
import AreasView from '../components/interview/AreasView.jsx';
import PillButton from '../components/interview/PillButton.jsx';
import QuestionCard from '../components/interview/QuestionCard.jsx';
import SessionSteps from '../components/interview/SessionSteps.jsx';
import SetComplete from '../components/interview/SetComplete.jsx';
import SetupPanel from '../components/interview/SetupPanel.jsx';
import { focusLabel } from '../api/interview.js';
import useSmoothNavigate from '../hooks/useSmoothNavigate.js';
import { journeyProgress } from '../lib/journeyProgress.js';
import { useInterviewStore } from '../store/interviewStore.js';
import { useAccountStore } from '../store/accountStore.js';
import { useIntakeStore } from '../store/intakeStore.js';

const SLIDE = {
  enter: (direction) => ({ opacity: 0, x: direction * 48 }),
  centre: { opacity: 1, x: 0 },
  exit: (direction) => ({ opacity: 0, x: direction * -48 }),
};

/** Shown when no target role exists yet, or the server says the journey is incomplete. */
function NotReady() {
  const navigate = useSmoothNavigate();
  const cvParsed = useIntakeStore((state) => state.cvParsed);
  const activities = useIntakeStore((state) => state.break?.activities);
  const employerPriorities = useIntakeStore((state) => state.employerPriorities);
  const snapshot = useIntakeStore((state) => state.snapshot);
  const gapResult = useIntakeStore((state) => state.gapResult);
  const { next } = journeyProgress({
    cvParsed,
    activities,
    employerPriorities,
    snapshot,
    gapResult,
  });
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="page-shell max-w-[760px] flex-1 py-16">
        <h1 className="font-display text-3xl font-bold tracking-[-0.02em] text-ink">
          Interview practice
        </h1>
        <p className="mt-3 max-w-[58ch] text-sm leading-relaxed text-ink-soft">
          Questions are written for your target role, so practice opens once you have one. Finish
          your Target Role & Gap step first.
        </p>
        <GradientButton
          className="mt-6"
          size="md"
          onClick={() => navigate(next?.to ?? '/diagnostic/gap')}
        >
          Continue your journey
        </GradientButton>
      </main>
    </div>
  );
}

/** Sign-in gate: practice history is stored per account. */
function SignInRequired() {
  const openSheet = useAccountStore((state) => state.openSheet);
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="page-shell grid max-w-[1080px] flex-1 items-center gap-16 py-16 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-[-0.03em] text-ink">
            Interview practice
          </h1>
          <p className="mt-3 max-w-[54ch] text-base leading-relaxed text-ink-soft">
            Create a free account to practise. You answer questions for your target role out loud,
            get feedback on each answer, and see which areas come up most across your practice.
          </p>
          <p className="mt-2 max-w-[54ch] text-sm leading-relaxed text-ink-soft">
            Everything you have done so far as a guest comes with you.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <GradientButton size="md" onClick={() => openSheet('create', '/interview-practice')}>
              Create an account
            </GradientButton>
          </div>
        </div>
        <SessionSteps />
      </main>
    </div>
  );
}

/** In a mixed set, labels each question as general or role-specific. */
function questionNote(slot, focus) {
  if (focus === 'mixed') {
    return slot.kind === 'role_specific' ? 'Role-specific question' : 'General question';
  }
  return null;
}

export default function InterviewPractice() {
  const user = useAccountStore((state) => state.user);
  const snapshot = useIntakeStore((state) => state.snapshot);
  const selectedRole = useIntakeStore((state) => state.selectedRole);
  const gapResult = useIntakeStore((state) => state.gapResult);

  const sessions = useInterviewStore((state) => state.sessions);
  const current = useInterviewStore((state) => state.current);
  const areas = useInterviewStore((state) => state.areas);
  const index = useInterviewStore((state) => state.index);
  const view = useInterviewStore((state) => state.view);
  const loading = useInterviewStore((state) => state.loading);
  const storeError = useInterviewStore((state) => state.error);
  const loadSessions = useInterviewStore((state) => state.loadSessions);
  const openSession = useInterviewStore((state) => state.openSession);
  const startSession = useInterviewStore((state) => state.startSession);
  const refreshCurrent = useInterviewStore((state) => state.refreshCurrent);
  const loadAreas = useInterviewStore((state) => state.loadAreas);
  const goTo = useInterviewStore((state) => state.goTo);
  const setView = useInterviewStore((state) => state.setView);

  const [activeRoleId, setActiveRoleId] = useState(null);
  const [manualSetup, setManualSetup] = useState(false);
  const [setupError, setSetupError] = useState(null);
  const [notReady, setNotReady] = useState(false);
  const [listLoaded, setListLoaded] = useState(false);
  const [direction, setDirection] = useState(1);
  const [busy, setBusy] = useState(false);

  const roles = useMemo(() => {
    const matched = snapshot?.recommended_roles ?? [];
    if (!selectedRole || matched.some((role) => role.role_id === selectedRole.role_id))
      return matched;
    return [selectedRole, ...matched];
  }, [snapshot, selectedRole]);

  // The active role: the user's choice, else the journey's selected role, else
  // the first available. Derived so no effect needs to seed it.
  const activeRoleIdValue = activeRoleId ?? selectedRole?.role_id ?? roles[0]?.role_id ?? null;
  const sessionForActive = sessions.find((s) => s.role.role_id === activeRoleIdValue);
  const currentMatchesActive = current?.role?.role_id === activeRoleIdValue;

  // Load the user's sessions once, when signed in with a completed journey.
  useEffect(() => {
    if (user && snapshot && gapResult) {
      loadSessions().finally(() => setListLoaded(true));
    }
  }, [user, snapshot, gapResult, loadSessions]);

  // Open the active role's existing session when it is not the loaded one. This
  // effect only triggers the server read; setup visibility is derived in render.
  useEffect(() => {
    if (!listLoaded || !activeRoleIdValue || currentMatchesActive) return;
    if (sessionForActive && current?.session_id !== sessionForActive.session_id) {
      openSession(sessionForActive.session_id).catch(() => {});
    }
  }, [listLoaded, activeRoleIdValue, currentMatchesActive, sessionForActive, current, openSession]);

  if (!user) return <SignInRequired />;
  if (!snapshot || !gapResult || roles.length === 0) return <NotReady />;
  if (notReady) return <NotReady />;

  const activeRole =
    roles.find((role) => role.role_id === activeRoleIdValue) ?? selectedRole ?? roles[0];
  // Setup shows when the user opened it, or when the active role has no session
  // yet (once the list has loaded, so it does not flash during the initial read).
  const setupShowing = manualSetup || (listLoaded && !currentMatchesActive && !sessionForActive);
  const started = Boolean(current && current.questions.length > 0) && !setupShowing;
  const slots = current?.questions ?? [];
  const slot = slots[index];
  // The backend seeds a pending placeholder per question; a slot is answered only
  // once it has a recorded attempt (feedback ready or errored), not the placeholder.
  const isAnswered = (q) =>
    q.attempts.some((a) => a.feedback_status === 'ready' || a.feedback_status === 'error');
  const answeredInSet = slots.filter(isAnswered).length;
  const hasReadyAttempt = slots.some((q) => q.attempts.some((a) => a.feedback_status === 'ready'));
  const statuses = slots.map((q, position) =>
    position === index ? 'current' : isAnswered(q) ? 'done' : 'todo'
  );

  function move(to) {
    setDirection(to >= index ? 1 : -1);
    goTo(to);
  }

  function changeRole(roleId) {
    setSetupError(null);
    setManualSetup(false);
    setActiveRoleId(roleId);
  }

  async function confirmSetup({ roleId, focus }) {
    setSetupError(null);
    try {
      await startSession({ roleId, focus });
      await loadSessions();
      setActiveRoleId(roleId);
      setManualSetup(false);
    } catch (cause) {
      if (cause?.status === 409 || cause?.status === 422) {
        setNotReady(true);
        return;
      }
      setSetupError(`Your practice could not be started (${cause.message}). Try again.`);
    }
  }

  async function showAreas() {
    await loadAreas();
    setView('areas');
  }

  async function newSet() {
    await refreshCurrent();
    setView('practice');
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="page-shell max-w-[1200px] flex-1 pt-14 pb-20">
          <div
            className={`iv-reveal flex justify-between gap-8 ${started ? 'items-center' : 'items-end'}`}
            style={{ '--i': 0 }}
          >
            <div className="min-w-0 flex-1">
              <h1
                className={
                  started
                    ? 'sr-only'
                    : 'font-display text-4xl font-bold leading-[1.05] tracking-[-0.035em] text-ink'
                }
              >
                Interview practice
              </h1>
              {started ? (
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-base text-ink-soft">
                  <span>Practising for</span>
                  <label className="sr-only" htmlFor="interview-role-switch">
                    Change role
                  </label>
                  <select
                    id="interview-role-switch"
                    aria-label="Change role"
                    value={activeRole.role_id}
                    disabled={busy}
                    onChange={(event) => changeRole(event.target.value)}
                    className="interview-select-inline font-semibold text-ink"
                  >
                    {roles.map((role) => (
                      <option key={role.role_id} value={role.role_id}>
                        {role.role}
                      </option>
                    ))}
                  </select>
                  <span>{focusLabel(current.practice_focus).toLowerCase()} focus</span>
                </div>
              ) : (
                <p className="mt-2 max-w-[60ch] text-base leading-relaxed text-ink-soft">
                  Practise answering out loud, get feedback on each answer, and try any question
                  again until it feels right.
                </p>
              )}
            </div>

            {started && (
              <div className="flex shrink-0 items-center gap-3 pb-0.5">
                {hasReadyAttempt && view !== 'areas' && (
                  <PillButton icon="chart" iconSide="start" disabled={busy} onClick={showAreas}>
                    See areas to improve
                  </PillButton>
                )}
                <PillButton
                  icon="pencil"
                  iconSide="start"
                  disabled={busy}
                  onClick={() => {
                    setSetupError(null);
                    setManualSetup(true);
                  }}
                >
                  Change setup
                </PillButton>
              </div>
            )}
          </div>

          {storeError && !setupShowing && (
            <p role="alert" className="mt-6 text-sm text-pink-600">
              {storeError}
            </p>
          )}

          <AnimatePresence initial={false}>
            {setupShowing && activeRole && (
              <motion.div
                key="setup"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.55, ease: [0.32, 0.72, 0, 1] }}
                className="overflow-hidden"
              >
                {/* Rises in on first load only; mid-set the panel opens via the height animation. */}
                <div
                  className={`grid items-start gap-6 pt-8 ${started ? 'pb-2' : 'iv-reveal lg:grid-cols-[minmax(0,1fr)_19rem]'}`}
                  style={started ? undefined : { '--i': 1 }}
                >
                  <SetupPanel
                    key={activeRole.role_id}
                    roles={roles}
                    setup={{ role: activeRole, focus: 'mixed' }}
                    pending={loading}
                    error={setupError}
                    onConfirm={confirmSetup}
                    canCancel={currentMatchesActive}
                    onCancel={() => setManualSetup(false)}
                  />
                  <SessionSteps />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {started && view === 'areas' && (
            <div className="mt-8">
              <AreasView areas={areas} onBack={() => setView('practice')} />
            </div>
          )}

          {started && view === 'complete' && (
            <div className="mt-8">
              <SetComplete
                answered={answeredInSet}
                total={slots.length}
                onNewSet={newSet}
                onSeeAreas={showAreas}
                onReview={() => setView('practice')}
              />
            </div>
          )}

          {started && view === 'practice' && slot && (
            <div className="iv-reveal mt-12 max-w-[56rem]" style={{ '--i': 1 }}>
              {/* Slide direction follows navigation direction (next/previous). */}
              <AnimatePresence mode="wait" initial={false} custom={direction}>
                <motion.div
                  key={`${current.session_id}-${slot.sequence_no}`}
                  custom={direction}
                  variants={SLIDE}
                  initial="enter"
                  animate="centre"
                  exit="exit"
                  transition={{ type: 'spring', stiffness: 260, damping: 30 }}
                  className="min-w-0"
                >
                  <QuestionCard
                    question={slot}
                    position={index}
                    total={slots.length}
                    note={questionNote(slot, current.practice_focus)}
                    onBusyChange={setBusy}
                    onPrevious={() => move(index - 1)}
                    onNext={() => move(index + 1)}
                    statuses={statuses}
                    onJump={move}
                    onFinish={() => setView('complete')}
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          )}
        </main>
      </div>
    </MotionConfig>
  );
}
