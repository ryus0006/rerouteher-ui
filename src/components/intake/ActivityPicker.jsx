import { useId } from 'react';
import { ACTIVITY_TAXONOMY } from '../../config/activityTaxonomy.js';

const CHIP =
  'cursor-pointer rounded-full border px-3.5 py-1.5 text-sm transition duration-200 ease-spring has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-blue-600';

const CHIP_STATE = {
  on: 'border-blue-600 bg-blue-600 font-medium text-white shadow-card',
  off: 'border-line-strong bg-surface text-ink-soft hover:border-blue-600/45 hover:text-ink',
};

export default function ActivityPicker({ selected, onToggle }) {
  const labelId = useId();

  return (
    <div>
      <p id={labelId} className="text-sm font-semibold text-ink">
        2. What did you do during this time? <span className="text-pink-600">*</span>
      </p>

      <p className="mt-1 text-xs text-ink-soft">
        Pick everything that applies — caregiving, household management, volunteering, side
        projects.
      </p>

      <div className="mt-5 space-y-4" role="group" aria-labelledby={labelId}>
        {ACTIVITY_TAXONOMY.map((category) => {
          const headingId = `${labelId}-${category.id}`;

          return (
            /* The category name sits in a fixed gutter so the chips get the full
               remaining width and the four groups stay scannable down one edge. */
            <div
              key={category.id}
              role="group"
              aria-labelledby={headingId}
              className="sm:grid sm:grid-cols-[7.5rem_1fr] sm:items-start sm:gap-x-5"
            >
              <p id={headingId} className="eyebrow leading-4 sm:pt-2 sm:text-right">
                {category.label}
              </p>

              <div className="mt-2 flex flex-wrap gap-2 sm:mt-0">
                {category.activities.map((activity) => {
                  const checked = selected.includes(activity.id);

                  return (
                    <label
                      key={activity.id}
                      className={`${CHIP} ${checked ? CHIP_STATE.on : CHIP_STATE.off}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => onToggle(activity.id)}
                        className="sr-only"
                      />
                      {activity.label}
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
