import { Navigate } from 'react-router-dom';
import useSmoothNavigate from '../../hooks/useSmoothNavigate.js';
import Header from '../../components/layout/Header.jsx';
import GradientButton from '../../components/ui/GradientButton.jsx';
import PriorityIcon from '../../components/employers/PriorityIcon.jsx';
import { EMPLOYER_PRIORITIES, MAX_PRIORITIES } from '../../config/employerPriorities.js';
import { useIntakeStore } from '../../store/intakeStore.js';

const HOW_IT_WORKS = [
  'Select the workplace priorities that matter to you',
  'We read the ESG and sustainability reports Malaysian listed companies publish',
  'You get the employers whose reports actually mention them',
];

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
 * Step one of the employer fit finder: what she is asking employers for.
 *
 * Separate from the results because it is a different question. The results
 * page answers "who fits"; this one asks "what does fitting mean to you", and
 * mixing them would let her tune the answer until she liked it.
 */
export default function EmployerFinder() {
  const navigate = useSmoothNavigate();
  const snapshot = useIntakeStore((state) => state.snapshot);
  const gapResult = useIntakeStore((state) => state.gapResult);
  const priorities = useIntakeStore((state) => state.employerPriorities);
  const setPriorities = useIntakeStore((state) => state.setEmployerPriorities);

  if (!snapshot || !gapResult) return <Navigate to="/diagnostic/gap" replace />;

  const chosen = priorities ?? [];
  const full = chosen.length >= MAX_PRIORITIES;

  function toggle(id) {
    setPriorities(chosen.includes(id) ? chosen.filter((value) => value !== id) : [...chosen, id]);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      {/* Tight enough that "Find employers" sits within the first screen: a
          choice you must scroll past its own button to make reads unfinished. */}
      <main className="mx-auto w-full max-w-[900px] flex-1 px-5 py-8 sm:px-6 sm:py-10">
        <p className="eyebrow text-pink-600">Employer fit finder</p>

        <h1 className="mt-1.5 max-w-[26ch] font-display text-2xl font-bold leading-[1.12] tracking-[-0.02em] text-ink sm:text-[2rem]">
          Find employers that support your return
        </h1>

        <p className="mt-2.5 max-w-[62ch] text-sm leading-relaxed text-ink-soft">
          Choose what matters most to you. We&rsquo;ll match you with Malaysian listed companies
          based on their publicly disclosed ESG and sustainability reports.
        </p>

        <div className="mt-7">
          <h2 className="font-display text-lg font-bold tracking-[-0.015em] text-ink">
            What matters most for your return?
          </h2>
          <p className="mt-1 text-sm text-ink-soft">Select up to {MAX_PRIORITIES} priorities.</p>
        </div>

        <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {EMPLOYER_PRIORITIES.map((priority) => {
            const checked = chosen.includes(priority.id);

            return (
              <li key={priority.id}>
                <PriorityCard
                  priority={priority}
                  checked={checked}
                  blocked={full && !checked}
                  onToggle={() => toggle(priority.id)}
                />
              </li>
            );
          })}
        </ul>

        <section className="mt-6 rounded-2xl border border-line bg-canvas-sunk px-5 py-4">
          <h2 className="text-sm font-semibold text-ink">How it works</h2>

          {/* Numbered because it genuinely is a sequence, and laid across rather
              than down because the three steps are one sentence between them. */}
          <ol className="mt-2.5 grid gap-3 sm:grid-cols-3">
            {HOW_IT_WORKS.map((step, index) => (
              <li key={step} className="flex items-start gap-2.5">
                <span className="mt-px flex size-5 shrink-0 items-center justify-center rounded-full bg-pink-600 text-xs font-semibold tabular text-white">
                  {index + 1}
                </span>
                <span className="text-sm leading-snug text-ink-soft">{step}</span>
              </li>
            ))}
          </ol>
        </section>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <GradientButton variant="secondary" size="md" onClick={() => navigate('/journey')}>
            Cancel
          </GradientButton>

          <GradientButton
            variant="accent"
            disabled={chosen.length === 0}
            onClick={() => navigate('/plan/employers/matches')}
          >
            Find employers
            <span aria-hidden="true">→</span>
          </GradientButton>
        </div>
      </main>
    </div>
  );
}
