import useSmoothNavigate from '../../hooks/useSmoothNavigate.js';
import { useAccountStore } from '../../store/accountStore.js';
import { useIntakeStore } from '../../store/intakeStore.js';

/**
 * The way back out of a redo she has started but not finished.
 *
 * Replacing the CV clears the snapshot, role, readiness and focus areas the
 * moment the new file lands, so abandoning halfway would otherwise leave her
 * with nothing at all — the old plan gone and the new one never built. The plan
 * she is replacing is held until the redo produces its own gap, and this is
 * what offers it back. It disappears on its own once the new one is finished.
 */
export default function PreviousPlanBar() {
  const navigate = useSmoothNavigate();
  const previousPlan = useIntakeStore((state) => state.previousPlan);
  const restorePreviousPlan = useIntakeStore((state) => state.restorePreviousPlan);
  const user = useAccountStore((state) => state.user);

  if (!previousPlan) return null;

  // Where the restored plan is read: the journey for an account, and the gap
  // screen for a guest, who has no journey to be sent to.
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
