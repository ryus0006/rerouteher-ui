import { useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import useSmoothNavigate from '../hooks/useSmoothNavigate.js';
import Header from '../components/layout/Header.jsx';
import GradientButton from '../components/ui/GradientButton.jsx';
import IntakeStepper from '../components/intake/IntakeStepper.jsx';
import BackLink from '../components/intake/BackLink.jsx';
import OccupationLine from '../components/snapshot/OccupationLine.jsx';
import SkillSection from '../components/snapshot/SkillSection.jsx';
import AskHeraAboutResults from '../components/companion/AskHeraAboutResults.jsx';
import { generateSnapshot } from '../api/snapshot.js';
import { useIntakeStore } from '../store/intakeStore.js';

export default function Snapshot() {
  const navigate = useSmoothNavigate();
  const snapshot = useIntakeStore((state) => state.snapshot);
  const cv = useIntakeStore((state) => state.cv);
  const careerBreak = useIntakeStore((state) => state.break);
  const setSnapshot = useIntakeStore((state) => state.setSnapshot);
  const setGapResult = useIntakeStore((state) => state.setGapResult);
  const confirmedSkills = useIntakeStore((state) => state.confirmedSkills);
  const canGenerate = useIntakeStore((state) => state.canGenerateSnapshot)();

  const [error, setError] = useState(null);
  const requested = useRef(false);

  // A chat-built profile (US8.1) reaches here with cv+break but no snapshot yet -
  // usually the Priorities page generates it. Generate on arrival from cv+break so
  // the companion's "See my skill snapshot" button lands on a real snapshot instead
  // of bouncing back. Generation stays on this page, never in the chat. The ref
  // guard fires it once (and survives StrictMode's mount/cleanup/mount) the same
  // way the Gap page guards its compute; the `snapshot` dep stops it re-firing.
  useEffect(() => {
    if (snapshot || !canGenerate || requested.current) return;
    requested.current = true;
    setError(null);
    generateSnapshot(cv, careerBreak, confirmedSkills)
      .then(setSnapshot)
      .catch((cause) => setError(cause.message));
  }, [snapshot, canGenerate, cv, careerBreak, confirmedSkills, setSnapshot]);

  // No snapshot and nothing to generate it from: back to the start of the intake.
  if (!snapshot && !canGenerate) return <Navigate to="/diagnostic/background" replace />;

  if (!snapshot) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="mx-auto w-full max-w-[1000px] flex-1 px-5 py-8 sm:px-6 sm:py-10">
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

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="mx-auto w-full max-w-[1000px] flex-1 px-5 py-8 sm:px-6 sm:py-10">
        <IntakeStepper currentIndex={3} />

        <div className="mt-8">
          <BackLink to="/diagnostic/priorities">Back to Work Priorities</BackLink>
        </div>

        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <h1 className="font-display text-2xl font-bold tracking-[-0.015em] text-ink sm:text-3xl">
            Your skill snapshot
          </h1>
          <AskHeraAboutResults className="mt-1 shrink-0" />
        </div>
        <OccupationLine occupation={snapshot.previous_occupation} />

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <SkillSection
            title={cv ? 'From your CV' : 'From your work'}
            skills={snapshot.professional_skills}
            emptyMessage="No professional skills matched confidently enough to list. Go back to Step 1 and upload a CV to fill this in."
          />

          <SkillSection
            title="From your career break"
            note="These come from the activities you did during your career break."
            skills={snapshot.reframed_skills}
            emptyMessage="None of your selected activities mapped to a recognised skill yet."
          />
        </div>

        <div className="mt-8 flex justify-end">
          <GradientButton
            onClick={() => {
              setGapResult(null); // force a fresh compute when entering the gap from the snapshot
              navigate('/diagnostic/gap');
            }}
          >
            See my readiness &amp; gaps
          </GradientButton>
        </div>
      </main>
    </div>
  );
}
