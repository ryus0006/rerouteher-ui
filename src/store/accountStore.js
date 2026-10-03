import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { signOut as signOutRequest } from '../api/account.js';
import { sessionBacked, useIntakeStore } from './intakeStore.js';
import { useInterviewStore } from './interviewStore.js';

export const ACCOUNT_STORAGE_KEY = 'rerouteher.account';

/**
 * Signed-in user and account sheet state.
 *
 * Holds no plan data (see `intakeStore`). Authentication uses a server-set
 * session cookie; no token is stored client-side.
 */
export const useAccountStore = create(
  persist(
    (set) => ({
      /**
       * `username` is the immutable login id; `displayName` is the editable name
       * shown in the UI.
       *
       * @type {{ username: string, displayName: string } | null}
       */
      user: null,

      /** @type {'create' | 'signIn' | null} Mode the account sheet is open in. */
      sheet: null,

      /**
       * Path to navigate to after a successful sign-in or account creation.
       * See `AccountSheet` for the default destinations when null.
       * @type {string | null}
       */
      sheetRedirect: null,

      openSheet: (mode, redirect = null) => set({ sheet: mode, sheetRedirect: redirect }),
      closeSheet: () => set({ sheet: null, sheetRedirect: null }),

      setUser: (user) => set({ user, sheet: null, sheetRedirect: null }),
      setDisplayName: (displayName) =>
        set((state) => (state.user ? { user: { ...state.user, displayName } } : state)),
      /**
       * Signs out and clears all local journey data, so nothing remains on a
       * shared device. Safe because `planSync` saves the plan to the account on
       * every change; signing in restores it.
       */
      signOut: () => {
        // Best-effort server sign-out; local state is cleared regardless of the result.
        signOutRequest().catch(() => {});
        set({ user: null, sheet: null });
        useIntakeStore.getState().reset();
        useInterviewStore.getState().reset();
      },
    }),
    {
      name: ACCOUNT_STORAGE_KEY,
      version: 2,
      /* Session-scoped, matching the journey store. Persisting longer would show
         a signed-in user with no local plan after the tab closes. */
      storage: sessionBacked(),
      // v1 state has no displayName; default it to the username.
      migrate: (state, version) =>
        version < 2 && state?.user
          ? { ...state, user: { ...state.user, displayName: state.user.username } }
          : state,
      // Persist only the user; sheet state is transient.
      partialize: (state) => ({ user: state.user }),
    }
  )
);
