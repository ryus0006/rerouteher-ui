import { Link, useLocation } from 'react-router-dom';
import useSmoothNavigate from '../../hooks/useSmoothNavigate.js';
import logoWebp from '../../assets/logo-full.webp';
import logoPng from '../../assets/logo-full.png';
import { useAccountStore } from '../../store/accountStore.js';
import { resolveDisplayName } from '../../api/account.js';
import { useIntakeStore } from '../../store/intakeStore.js';
import { journeyProgress } from '../../lib/journeyProgress.js';
import Avatar from '../account/Avatar.jsx';

/**
 * Logo, and the account state on the right.
 *
 * The guest and signed-in states share one shape — label, avatar, action — so
 * signing in reads as the same slot changing rather than the bar reflowing.
 * Once signed in, the label and avatar together are the link to the profile.
 *
 * Signing out lives inside the menu rather than the bar: it is a once-a-session,
 * mildly destructive action, and a permanent top-level slot for it reads as an
 * account-first product.
 */
const RING_RADIUS = 7;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

/** How much of the diagnostic is done, small enough to sit inside a nav link. */
function ProgressRing({ percent }) {
  return (
    <span className="relative flex size-4 shrink-0">
      <svg viewBox="0 0 18 18" className="size-4 -rotate-90" aria-hidden="true">
        <circle
          cx="9"
          cy="9"
          r={RING_RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          opacity="0.2"
        />
        <circle
          cx="9"
          cy="9"
          r={RING_RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={RING_CIRCUMFERENCE * (1 - percent / 100)}
        />
      </svg>
      <span className="sr-only">{percent}% complete</span>
    </span>
  );
}

export default function Header({ onGround = false }) {
  const user = useAccountStore((state) => state.user);
  const openSheet = useAccountStore((state) => state.openSheet);
  const signOut = useAccountStore((state) => state.signOut);

  const navigate = useSmoothNavigate();
  const { pathname } = useLocation();

  const cvParsed = useIntakeStore((state) => state.cvParsed);
  const activities = useIntakeStore((state) => state.break?.activities);
  const employerPriorities = useIntakeStore((state) => state.employerPriorities);
  const snapshot = useIntakeStore((state) => state.snapshot);
  const gapResult = useIntakeStore((state) => state.gapResult);
  const progress = journeyProgress({
    cvParsed,
    activities,
    employerPriorities,
    snapshot,
    gapResult,
  });

  // Never read `displayName` straight: an account stored before display names
  // existed has only a username, and the bar must still render.
  const name = user ? resolveDisplayName(user) : null;

  /* The journey belongs to an account, so the door only exists for one. Hidden
     rather than shown disabled: a dead control a guest cannot use explains
     nothing, and the Sign in beside it is already the way to earn it.

     For an account holder it is always there, including on the journey itself,
     where it marks the current page instead of vanishing. A nav item that
     disappears once you arrive makes the bar look like it lost something. */
  const showJourney = Boolean(user);
  const onJourney = pathname === '/journey';

  /* The ring is a nudge to finish, so it retires the moment finishing is done.
     A meter pinned at 100% forever is decoration, and the slot is wanted for
     roadmap progress later. */
  const showProgress = progress.percent < 100;

  return (
    <header
      className={[
        'flex items-center justify-between gap-4 px-5 py-4 sm:px-8 sm:py-5',
        onGround ? '' : 'border-b border-line bg-surface',
      ].join(' ')}
    >
      <Link
        to="/"
        aria-label="ReRouteHer — new paths, still you — home"
        className="inline-block shrink-0 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600"
      >
        <picture>
          <source srcSet={logoWebp} type="image/webp" />
          <img
            src={logoPng}
            alt="ReRouteHer — new paths, still you"
            width={752}
            height={192}
            className="h-9 w-auto sm:h-10"
          />
        </picture>
      </Link>

      <div className="flex items-center gap-2 sm:gap-4">
        {showJourney && (
          <Link
            to="/journey"
            aria-current={onJourney ? 'page' : undefined}
            className={[
              'flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600',
              onJourney
                ? 'bg-canvas-sunk text-ink'
                : 'text-ink-soft hover:bg-canvas-sunk hover:text-ink',
            ].join(' ')}
          >
            {showProgress && <ProgressRing percent={progress.percent} />}
            My journey
          </Link>
        )}

        {user ? (
          <div className="flex items-center gap-3">
            {/* Name and avatar are one target, not two: they read as a single
              identity, and splitting them would give the same destination two
              hit areas of very different size. */}
            <Link
              to="/profile"
              className="flex items-center gap-3 rounded-full transition hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              <span className="hidden text-sm text-ink-soft sm:inline">{name}</span>
              <Avatar name={name} />
              <span className="sr-only">Your profile</span>
            </Link>
            <button
              type="button"
              onClick={async () => {
                /* Nothing signed-out belongs on her journey, and the landing page
                   is the only screen that explains the service from scratch.
                   Leave first, clear second: clearing while a results page is
                   still mounted trips its no-snapshot guard, which redirects to
                   the CV upload and overrides the navigation to the landing. */
                await navigate('/');
                signOut();
              }}
              className="rounded-full px-3 py-1.5 text-sm text-ink-soft transition hover:bg-canvas-sunk hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Sign out
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-ink-faint sm:inline">Guest</span>
            <span
              aria-hidden="true"
              className="flex size-8 items-center justify-center rounded-full border border-line bg-canvas-sunk text-ink-faint"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="size-4">
                <path d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm0 1.75c-3.9 0-7.25 2.06-7.25 4.6 0 1.05.82 1.9 1.83 1.9h10.84c1.01 0 1.83-.85 1.83-1.9 0-2.54-3.35-4.6-7.25-4.6Z" />
              </svg>
            </span>
            <button
              type="button"
              onClick={() => openSheet('signIn')}
              className="rounded-full px-3.5 py-1.5 text-sm font-medium text-ink-soft transition hover:bg-canvas-sunk hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Sign in
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
