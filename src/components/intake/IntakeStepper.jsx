import { Fragment } from 'react';
import { FLOW_STEPS } from '../../config/flowSteps.js';

const MARKER_STATE = {
  complete: 'border-ink bg-ink text-white',
  current: 'border-ink bg-ink text-white shadow-card',
  upcoming: 'border-line-strong bg-surface text-ink-faint',
};

const LABEL_STATE = {
  complete: 'text-ink-soft',
  current: 'font-semibold text-ink',
  upcoming: 'text-ink-faint',
};

// Markers size to their labels and the connectors absorb the slack, so the
// track always reaches both edges of the content column.
const CONNECTOR = 'mt-[15px] h-px flex-1';

/**
 * Progress across the four diagnostic screens. Steps before `currentIndex` read
 * as complete; the rest are upcoming.
 */
export default function IntakeStepper({ currentIndex }) {
  return (
    <ol className="flex items-start" aria-label="Diagnostic progress">
      {FLOW_STEPS.map((step, index) => {
        const complete = index < currentIndex;
        const current = index === currentIndex;
        const state = complete ? 'complete' : current ? 'current' : 'upcoming';
        // A connector belongs to the step on its right, so it is travelled as
        // soon as the step on its left is done.
        const travelled = index <= currentIndex;

        return (
          <Fragment key={step.id}>
            {index > 0 && (
              <li
                aria-hidden="true"
                className={`${CONNECTOR} ${travelled ? 'bg-ink/45' : 'bg-line-strong'}`}
              />
            )}

            <li
              data-state={state}
              aria-current={current ? 'step' : undefined}
              className="flex shrink-0 flex-col items-center gap-2 px-2"
            >
              <span
                className={`flex size-8 items-center justify-center rounded-full border text-xs font-semibold tabular transition ${MARKER_STATE[state]}`}
              >
                {complete ? '✓' : index + 1}
              </span>

              <span className={`text-center text-[0.6875rem] leading-tight ${LABEL_STATE[state]}`}>
                {step.label}
                <span className="sr-only">
                  {complete ? ' completed' : current ? ' current step' : ' not started'}
                </span>
              </span>
            </li>
          </Fragment>
        );
      })}
    </ol>
  );
}
