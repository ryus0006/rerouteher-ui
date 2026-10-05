import { Link } from 'react-router-dom';
import { useAccountStore } from '../../store/accountStore.js';

const NEXT_PANELS = [
  {
    id: 'learning',
    title: 'Your learning plan',
    body: 'Learning for each focus area, with the time and cost of each.',
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
 * focus areas listed above it. Only the button in each panel is a link. Both
 * links are available to guests; for guests a single line below offers to save
 * the journey to an account.
 */
export default function ChapterBreak() {
  const user = useAccountStore((state) => state.user);
  const openSheet = useAccountStore((state) => state.openSheet);

  return (
    <section
      aria-labelledby="whats-next-title"
      className="chapter-break mt-10 rounded-3xl p-6 text-ink sm:p-8"
    >
      <p className="eyebrow">What&rsquo;s next</p>
      <h2
        id="whats-next-title"
        className="mt-2 max-w-[24ch] font-display text-2xl font-bold leading-tight tracking-[-0.015em] sm:text-3xl"
      >
        Now turn it into a plan.
      </h2>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {NEXT_PANELS.map((panel) => (
          <div
            key={panel.id}
            className="flex flex-col gap-5 rounded-2xl bg-surface p-6 shadow-card"
          >
            <div>
              <h3 className="font-display text-lg font-bold tracking-[-0.01em]">{panel.title}</h3>
              <p className="mt-1.5 max-w-[40ch] text-sm leading-relaxed text-ink-soft">
                {panel.body}
              </p>
            </div>

            <Link
              to={panel.to}
              className="group mt-auto self-start rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition duration-300 ease-spring hover:bg-plane-2 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              {panel.action}
              <span
                aria-hidden="true"
                className="ml-1.5 inline-block transition-transform duration-300 ease-spring group-hover:translate-x-0.5"
              >
                →
              </span>
            </Link>
          </div>
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
    </section>
  );
}
