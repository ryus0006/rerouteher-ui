import useSmoothNavigate from '../../hooks/useSmoothNavigate.js';
import { useAccountStore } from '../../store/accountStore.js';
import { useIntakeStore } from '../../store/intakeStore.js';

/**
 * Offers to restore the previous plan during an unfinished redo.
 *
 * Uploading a new CV clears the snapshot, role and gap result. The previous
 * plan is kept in `previousPlan` until the redo produces a new gap result;
 * this bar lets the user restore it before then and hides once it is cleared.
 */
export default function PreviousPlanBar() {
  const navigate = useSmoothNavigate();
  const previousPlan = useIntakeStore((state) => state.previousPlan);
  const restorePreviousPlan = useIntakeStore((state) => state.restorePreviousPlan);
  const user = useAccountStore((state) => state.user);

  if (!previousPlan) return null;

  // A restored plan with a gap result opens on the journey (signed in) or the
  // gap screen (guest); a plan without one resumes at the snapshot step.
  const to = previousPlan.gapResult
    ? user
      ? '/journey'
      : '/diagnostic/gap'
    : '/diagnostic/snapshot';

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 rounded-2xl border border-line bg-canvas-sunk px-5 py-3.5">
      <p className="text-sm text-ink-soft">
        You&rsquo;re starting again. Your previous plan is still saved.
      </p>

      <button
        type="button"
        onClick={() => {
          restorePreviousPlan();
          navigate(to);
        }}
        className="text-sm font-semibold text-pink-600 underline decoration-transparent underline-offset-4 transition hover:decoration-current focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
      >
        Keep my previous plan
      </button>
    </div>
  );
}
