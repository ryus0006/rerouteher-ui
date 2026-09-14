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
 * The end of the gap screen, which is the end of a chapter rather than of the
 * product: her readiness is a diagnosis, and both halves of the treatment sit
 * behind this card.
 *
 * It says what each thing is for rather than reciting its contents: she has
 * just read her focus areas a few centimetres above, and listing them again
 * here would lengthen the card without clarifying it.
 *
 * Both doors open for everyone. An account saves the journey rather than
 * buying the plan, so neither panel waits on one, and the offer to keep it is
 * a line of text below them rather than a third control beside them.
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

        {/* The only place after the diagnostic that says where her work lives.
            She is holding a readiness score here, so the tab it sits in is
            worth naming; on the landing page the same sentence lands before
            there is anything to lose. No redirect is passed, so signing up
            leaves her on this card to carry on through one of the panels. */}
        {!user && (
          <p className="mt-5 text-sm text-ink-soft">
            Your plan lives in this tab.{' '}
            <button
              type="button"
              onClick={() => openSheet('create')}
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
