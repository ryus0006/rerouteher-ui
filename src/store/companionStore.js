import { create } from 'zustand';

/**
 * Whether the companion is open, and what it is there to do.
 *
 * Held outside the component so a screen can open it for a specific job — the
 * CV step offering the conversational route into a profile (US8.1) is not the
 * same feature as asking about a result that already exists (US8.2).
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

  // Set right before a companion-driven navigation so the chat survives it; the
  // close-on-route effect consumes it once instead of closing. Normal link
  // clicks (no flag) still close the chat, so it never lingers across unrelated moves.
  keepOpenNav: false,
  holdOpenAcrossNav: () => set({ keepOpenNav: true }),
  consumeKeepOpen: () => {
    const held = get().keepOpenNav;
    if (held) set({ keepOpenNav: false });
    return held;
  },
}));
