import { Link } from 'react-router-dom';
import { useAccountStore } from '../../store/accountStore.js';

const NEXT_PANELS = [
  {
    id: 'learning',
    title: 'Your learning plan',
    body: 'Courses for each focus area, with the time, cost and format.',
    to: '/plan/learning',
    action: 'Open your learning plan',
  },
  {
    id: 'employers',
    title: 'Employers who fit your life',
    body: 'Ranked on what you need, with the published policy behind each claim.',
    to: '/plan/employers/matches',
    action: 'See your matches',
  },
];

/**
 * Closing card on the gap screen linking to the learning plan and employer
 * matches.
 *
 * Each panel describes what the destination is for rather than repeating the
 * focus areas listed above it. Both links are available to guests; for guests
 * a single line below offers to save the journey to an account.
 */
export default function ChapterBreak() {
  const user = useAccountStore((state) => state.user);
  const openSheet = useAccountStore((state) => state.openSheet);

  return (
    <section
      aria-labelledby="whats-next-title"
      className="chapter-break mt-10 overflow-hidden rounded-3xl border border-line text-ink"
    >
      <div aria-hidden="true" className="h-1 bg-grad-rule" />

      <div className="p-6 sm:p-8">
        <p className="eyebrow">What&rsquo;s next</p>
        <h2
          id="whats-next-title"
          className="mt-2 max-w-[24ch] font-display text-2xl font-bold leading-tight sm:text-3xl"
        >
          Now turn it into a plan.
        </h2>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {NEXT_PANELS.map((panel) => (
            <Link
              key={panel.id}
              to={panel.to}
              className="group rounded-2xl border border-line bg-surface p-5 shadow-card transition duration-200 ease-spring hover:-translate-y-0.5 hover:border-line-strong hover:shadow-card-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              <h3 className="font-display font-bold tracking-[-0.01em] text-ink">{panel.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{panel.body}</p>
              <p className="mt-3 text-sm font-semibold text-pink-600">
                {panel.action}
                <span
                  aria-hidden="true"
                  className="ml-1 inline-block transition-transform duration-200 ease-spring group-hover:translate-x-0.5"
                >
                  →
                </span>
              </p>
            </Link>
          ))}
        </div>

        {/* Guest-only prompt explaining that progress is stored in this browser.
            Creating an account redirects to the journey dashboard, which links
            to both destinations above. */}
        {!user && (
          <p className="mt-5 text-sm text-ink-soft">
            Your plan lives in this tab.{' '}
            <button
              type="button"
              onClick={() => openSheet('create', '/journey')}
              className="rounded font-semibold text-ink underline underline-offset-4 transition hover:text-pink-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Keep it with an account
            </button>
            .
          </p>
        )}
      </div>
    </section>
  );
}
