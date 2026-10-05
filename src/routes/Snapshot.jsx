import { useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'motion/react';
import useSmoothNavigate from '../hooks/useSmoothNavigate.js';
import { ArrowRight, Cursor } from '@phosphor-icons/react';
import Header from '../components/layout/Header.jsx';
import GradientButton from '../components/ui/GradientButton.jsx';
import IntakeStepper from '../components/intake/IntakeStepper.jsx';
import BackLink from '../components/intake/BackLink.jsx';
import OccupationLine from '../components/snapshot/OccupationLine.jsx';
import SkillSection from '../components/snapshot/SkillSection.jsx';
import AddedSkills from '../components/snapshot/AddedSkills.jsx';
import AskHeraAboutResults from '../components/companion/AskHeraAboutResults.jsx';
import { generateSnapshot } from '../api/snapshot.js';
import { useIntakeStore } from '../store/intakeStore.js';
import { getSkillDefinition } from '../lib/skillDefinition.js';
import { addedSkillsFor } from '../lib/addedSkills.js';

const EASE = [0.32, 0.72, 0, 1];

export default function Snapshot() {
  const navigate = useSmoothNavigate();
  const snapshot = useIntakeStore((state) => state.snapshot);
  const cv = useIntakeStore((state) => state.cv);
  const careerBreak = useIntakeStore((state) => state.break);
  const setSnapshot = useIntakeStore((state) => state.setSnapshot);
  const setGapResult = useIntakeStore((state) => state.setGapResult);
  const confirmedSkills = useIntakeStore((state) => state.confirmedSkills);
  const removeConfirmedSkill = useIntakeStore((state) => state.removeConfirmedSkill);
  const canGenerate = useIntakeStore((state) => state.canGenerateSnapshot)();

  const [error, setError] = useState(null);
  const requested = useRef(false);

  // Generate the snapshot on arrival when cv and break exist but no snapshot does
  // (e.g. a profile built through the companion, which skips the Priorities step).
  // The ref guard ensures a single request, including under StrictMode's double
  // mount; the `snapshot` dependency prevents re-running once it exists.
  useEffect(() => {
    if (snapshot || !canGenerate || requested.current) return;
    requested.current = true;
    setError(null);
    generateSnapshot(cv, careerBreak, confirmedSkills)
      .then(setSnapshot)
      .catch((cause) => setError(cause.message));
  }, [snapshot, canGenerate, cv, careerBreak, confirmedSkills, setSnapshot]);

  // No snapshot and no inputs to generate one: restart the intake.
  if (!snapshot && !canGenerate) return <Navigate to="/diagnostic/background" replace />;

  if (!snapshot) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="page-shell max-w-[1000px] flex-1 py-8 sm:py-10">
          <IntakeStepper currentIndex={3} />
          {error ? (
            <p role="alert" className="mt-8 text-sm font-medium text-pink-600">
              {error}
            </p>
          ) : (
            <p role="status" className="mt-8 text-sm text-ink-soft">
              Building your skill snapshot…
            </p>
          )}
        </main>
      </div>
    );
  }

  const addedSkills = addedSkillsFor(snapshot, confirmedSkills);

  // The hover hint covers both cards, so it is shown when any skill has a definition.
  const hasDefinitions = [...snapshot.professional_skills, ...snapshot.reframed_skills].some(
    getSkillDefinition
  );

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="page-shell max-w-[1000px] flex-1 py-8 sm:py-10">
        <IntakeStepper currentIndex={3} />

        <div className="mt-9 flex flex-wrap items-start justify-between gap-3">
          <h1 className="font-display text-2xl font-bold tracking-[-0.015em] text-ink sm:text-3xl">
            Your skill snapshot
          </h1>
          <AskHeraAboutResults className="mt-1 shrink-0" />
        </div>
        <div className="flex items-start justify-between gap-6">
          <div>
            <OccupationLine occupation={snapshot.previous_occupation} />
          </div>
          {hasDefinitions && (
            <p className="mt-2.5 flex shrink-0 items-center gap-1.5 text-sm text-ink-faint">
              <Cursor className="size-4" aria-hidden="true" />
              Hover any skill to see what it means
            </p>
          )}
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-[3fr_2fr]">
          <SkillSection
            title={
              addedSkills.length > 0
                ? 'Professional skills'
                : cv
                  ? 'From your CV'
                  : 'From your work'
            }
            countLabel={addedSkills.length > 0 ? 'skills' : 'professional skills'}
            skills={snapshot.professional_skills}
            emptyMessage="No professional skills matched confidently enough to list. Go back to Step 1 and upload a CV to fill this in."
            leadingCount={addedSkills.length}
            countNote={
              addedSkills.length > 0 && (
                <>
                  <span>
                    {snapshot.professional_skills.length} from your {cv ? 'CV' : 'work'}
                  </span>
                  <span aria-hidden="true" className="text-ink-faint">
                    ·
                  </span>
                  {/* Same tone as the added chips, so it doubles as their legend. */}
                  <span className="rounded-full bg-canvas-sunk px-2.5 py-0.5 font-medium">
                    {addedSkills.length} added by you
                  </span>
                </>
              )
            }
            leadingChips={
              addedSkills.length > 0 && (
                <AddedSkills skills={addedSkills} onRemove={removeConfirmedSkill} />
              )
            }
          />

          <SkillSection
            title="From your career break"
            countLabel="skills"
            skills={snapshot.reframed_skills}
            emptyMessage="None of your selected activities mapped to a recognised skill yet."
            delay={0.08}
          />
        </div>

        <motion.div
          className="mt-8 flex items-center justify-between"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.16, ease: EASE }}
        >
          <BackLink to="/diagnostic/priorities">Back to Work Priorities</BackLink>
          <GradientButton
            onClick={() => {
              setGapResult(null); // Force a fresh gap computation.
              navigate('/diagnostic/gap');
            }}
          >
            See my readiness &amp; gaps
            <ArrowRight weight="bold" className="size-4" aria-hidden="true" />
          </GradientButton>
        </motion.div>
      </main>
    </div>
  );
}
