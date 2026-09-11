import { JOURNEY_STAGES } from '../../config/journeyStages.js';

const SEGMENT_BASE = 'absolute left-3.5 top-3.5 -translate-x-1/2 bg-violet-400/45';

/**
 * The three phases of the journey. Numbered because the order is real — each
 * stage needs the one before it — not as decoration.
 */
export default function JourneyRail() {
  return (
    <ol className="grid gap-8 sm:grid-cols-3 sm:gap-6">
      {JOURNEY_STAGES.map((stage, index) => {
        const last = index === JOURNEY_STAGES.length - 1;

        return (
          <li key={stage.id} className="relative flex gap-4 sm:block">
            {/* Marker centre to marker centre, passing behind the next marker. */}
            {!last && (
              <span
                aria-hidden="true"
                className={[
                  SEGMENT_BASE,
                  'h-[calc(100%+2rem)] w-px',
                  'sm:h-px sm:w-[calc(100%+1.5rem)] sm:translate-x-0 sm:-translate-y-1/2',
                ].join(' ')}
              />
            )}

            <span className="journey-marker relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold tabular">
              {index + 1}
            </span>

            <div className="sm:mt-4">
              <h3 className="font-semibold text-ink">{stage.label}</h3>
              <p className="mt-1 max-w-[30ch] text-sm leading-relaxed text-ink-soft">
                {stage.blurb}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
