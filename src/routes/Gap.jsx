import { useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import Header from '../components/layout/Header.jsx';
import ChapterBreak from '../components/account/ChapterBreak.jsx';
import IntakeStepper from '../components/intake/IntakeStepper.jsx';
import BackLink from '../components/intake/BackLink.jsx';
import RoleSelector from '../components/gap/RoleSelector.jsx';
import MatchPanel from '../components/gap/MatchPanel.jsx';
import FocusAreaList, { MAX_FOCUS_AREAS } from '../components/gap/FocusAreaList.jsx';
import AskHeraAboutResults from '../components/companion/AskHeraAboutResults.jsx';
import { pickFocusAreas } from '../lib/focusAreas.js';
import { computeGap } from '../api/gap.js';
import { useIntakeStore } from '../store/intakeStore.js';

const EASE = [0.32, 0.72, 0, 1];

/** Fade-up entry used for the page's top-level blocks. */
const rise = (delay) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, delay, ease: EASE },
});

export default function Gap() {
  const snapshot = useIntakeStore((state) => state.snapshot);
  const selectedRole = useIntakeStore((state) => state.selectedRole);
  const gapResult = useIntakeStore((state) => state.gapResult);
  const setGapResult = useIntakeStore((state) => state.setGapResult);

  const [error, setError] = useState(null);
  const [computing, setComputing] = useState(false);
  // Role whose result is loading after a switch; the previous result stays on screen until it arrives.
  const [pendingRole, setPendingRole] = useState(null);
  // After the first switch, results enter without the page-entry delay.
  const [switched, setSwitched] = useState(false);
  // True while the gap is recomputed after the user adds or removes skills.
  const [updating, setUpdating] = useState(false);

  const requestedRole = useRef(null);

  useEffect(() => {
    if (!snapshot || !selectedRole) return;
    if (gapResult) return; // Already computed; the store clears it when the role changes.
    if (requestedRole.current === selectedRole.role_id) return; // Request already in flight.

    requestedRole.current = selectedRole.role_id;
    setError(null);
    setComputing(true);

    computeGap(snapshot, selectedRole, useIntakeStore.getState().confirmedSkills)
      .then(setGapResult)
      .catch((cause) => setError(cause.message))
      .finally(() => setComputing(false));
  }, [snapshot, selectedRole, gapResult, setGapResult]);

  if (!snapshot) return <Navigate to="/diagnostic/background" replace />;

  function switchRole(role) {
    if (role.role_id === selectedRole?.role_id) return;

    setPendingRole(role);
    setSwitched(true);
    setError(null);

    computeGap(snapshot, role, useIntakeStore.getState().confirmedSkills)
      .then((result) => {
        /* Single write: `setSelectedRole` alone clears the gap result, which would
           empty the page while the request is in flight. */
        requestedRole.current = role.role_id;
        useIntakeStore.setState({ selectedRole: role, gapResult: result });
      })
      .catch((cause) => setError(cause.message))
      .finally(() => setPendingRole(null));
  }

  /**
   * Recomputes the gap for the current role with `confirmedSkills`, then saves
   * both in one write so the list and the counts change together.
   */
  function recompute(confirmedSkills) {
    setUpdating(true);
    setError(null);

    return computeGap(snapshot, selectedRole, confirmedSkills)
      .then((result) => useIntakeStore.setState({ confirmedSkills, gapResult: result }))
      .catch((cause) => {
        setError(cause.message);
        throw cause;
      })
      .finally(() => setUpdating(false));
  }

  /** Adds gaps the user already has (e.g. missing from an outdated CV). */
  function addSkills(gaps) {
    const current = useIntakeStore.getState().confirmedSkills;
    const added = gaps
      .filter((gap) => !current.some((s) => s.skill_name === gap.skill))
      .map((gap) => ({ skill_id: gap.skill_id ?? null, skill_name: gap.skill }));
    return recompute([...current, ...added]);
  }

  /** Removes skills added with `addSkills`, by name. */
  function removeSkills(skills) {
    const current = useIntakeStore.getState().confirmedSkills;
    return recompute(current.filter((s) => !skills.includes(s.skill_name)));
  }

  const roles = snapshot.recommended_roles;
  const focusAreas = gapResult ? pickFocusAreas(gapResult.gaps, MAX_FOCUS_AREAS) : [];
  const resultDelay = switched ? 0.05 : 0.38;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      {/* Reduced-motion users get fades only, without movement. */}
      <MotionConfig reducedMotion="user">
        <main className="page-shell max-w-[1000px] flex-1 py-8 sm:py-10">
          <IntakeStepper currentIndex={4} />

          <motion.div
            className="mt-9 flex flex-wrap items-start justify-between gap-3"
            {...rise(0)}
          >
            <div>
              <h1 className="font-display text-2xl font-bold tracking-[-0.015em] text-ink sm:text-3xl">
                Where do you want to go next?
              </h1>
              {roles.length > 1 && (
                <p className="mt-2 max-w-[56ch] text-sm leading-relaxed text-ink-soft">
                  Based on your experience, we&rsquo;ve matched you with {roles.length} roles.
                  Select one to see the skills you already have and the ones to build first. You can
                  change roles at any time.
                </p>
              )}
            </div>
            <AskHeraAboutResults className="mt-1 shrink-0" />
          </motion.div>

          <div className="mt-6">
            <RoleSelector
              roles={roles}
              selected={selectedRole}
              pending={pendingRole}
              onSelect={switchRole}
              delay={0.1}
            />
          </div>

          {error && (
            <p role="alert" className="mt-4 text-sm font-medium text-pink-600">
              {error}
            </p>
          )}

          <AnimatePresence mode="wait">
            {gapResult && (
              /* Keyed by role so a switch exits the old result and replays the entry. */
              <motion.div
                key={selectedRole.role_id}
                className="mt-6 grid items-start gap-5 md:grid-cols-[21rem_1fr]"
                animate={{ opacity: pendingRole || updating ? 0.45 : 1 }}
                exit={{ opacity: 0, y: -10, transition: { duration: 0.28, ease: EASE } }}
                transition={{ duration: 0.4, ease: EASE }}
              >
                <MatchPanel
                  role={selectedRole}
                  result={gapResult}
                  focusAreas={focusAreas}
                  delay={resultDelay}
                />
                <FocusAreaList
                  gaps={gapResult.gaps}
                  delay={resultDelay + 0.1}
                  updating={updating}
                  onAddSkills={addSkills}
                  onUndo={removeSkills}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {computing && !gapResult && (
            <p role="status" className="mt-6 text-sm text-ink-soft">
              Working it out…
            </p>
          )}

          {gapResult && (
            <motion.div {...rise(resultDelay + 0.35)}>
              <ChapterBreak />
            </motion.div>
          )}

          <div className="mt-8">
            <BackLink to="/diagnostic/snapshot">Back to Skill Snapshot</BackLink>
          </div>
        </main>
      </MotionConfig>
    </div>
  );
}
