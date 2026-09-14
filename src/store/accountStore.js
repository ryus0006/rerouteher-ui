import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { signOut as signOutRequest } from '../api/account.js';
import { sessionBacked, useIntakeStore } from './intakeStore.js';

export const ACCOUNT_STORAGE_KEY = 'rerouteher.account';

/**
 * Who is signed in, and whether the account sheet is open.
 *
 * Deliberately holds no plan data: the journey lives in `intakeStore`, and this
 * store only records whether it now has somewhere to be saved to. The session
 * itself is a cookie the server sets, never a token kept here.
 */
export const useAccountStore = create(
  persist(
    (set) => ({
      /**
       * `username` signs her in and never changes; `displayName` is what the
       * screen calls her and she can rewrite at will.
       *
       * @type {{ username: string, displayName: string } | null}
       */
      user: null,

      /** @type {'create' | 'signIn' | null} — which mode the sheet is open in */
      sheet: null,

      /**
       * Where to go after a successful create when guest work is being kept.
       * Set by the "What's next" card (US5.2.2 -> the journey dashboard); left
       * null by the header, so a mid-journey sign-up stays put (US5.2.3).
       * @type {string | null}
       */
      sheetRedirect: null,

      openSheet: (mode, redirect = null) => set({ sheet: mode, sheetRedirect: redirect }),
      closeSheet: () => set({ sheet: null, sheetRedirect: null }),

      setUser: (user) => set({ user, sheet: null, sheetRedirect: null }),
      setDisplayName: (displayName) =>
        set((state) => (state.user ? { user: { ...state.user, displayName } } : state)),
      /**
       * Signing out returns the device to a guest, with nothing of hers on it.
       *
       * The journey persists separately and would otherwise outlive the sign-out,
       * handing the next person to open the browser — a shared laptop, the common
       * case here — her CV, her snapshot and her readiness. Clearing it is only
       * safe because the plan is saved to the account on every change (see
       * `planSync`), so signing back in brings it all back.
       */
      signOut: () => {
        // Best-effort: drop the server session cookie. The local clear happens
        // regardless, so a failed request never traps her signed in on the device.
        signOutRequest().catch(() => {});
        set({ user: null, sheet: null });
        useIntakeStore.getState().reset();
      },
    }),
    {
      name: ACCOUNT_STORAGE_KEY,
      version: 2,
      /* Signed in for the tab, like the journey it belongs to. Outliving it
         would leave her apparently signed in with an empty dashboard, since
         the plan itself is gone and cannot be fetched back without her
         password. Signing in again restores the whole thing. */
      storage: sessionBacked(),
      // v1 accounts predate display names; the username is what they were shown by.
      migrate: (state, version) =>
        version < 2 && state?.user
          ? { ...state, user: { ...state.user, displayName: state.user.username } }
          : state,
      // `sheet` is view state for one visit; only identity outlives a reload.
      partialize: (state) => ({ user: state.user }),
    }
  )
);
