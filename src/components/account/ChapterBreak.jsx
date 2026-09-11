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
    to: '/plan/employers',
    action: 'Find employers',
  },
];

/**
 * The end of the gap screen, which is the end of a chapter rather than of the
 * product: her readiness is a diagnosis, and both halves of the treatment sit
 * behind this card.
 *
 * It says what each thing is for rather than showing it dimmed or reciting its
 * contents: she has just read her focus areas a few centimetres above, and
 * listing them again here made the card longer without making it clearer.
 *
 * The two people who reach it need opposite things. A guest has to be told the
 * plan exists and given an account to keep it in. Someone signed in already
 * has both, and needs a door — without one she was left on a dead end, with
 * her learning plan reachable only by noticing a link in the header.
 */
export default function ChapterBreak() {
  const user = useAccountStore((state) => state.user);
  const openSheet = useAccountStore((state) => state.openSheet);

  return (
    <section
      aria-labelledby="whats-next-title"
      className="mt-10 overflow-hidden rounded-3xl bg-plane text-on-plane shadow-plane"
    >
      <div aria-hidden="true" className="h-1 bg-grad-rule" />

      <div className="p-6 sm:p-8">
        <p className="eyebrow text-on-plane-soft">What&rsquo;s next</p>
        <h2
          id="whats-next-title"
          className="mt-2 max-w-[24ch] font-display text-2xl font-bold leading-tight sm:text-3xl"
        >
          Now turn it into a plan.
        </h2>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {NEXT_PANELS.map((panel) =>
            user ? (
              <Link
                key={panel.id}
                to={panel.to}
                className="group rounded-2xl bg-plane-2 p-5 transition duration-200 ease-spring hover:-translate-y-px hover:bg-plane-2/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <h3 className="font-semibold">{panel.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-on-plane-soft">{panel.body}</p>
                <p className="mt-3 text-sm font-semibold">
                  {panel.action}
                  <span
                    aria-hidden="true"
                    className="ml-1 inline-block transition-transform duration-200 ease-spring group-hover:translate-x-0.5"
                  >
                    →
                  </span>
                </p>
              </Link>
            ) : (
              <div key={panel.id} className="rounded-2xl bg-plane-2 p-5">
                <h3 className="font-semibold">{panel.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-on-plane-soft">{panel.body}</p>
              </div>
            )
          )}
        </div>

        {!user && (
          <>
            <button
              type="button"
              onClick={() => openSheet('create')}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-ink shadow-card transition duration-200 ease-spring hover:-translate-y-px hover:shadow-card-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Create a free account
              <span aria-hidden="true">→</span>
            </button>

            <p className="mt-4 text-sm text-on-plane-soft">
              A username and a password, no email. Your plan stays on this device either way.
            </p>
          </>
        )}
      </div>
    </section>
  );
}
