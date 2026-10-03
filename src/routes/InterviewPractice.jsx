import { useMemo, useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import Header from '../components/layout/Header.jsx';
import GradientButton from '../components/ui/GradientButton.jsx';
import AreasView from '../components/interview/AreasView.jsx';
import PillButton from '../components/interview/PillButton.jsx';
import QuestionCard from '../components/interview/QuestionCard.jsx';
import SessionSteps from '../components/interview/SessionSteps.jsx';
import SetComplete from '../components/interview/SetComplete.jsx';
import SetupPanel from '../components/interview/SetupPanel.jsx';
import {
  QUESTIONS_PER_SET,
  focusLabel,
  generateQuestions,
  interviewContext,
} from '../api/interview.js';
import { ACTIVITY_LABELS } from '../config/activityTaxonomy.js';
import useSmoothNavigate from '../hooks/useSmoothNavigate.js';
import { summariseFeedback } from '../lib/interviewAreas.js';
import { journeyProgress } from '../lib/journeyProgress.js';
import { upcomingCount, useInterviewStore } from '../store/interviewStore.js';
import { useAccountStore } from '../store/accountStore.js';
import { useIntakeStore } from '../store/intakeStore.js';

const SLIDE = {
  enter: (direction) => ({ opacity: 0, x: direction * 48 }),
  centre: { opacity: 1, x: 0 },
  exit: (direction) => ({ opacity: 0, x: direction * -48 }),
};

/** Shown when no target role exists yet; practice requires one. */
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
            Sign in to practise. You answer questions for your target role out loud, get feedback on
            each answer, and see which areas come up most across your practice.
          </p>
          <p className="mt-2 max-w-[54ch] text-sm leading-relaxed text-ink-soft">
            New here? Creating an account keeps the journey you have done as a guest.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <GradientButton size="md" onClick={() => openSheet('signIn', '/interview-practice')}>
              Sign in
            </GradientButton>
            <GradientButton
              variant="secondary"
              size="md"
              onClick={() => openSheet('create', '/interview-practice')}
            >
              Create an account
            </GradientButton>
          </div>
        </div>
        <SessionSteps />
      </main>
    </div>
  );
}

/**
 * Optional note above a question: its kind in a mixed set, or the setup it was
 * generated under if the setup has since changed.
 */
function questionNote(question, setup) {
  if (question.role.role_id !== setup.role.role_id || question.focus !== setup.focus) {
    return `Asked when practising for ${question.role.role}, ${focusLabel(question.focus).toLowerCase()} focus`;
  }
  if (setup.focus === 'mixed') {
    return question.kind === 'role_specific' ? 'Role-specific question' : 'General question';
  }
  return null;
}

