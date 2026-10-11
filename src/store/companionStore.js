import { create } from 'zustand';

/**
 * Key for the guest companion thread's per-tab conversation id (see Companion.jsx's
 * getSessionId). Session-scoped like the rest of the guest plan, so it is exported
 * here for accountStore to clear on sign-out instead of leaking into the next guest.
 */
export const COMPANION_SESSION_KEY = 'rerouteher.companionSession';

/**
 * Companion open state and mode.
 *
 * Kept in a store so any screen can open the companion in a specific mode:
 * 'build' (create a profile through chat) or 'ask' (questions about results).
 *
 * @typedef {'ask' | 'build'} CompanionMode
 */
export const useCompanionStore = create((set, get) => ({
  open: false,
  /** @type {CompanionMode} */
  mode: 'ask',

  openCompanion: (mode = 'ask') => set({ open: true, mode }),
  closeCompanion: () => set({ open: false }),
  toggleCompanion: (mode = 'ask') =>
    set((state) => (state.open ? { open: false } : { open: true, mode })),

  // One-shot flag set before a companion-triggered navigation. The route-change
  // effect consumes it and keeps the chat open; other navigations close it.
  keepOpenNav: false,
  holdOpenAcrossNav: () => set({ keepOpenNav: true }),
  consumeKeepOpen: () => {
    const held = get().keepOpenNav;
    if (held) set({ keepOpenNav: false });
    return held;
  },
}));
