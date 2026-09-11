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
export const useCompanionStore = create((set) => ({
  open: false,
  /** @type {CompanionMode} */
  mode: 'ask',

  openCompanion: (mode = 'ask') => set({ open: true, mode }),
  closeCompanion: () => set({ open: false }),
  toggleCompanion: (mode = 'ask') =>
    set((state) => (state.open ? { open: false } : { open: true, mode })),
}));