export default function InterviewPractice() {
  const user = useAccountStore((state) => state.user);
  const cv = useIntakeStore((state) => state.cv);
  const careerBreak = useIntakeStore((state) => state.break);
  const snapshot = useIntakeStore((state) => state.snapshot);
  const selectedRole = useIntakeStore((state) => state.selectedRole);
  const gapResult = useIntakeStore((state) => state.gapResult);

  const storedSetup = useInterviewStore((state) => state.setup);
  const questions = useInterviewStore((state) => state.questions);
  const index = useInterviewStore((state) => state.index);
  const attempts = useInterviewStore((state) => state.attempts);
  const earlier = useInterviewStore((state) => state.earlier);
  const finishedASet = useInterviewStore((state) => state.finishedASet);
  const finishSet = useInterviewStore((state) => state.finishSet);
  const startSet = useInterviewStore((state) => state.startSet);
  const replaceUpcoming = useInterviewStore((state) => state.replaceUpcoming);
  const goTo = useInterviewStore((state) => state.goTo);

  // null when closed; 'change' edits the current set, 'new' starts a new set.
  const [setupMode, setSetupMode] = useState(null);
  const [view, setView] = useState('practice');
  const [busy, setBusy] = useState(false);
  const [direction, setDirection] = useState(1);
  const [pending, setPending] = useState(false);
  const [setupError, setSetupError] = useState(null);

  const roles = useMemo(() => {
    const matched = snapshot?.recommended_roles ?? [];
    if (!selectedRole || matched.some((role) => role.role_id === selectedRole.role_id))
      return matched;
    return [selectedRole, ...matched];
  }, [snapshot, selectedRole]);

  const context = useMemo(
    () =>
      interviewContext({
        cv,
        careerBreak: careerBreak && {
          duration_years: careerBreak.duration_years,
          activities: careerBreak.activities.map((id) => ACTIVITY_LABELS[id] ?? id),
        },
        snapshot,
        gapResult,
      }),
    [cv, careerBreak, snapshot, gapResult]
  );

  const summary = useMemo(
    () => summariseFeedback([...earlier, ...questions], attempts),
    [earlier, questions, attempts]
  );

  if (!user) return <SignInRequired />;
  if (!snapshot || !gapResult || roles.length === 0) return <NotReady />;

  // Fall back to the journey's selected role if the saved role is no longer available.
  const setup =
    storedSetup && roles.some((role) => role.role_id === storedSetup.role.role_id)
      ? storedSetup
      : { role: selectedRole ?? roles[0], focus: 'mixed' };

  const started = questions.length > 0;
  const upcoming = upcomingCount({ questions, attempts, index });
  const answeredInSet = questions.filter((q) => attempts[q.id]?.length).length;
  const statuses = questions.map((q, position) =>
    position === index ? 'current' : attempts[q.id]?.length ? 'done' : 'todo'
  );
  const question = questions[index];
  const setupOpen = setupMode !== null;
  const showSetup = !started || setupOpen;

  function move(to) {
    setDirection(to >= index ? 1 : -1);
    goTo(to);
  }

  async function confirmSetup(next) {
    const asked = [...earlier, ...questions].map((q) => q.text);
    const replacing = started && setupMode === 'change' && upcoming > 0;
    const count = replacing ? upcoming : QUESTIONS_PER_SET;

    setPending(true);
    setSetupError(null);
    try {
      const { questions: generated } = await generateQuestions({
        role: next.role,
        focus: next.focus,
        count,
        exclude: asked,
        context,
      });
      const stamp = Date.now();
      const fresh = generated
        .filter((q) => !asked.includes(q.text))
        .slice(0, count)
        .map((q, position) => ({
          id: `${stamp}-${position}`,
          text: q.text,
          kind: q.kind,
          role: { role: next.role.role, role_id: next.role.role_id },
          focus: next.focus,
        }));
      if (fresh.length === 0) throw new Error('No new questions came back');

      if (replacing) replaceUpcoming(next, fresh);
      else startSet(next, fresh);
      setSetupMode(null);
      setView('practice');
    } catch (cause) {
      setSetupError(`Questions could not be prepared (${cause.message}). Try again.`);
    } finally {
      setPending(false);
    }
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
              {/* Visually hidden once practice starts; the question acts as the headline. */}
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
                <p className="text-base text-ink-soft">
                  Practising for <span className="font-semibold text-ink">{setup.role.role}</span>,{' '}
                  {focusLabel(setup.focus).toLowerCase()} focus
                </p>
              ) : (
                <p className="mt-2 max-w-[60ch] text-base leading-relaxed text-ink-soft">
                  Practise answering out loud, get feedback on each answer, and try any question
                  again until it feels right.
                </p>
              )}
            </div>

            {started && !setupOpen && (
              <div className="flex shrink-0 items-center gap-3 pb-0.5">
                {finishedASet && summary.answered > 0 && view !== 'areas' && (
                  <PillButton
                    icon="chart"
                    iconSide="start"
                    disabled={busy}
                    onClick={() => setView('areas')}
                  >
                    See areas to improve
                  </PillButton>
                )}
                <PillButton
                  icon="pencil"
                  iconSide="start"
                  disabled={busy}
                  onClick={() => {
                    setSetupError(null);
                    setSetupMode('change');
                  }}
                >
                  Change setup
                </PillButton>
              </div>
            )}
          </div>

          <AnimatePresence initial={false}>
            {showSetup && (
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
                    key={`${setup.role.role_id}-${setup.focus}-${setupMode}`}
                    roles={roles}
                    setup={setup}
                    midSet={started}
                    upcoming={setupMode === 'new' ? 0 : upcoming}
                    pending={pending}
                    error={setupError}
                    onConfirm={confirmSetup}
                    onCancel={() => setSetupMode(null)}
                  />
                  {!started && <SessionSteps />}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {started && view === 'areas' && (
            <div className="mt-8">
              <AreasView summary={summary} onBack={() => setView('practice')} />
            </div>
          )}

          {started && view === 'complete' && !setupOpen && (
            <div className="mt-8">
              <SetComplete
                answered={answeredInSet}
                total={questions.length}
                onNewSet={() => {
                  setSetupError(null);
                  setSetupMode('new');
                }}
                onSeeAreas={() => setView('areas')}
                onReview={() => setView('practice')}
              />
            </div>
          )}

          {started && view === 'practice' && question && (
            <div className="iv-reveal mt-12 max-w-[56rem]" style={{ '--i': 1 }}>
              {/* Slide direction follows navigation direction (next/previous). */}
              <AnimatePresence mode="wait" initial={false} custom={direction}>
                <motion.div
                  key={question.id}
                  custom={direction}
                  variants={SLIDE}
                  initial="enter"
                  animate="centre"
                  exit="exit"
                  transition={{ type: 'spring', stiffness: 260, damping: 30 }}
                  className="min-w-0"
                >
                  <QuestionCard
                    question={question}
                    position={index}
                    total={questions.length}
                    note={questionNote(question, setup)}
                    attempts={attempts[question.id] ?? []}
                    context={context}
                    onBusyChange={setBusy}
                    onPrevious={() => move(index - 1)}
                    onNext={() => move(index + 1)}
                    statuses={statuses}
                    onJump={move}
                    onFinish={() => {
                      finishSet();
                      setView('complete');
                    }}
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
