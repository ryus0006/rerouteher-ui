import { create } from 'zustand';

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
