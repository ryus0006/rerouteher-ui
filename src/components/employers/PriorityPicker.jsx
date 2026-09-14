import PriorityIcon from './PriorityIcon.jsx';
import { EMPLOYER_PRIORITIES, MAX_PRIORITIES } from '../../config/employerPriorities.js';

/**
 * One priority, as a card she can weigh rather than a checkbox in a list.
 *
 * The blurb is the whole point of the card: "Parental Support" alone would have
 * her guessing, while naming maternity leave, paternity leave and nursing rooms
 * tells her what an employer would have to have published to match.
 *
 * A card she cannot pick because the cap is reached is dimmed but stays
 * readable — she needs to see what she is choosing between.
 */
function PriorityCard({ priority, checked, blocked, onToggle }) {
  return (
    <label
      className={[
        'flex h-full cursor-pointer flex-col rounded-2xl border p-4 transition duration-200 ease-spring',
        'has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-blue-600',
        checked
          ? 'border-pink-600 bg-pink-100'
          : blocked
            ? 'cursor-not-allowed border-line bg-surface opacity-45'
            : 'border-line bg-surface hover:border-pink-600/40 hover:shadow-card',
      ].join(' ')}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={blocked}
        onChange={onToggle}
        className="sr-only"
      />

      <span className="flex items-center gap-2.5">
        <PriorityIcon
          id={priority.id}
          className={`size-5 shrink-0 ${checked ? 'text-pink-600' : 'text-ink-faint'}`}
        />
        <span className="min-w-0 flex-1 font-display text-base font-bold tracking-[-0.01em] text-ink">
          {priority.name}
        </span>

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
              <path d="m3.5 8.5 3 3 6-7" />
            </svg>
          )}
        </span>
      </span>

      <span className="mt-1.5 text-sm leading-snug text-ink-soft">{priority.blurb}</span>
    </label>
  );
}

/**
 * The five priorities, capped at three.
 *
 * Shared by the intake step that asks the question and the screen that lets her
 * change her answer, so the same choice looks the same in both places. The
 * column count is the caller's, because Tailwind's breakpoints measure the
 * window rather than the column: three across would fit the plan page and
 * silently wrap every second title in the narrower intake one.
 */
export default function PriorityPicker({ chosen, columns = 3, onToggle }) {
  const full = chosen.length >= MAX_PRIORITIES;

  return (
    <ul className={`grid gap-3 sm:grid-cols-2 ${columns === 3 ? 'lg:grid-cols-3' : ''}`}>
      {EMPLOYER_PRIORITIES.map((priority) => {
        const checked = chosen.includes(priority.id);

        return (
          <li key={priority.id}>
            <PriorityCard
              priority={priority}
              checked={checked}
              blocked={full && !checked}
              onToggle={() => onToggle(priority.id)}
            />
          </li>
        );
      })}
    </ul>
  );
}
