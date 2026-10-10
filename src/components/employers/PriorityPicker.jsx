import PriorityIcon from './PriorityIcon.jsx';
import { EMPLOYER_PRIORITIES } from '../../config/employerPriorities.js';

/** Badge for a priority whose selection differs from the baseline search. */
function ChangeTag({ added }) {
  return (
    <span
      className={[
        'shrink-0 rounded-full px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-[0.12em]',
        added ? 'bg-white text-pink-600 ring-1 ring-pink-600/20' : 'bg-canvas-sunk text-ink-faint',
      ].join(' ')}
    >
      {added ? 'Added' : 'Removed'}
    </span>
  );
}

/**
 * Selectable card for one priority. The blurb lists the concrete policies an
 * employer must disclose to match (e.g. maternity leave, nursing rooms).
 */
function PriorityCard({ priority, checked, change, onToggle }) {
  return (
    <label
      className={[
        'flex h-full cursor-pointer flex-col rounded-2xl border p-5 transition duration-200 ease-spring active:scale-[0.98]',
        'has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-blue-600',
        checked
          ? 'border-pink-600 bg-pink-100'
          : 'border-line bg-surface hover:border-pink-600/40 hover:shadow-card',
      ].join(' ')}
    >
      <input type="checkbox" checked={checked} onChange={onToggle} className="sr-only" />

      <span className="flex items-center gap-2.5">
        <PriorityIcon
          id={priority.id}
          className={`size-5 shrink-0 ${checked ? 'text-pink-600' : 'text-ink-faint'}`}
        />
        <span className="min-w-0 flex-1 font-display text-base font-bold tracking-[-0.01em] text-ink">
          {priority.name}
        </span>
        {change && <ChangeTag added={change === 'added'} />}

        <span
          aria-hidden="true"
          className={[
            'flex size-5 shrink-0 items-center justify-center rounded-full border',
            checked ? 'border-pink-600 bg-pink-600 text-white' : 'border-line-strong',
          ].join(' ')}
        >
          {checked && (
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-3"
            >
              <path d="m3.5 8.5 3 3 6-7" pathLength="1" className="check-draw" />
            </svg>
          )}
        </span>
      </span>

      <span className="mt-2 text-[0.9375rem] leading-relaxed text-ink-soft">{priority.blurb}</span>
    </label>
  );
}

/**
 * Multi-select grid of employer priorities, used by the intake Priorities step
 * and the adjust-priorities page.
 *
 * Four priorities, so the cards sit two by two.
 *
 * `baseline` is the selection used for the last search. When provided, cards
 * whose state differs show an Added/Removed badge.
 */
export default function PriorityPicker({ chosen, baseline, onToggle }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {EMPLOYER_PRIORITIES.map((priority, index) => {
        const checked = chosen.includes(priority.id);
        const before = baseline ? baseline.includes(priority.id) : checked;
        const change = checked === before ? null : checked ? 'added' : 'removed';

        return (
          <li
            key={priority.id}
            className="rise-in"
            style={{ animationDelay: `${(index + 1) * 60}ms` }}
          >
            <PriorityCard
              priority={priority}
              checked={checked}
              change={change}
              onToggle={() => onToggle(priority.id)}
            />
          </li>
        );
      })}
    </ul>
  );
}
