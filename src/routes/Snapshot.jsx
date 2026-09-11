import { Navigate } from 'react-router-dom';
import useSmoothNavigate from '../hooks/useSmoothNavigate.js';
import Header from '../components/layout/Header.jsx';
import SavedStrip from '../components/account/SavedStrip.jsx';
import GradientButton from '../components/ui/GradientButton.jsx';
import IntakeStepper from '../components/intake/IntakeStepper.jsx';
import BackLink from '../components/intake/BackLink.jsx';
import OccupationLine from '../components/snapshot/OccupationLine.jsx';
import SkillSection from '../components/snapshot/SkillSection.jsx';
import { useIntakeStore } from '../store/intakeStore.js';

export default function Snapshot() {
  const navigate = useSmoothNavigate();
  const snapshot = useIntakeStore((state) => state.snapshot);
  const cv = useIntakeStore((state) => state.cv);
  const setGapResult = useIntakeStore((state) => state.setGapResult);

  // Reached without a generated snapshot: send her back to the start of the intake.
  if (!snapshot) return <Navigate to="/diagnostic/background" replace />;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <SavedStrip />

      <main className="mx-auto w-full max-w-[1000px] flex-1 px-5 py-8 sm:px-6 sm:py-10">
        <IntakeStepper currentIndex={2} />

        <div className="mt-8">
          <BackLink to="/diagnostic/break">Back to Career Break</BackLink>
        </div>

        <h1 className="mt-3 font-display text-2xl font-bold tracking-[-0.015em] text-ink sm:text-3xl">
          Your skill snapshot
        </h1>
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
