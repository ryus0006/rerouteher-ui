import { Check } from '@phosphor-icons/react';
import { FLOW_STEPS } from '../../config/flowSteps.js';

/**
 * Progress across the five diagnostic screens, as one segmented track with
 * each step named under its segment. Steps before `currentIndex` read as
 * complete; the rest are upcoming.
 */
export default function IntakeStepper({ currentIndex }) {
  return (
    <ol className="intake-steps" aria-label="Diagnostic progress">
      {FLOW_STEPS.map((step, index) => {
        const complete = index < currentIndex;
        const current = index === currentIndex;
        const state = complete ? 'complete' : current ? 'current' : 'upcoming';

        return (
          <li
            key={step.id}
            data-state={state}
            aria-current={current ? 'step' : undefined}
            className="intake-step"
          >
            <span aria-hidden="true" className="intake-step-track">
              <span className="intake-step-fill" />
            </span>
            <span className="intake-step-number tabular" aria-hidden="true">
              {complete ? (
                <Check weight="bold" className="size-3" />
              ) : (
                String(index + 1).padStart(2, '0')
              )}
            </span>
            <span className="intake-step-label">
              {step.label}
              <span className="sr-only">
                {complete ? ' completed' : current ? ' current step' : ' not started'}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
