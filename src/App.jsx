import { useEffect, useRef } from 'react';
import { Outlet, ScrollRestoration, useLocation } from 'react-router-dom';
import AccountSheet from './components/account/AccountSheet.jsx';
import Companion from './components/companion/Companion.jsx';
import { useIntakeStore } from './store/intakeStore.js';
import { useCompanionStore } from './store/companionStore.js';

export default function App() {
  const { pathname } = useLocation();
  const previousPath = useRef(pathname);
  const snapshot = useIntakeStore((state) => state.snapshot);
  const closeCompanion = useCompanionStore((state) => state.closeCompanion);

  useEffect(() => {
    if (previousPath.current === pathname) return;
    previousPath.current = pathname;
    // Announce the new screen without moving the scroll position a second time.
    const heading = document.querySelector('main h1');
    if (heading) {
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }
  }, [pathname]);

  /* Close the companion and reset its mode on every route change so it never
     answers about the previous screen. A navigation triggered from inside the
     companion sets a one-shot keep-open flag, consumed here, to keep the chat
     open across that move. */
  useEffect(() => {
    if (useCompanionStore.getState().consumeKeepOpen()) return;
    closeCompanion();
  }, [pathname, closeCompanion]);

  return (
    <>
      <Outlet />
      <ScrollRestoration />
      <AccountSheet />
      {/* Hidden on the landing page, where there is no user data to discuss.
          Before a snapshot exists the companion opens in build mode (create a
          profile through chat); afterwards it opens in ask mode (questions
          about results). */}
      {pathname !== '/' && <Companion defaultMode={snapshot ? 'ask' : 'build'} />}
    </>
  );
}
