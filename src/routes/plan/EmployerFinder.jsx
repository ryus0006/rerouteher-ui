import { Navigate } from 'react-router-dom';
import useSmoothNavigate from '../../hooks/useSmoothNavigate.js';
import Header from '../../components/layout/Header.jsx';
import GradientButton from '../../components/ui/GradientButton.jsx';
import PriorityPicker from '../../components/employers/PriorityPicker.jsx';
import HowItWorks from '../../components/employers/HowItWorks.jsx';
import { MAX_PRIORITIES } from '../../config/employerPriorities.js';
import { useIntakeStore } from '../../store/intakeStore.js';

/**
 * Changing what she is asking employers for, after seeing who it matched.
 *
 * Reached from the results rather than standing in front of them: the question
 * is put once during the intake, and this is where she comes back to it when
 * the companies she got are not the ones she wanted. Separate from the results
 * because it is a different question — that page answers "who fits", this one
 * asks "what does fitting mean to you".
 */
export default function EmployerFinder() {
  const navigate = useSmoothNavigate();
  const snapshot = useIntakeStore((state) => state.snapshot);
  const gapResult = useIntakeStore((state) => state.gapResult);
  const priorities = useIntakeStore((state) => state.employerPriorities);
  const setPriorities = useIntakeStore((state) => state.setEmployerPriorities);

  if (!snapshot || !gapResult) return <Navigate to="/diagnostic/gap" replace />;

  const chosen = priorities ?? [];

  function toggle(id) {
    setPriorities(chosen.includes(id) ? chosen.filter((value) => value !== id) : [...chosen, id]);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      {/* Tight enough that "See your matches" sits within the first screen: a
          choice you must scroll past its own button to make reads unfinished. */}
      <main className="mx-auto w-full max-w-[900px] flex-1 px-5 py-8 sm:px-6 sm:py-10">
        <p className="eyebrow text-pink-600">Employer fit finder</p>

        <h1 className="mt-1.5 max-w-[26ch] font-display text-2xl font-bold leading-[1.12] tracking-[-0.02em] text-ink sm:text-[2rem]">
          Change what you are asking for
        </h1>

        <p className="mt-2.5 max-w-[62ch] text-sm leading-relaxed text-ink-soft">
          We match you with Malaysian listed companies based on their publicly disclosed ESG and
          sustainability reports.
        </p>

        <div className="mt-7">
          <h2 className="font-display text-lg font-bold tracking-[-0.015em] text-ink">
            What matters most for your return?
          </h2>
          <p className="mt-1 text-sm text-ink-soft">Select up to {MAX_PRIORITIES} priorities.</p>
        </div>

        <div className="mt-3">
          <PriorityPicker chosen={chosen} onToggle={toggle} />
        </div>

        <div className="mt-6">
          <HowItWorks />
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <GradientButton
            variant="secondary"
            size="md"
            onClick={() => navigate('/plan/employers/matches')}
          >
            Cancel
          </GradientButton>

          <GradientButton
            variant="accent"
            disabled={chosen.length === 0}
            onClick={() => navigate('/plan/employers/matches')}
          >
            See your matches
            <span aria-hidden="true">→</span>
          </GradientButton>
        </div>
      </main>
    </div>
  );
}
