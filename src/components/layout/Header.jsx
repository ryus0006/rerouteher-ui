import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { List, X } from '@phosphor-icons/react';
import useSmoothNavigate from '../../hooks/useSmoothNavigate.js';
import logoWebp from '../../assets/logo-full.webp';
import logoPng from '../../assets/logo-full.png';
import { useAccountStore } from '../../store/accountStore.js';
import { resolveDisplayName } from '../../api/account.js';
import { useIntakeStore } from '../../store/intakeStore.js';
import { journeyProgress } from '../../lib/journeyProgress.js';
import Avatar from '../account/Avatar.jsx';

/**
 * Global header: logo, main navigation and account controls.
 *
 * Guest and signed-in states share the same layout (label, avatar, action) so
 * the bar does not reflow on sign-in. When signed in, the name and avatar link
 * to the profile.
 */
export default function Header() {
  const user = useAccountStore((state) => state.user);
  const openSheet = useAccountStore((state) => state.openSheet);
  const signOut = useAccountStore((state) => state.signOut);

  const navigate = useSmoothNavigate();
  const { pathname } = useLocation();

  /* Below the lg breakpoint the links collapse into a menu panel. The menu
     records the page it was opened on, so it reads as closed after any
     navigation. */
  const [menuPath, setMenuPath] = useState(null);
  const menuOpen = menuPath === pathname;
  const setMenuOpen = (open) => setMenuPath(open ? pathname : null);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setMenuPath(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

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

  // Resolve via the helper: some stored accounts have no `displayName`.
  const name = user ? resolveDisplayName(user) : null;

  /* While the diagnostic is incomplete, its screens carry their own stepper,
     so "My journey" is left out of the header there. Once complete, it stays
     so a user revisiting a step can return to the journey page. */
  const inDiagnostic = pathname.startsWith('/diagnostic/') && progress.percent < 100;

  /* "My journey" is shown only to signed-in users. The remaining tools depend
     on the target role, so they appear once a gap result exists. The active
     item is marked as current rather than removed. */
  const unlocked = Boolean(gapResult);
  const links = [
    user &&
      !inDiagnostic && {
        to: '/journey',
        label: 'My journey',
        current: pathname === '/journey',
      },
    unlocked && {
      to: '/plan/learning',
      label: 'Learning plan',
      current: pathname === '/plan/learning',
    },
    unlocked && {
      to: '/plan/employers/matches',
      label: 'Employer fit',
      current: pathname.startsWith('/plan/employers'),
    },
    unlocked && {
      to: '/interview-practice',
      label: 'Interview practice',
      current: pathname === '/interview-practice',
    },
    unlocked && { to: '/plan/cv', label: 'CV builder', current: pathname === '/plan/cv' },
  ].filter(Boolean);

  // Signed-in users always get the menu: below lg it holds the sign-out action.
  const hasMenu = links.length > 0 || Boolean(user);

  const handleSignOut = () => {
    /* Navigate to the landing page and sign out in the same tick.
       React batches both updates, so no results page stays mounted to
       hit its missing-snapshot guard. Awaiting navigate would delay the
       sign-out and briefly leave the user's data on the device. */
    navigate('/');
    signOut();
  };

  return (
    <header className="page-bar max-lg:relative flex items-center gap-8 border-b border-line bg-surface py-4 sm:py-5">
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

      {links.length > 0 && (
        <nav aria-label="Main" className="flex items-center gap-1 max-lg:hidden">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              aria-current={link.current ? 'page' : undefined}
              className={[
                'flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600',
                link.current
                  ? 'bg-canvas-sunk text-ink'
                  : 'text-ink-soft hover:bg-canvas-sunk hover:text-ink',
              ].join(' ')}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}

      <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-4">
        {user ? (
          <div className="flex items-center gap-3">
            {/* Name and avatar share a single link to the profile. */}
            <Link
              to="/profile"
              className="flex items-center gap-3 rounded-full transition hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              <span className="hidden text-sm text-ink-soft sm:inline">{name}</span>
              <Avatar name={name} />
              <span className="sr-only">Your profile</span>
            </Link>
            {/* Below lg, sign-out moves into the menu panel. */}
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-full px-3 py-1.5 text-sm text-ink-soft transition hover:bg-canvas-sunk hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 max-lg:hidden"
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

        {/* Menu toggle, shown only below lg where the nav links are hidden. */}
        {hasMenu && (
          <button
            type="button"
            aria-expanded={menuOpen}
            aria-controls="site-menu"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen(!menuOpen)}
            className="-mr-2 flex size-10 items-center justify-center rounded-full text-ink transition hover:bg-canvas-sunk focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 lg:hidden"
          >
            {menuOpen ? (
              <X weight="bold" className="size-5" aria-hidden="true" />
            ) : (
              <List weight="bold" className="size-5" aria-hidden="true" />
            )}
          </button>
        )}
      </div>

      {hasMenu && menuOpen && (
        <>
          {/* Dims the page under the header; tapping it closes the menu. */}
          <button
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-x-0 top-full z-[44] h-dvh cursor-default bg-ink/15 lg:hidden"
          />
          {/* Drops down from the header: nav links, then profile and sign-out. */}
          <div
            id="site-menu"
            className="site-menu absolute inset-x-0 top-full z-[45] bg-surface px-4 pb-5 pt-2 lg:hidden"
          >
            {links.length > 0 && (
              <nav aria-label="Main menu" className="flex flex-col">
                {links.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    aria-current={link.current ? 'page' : undefined}
                    onClick={() => setMenuOpen(false)}
                    className={[
                      'flex min-h-12 items-center rounded-2xl px-4 text-base font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600',
                      link.current
                        ? 'bg-canvas-sunk text-ink'
                        : 'text-ink-soft hover:bg-canvas-sunk hover:text-ink',
                    ].join(' ')}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            )}

            {user && (
              <div className={`flex flex-col ${links.length > 0 ? 'mt-3' : ''}`}>
                <Link
                  to="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="flex min-h-12 items-center gap-3 rounded-2xl px-4 text-base font-medium text-ink-soft transition hover:bg-canvas-sunk hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  <Avatar name={name} />
                  <span className="min-w-0 truncate">{name}</span>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    handleSignOut();
                  }}
                  className="flex min-h-12 items-center rounded-2xl px-4 text-left text-base font-medium text-ink-soft transition hover:bg-canvas-sunk hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </header>
  );
}
