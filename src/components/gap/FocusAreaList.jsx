import GlassCard from '../ui/GlassCard.jsx';
import { formatUplift } from '../../lib/formatters.js';
import { pickFocusAreas } from '../../lib/focusAreas.js';

export const MAX_FOCUS_AREAS = 3;

const BAND_LABELS = {
  role: 'Role skill',
  ai_usage: 'AI literacy',
};

const GROUP_LABEL = 'eyebrow';

/**
 * Every requirement this role asks for that she does not yet cover. The highest
 * impact ones are ranked; the rest are named but not prioritised. Uplift is
 * displayed as returned by the backend, never recomputed here.
 */
export default function FocusAreaList({ gaps }) {
  const focusAreas = pickFocusAreas(gaps, MAX_FOCUS_AREAS);
  const alsoMissing = gaps.filter((gap) => !focusAreas.includes(gap));

  return (
    <GlassCard className="p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold text-ink">Missing for this role</h2>
        {gaps.length > 0 && (
          <p className="shrink-0 text-xs font-medium text-ink-soft">
            {gaps.length} {gaps.length === 1 ? 'requirement' : 'requirements'}
          </p>
        )}
      </div>

      {gaps.length === 0 ? (
        <p className="mt-4 text-sm italic text-ink-faint">
          No gaps were found for this role — you are covered on every skill we checked.
        </p>
      ) : (
        <>
          <p className={`mt-5 ${GROUP_LABEL}`}>Your top {focusAreas.length} to start with</p>

          <ol className="mt-2 space-y-3">
            {focusAreas.map((gap, index) => (
              <li
                key={gap.skill}
                className="flex items-start gap-3 rounded-2xl border border-line bg-canvas px-4 py-3"
              >
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-semibold tabular text-white">
                  {index + 1}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink">{gap.skill}</p>
                  <p className="mt-0.5 text-xs text-ink-faint">{BAND_LABELS[gap.band]}</p>
                </div>

                <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold tabular text-amber-700">
                  {formatUplift(gap.uplift)}
                </span>
              </li>
            ))}
          </ol>

          {alsoMissing.length > 0 && (
            <>
              {/* Named so the count above reconciles, but left unranked: missing
                  without being worth starting on. */}
              <p className={`mt-5 ${GROUP_LABEL}`}>Also missing</p>

              <ul className="mt-2 flex flex-wrap gap-1.5">
                {alsoMissing.map((gap) => (
                  <li
                    key={gap.skill}
                    className="rounded-full border border-line bg-canvas px-2.5 py-1 text-xs text-ink-soft"
                  >
                    {gap.skill}
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}

      <p className="mt-5 text-xs text-ink-soft">
        Projected improvement is an estimate of readiness, not a guarantee of employment.
      </p>
    </GlassCard>
  );
}
