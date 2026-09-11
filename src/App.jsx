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

  /* The companion closes on every move, and forgets which job it was opened
     for. Left open across a navigation it would answer about the last screen. */
  useEffect(() => {
    closeCompanion();
  }, [pathname, closeCompanion]);

  return (
    <>
      <Outlet />
      <ScrollRestoration />
      <AccountSheet />
      {/* Everywhere but the landing page: there, nothing of hers exists yet, so
          a companion offering to explain her results would have none to read.
          Before a snapshot exists it offers the conversational route into one
          (US8.1) rather than to explain results she does not have (US8.2). */}
      {pathname !== '/' && <Companion defaultMode={snapshot ? 'ask' : 'build'} />}
    </>
  );
}
