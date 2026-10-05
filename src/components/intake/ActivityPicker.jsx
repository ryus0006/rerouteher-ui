import { useId } from 'react';
import { ACTIVITY_TAXONOMY } from '../../config/activityTaxonomy.js';

const CHIP =
  'cursor-pointer rounded-full border px-3.5 py-1.5 text-sm transition duration-200 ease-spring has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-blue-600';

const CHIP_STATE = {
  on: 'border-pink-600 bg-pink-600 font-medium text-white shadow-card',
  off: 'border-line-strong bg-surface text-ink-soft hover:border-pink-600/45 hover:text-ink',
};

export default function ActivityPicker({ selected, onToggle }) {
  const labelId = useId();

  return (
    <div>
      <p id={labelId} className="text-base font-semibold text-ink">
        2. What did you do during this time? <span className="text-pink-600">*</span>
      </p>

      <p className="mt-1 text-xs text-ink-soft">Pick everything that applies.</p>

      <div className="mt-6 space-y-5" role="group" aria-labelledby={labelId}>
        {ACTIVITY_TAXONOMY.map((category) => {
          const headingId = `${labelId}-${category.id}`;

          return (
            /* Each category is its own block, name above its chips, so wrapped
               chips stay visibly inside their category. */
            <div key={category.id} role="group" aria-labelledby={headingId}>
              <p id={headingId} className="eyebrow">
                {category.label}
              </p>

              <div className="mt-2.5 flex flex-wrap gap-2">
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
