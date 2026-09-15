import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export const STORAGE_KEY = 'rerouteher.guestSession';

/**
 * The journey lives for the tab, not for the browser.
 *
 * A reload must not cost her the answers she has given, so it is stored rather
 * than held in memory. Closing the tab is the end of the visit, though, and
 * leaving a CV, a snapshot and a readiness score behind on what is often a
 * shared or borrowed laptop is not something she asked for. `sessionStorage`
 * is exactly that line: it survives a refresh and dies with the tab.
 *
 * Nothing is lost by it for an account holder — her plan is saved to the
 * account on every change, and signing in brings all of it back.
 */
export const sessionBacked = () =>
  createJSONStorage(() => (typeof sessionStorage === 'undefined' ? undefined : sessionStorage));

/** @type {import('../types/intake.js').IntakeState} */
const initialState = {
  cv: null,
  cvParsed: false,
  break: { duration_years: 0, activities: [] },
  employerPriorities: [],
  snapshot: null,
  selectedRole: null,
  gapResult: null,
  currentStepIndex: 0,
  previousPlan: null,
};

const emptyBreak = () => ({ duration_years: 0, activities: [] });

/**
 * Whether a plan holds anything a woman would be sorry to lose.
 *
 * A CV read, or a snapshot built. Not the empty shape an account is created
 * with when someone signs up before starting, which must never be allowed to
 * stand in for real work.
 *
 * @param {object | null | undefined} plan
 */
export const hasJourney = (plan) => Boolean(plan?.cvParsed || plan?.snapshot);

/**
 * The journey itself, as opposed to the store that holds it. Named explicitly
 * so what travels to an account is a decision rather than whatever `getState`
 * happens to return.
 */
export const PLAN_FIELDS = [
  'cv',
  'cvParsed',
  'break',
  'employerPriorities',
  'snapshot',
  'selectedRole',
  'gapResult',
  'currentStepIndex',
];

// State owned by pages after the changed one, cleared in the mutators so a stale
// result never survives an upstream edit (journey order lives in config/flowSteps.js).
const resetAfterBreak = () => ({ snapshot: null, selectedRole: null, gapResult: null });
const resetAfterCv = () => ({ break: emptyBreak(), ...resetAfterBreak() });

/**
 * The finished journey, held aside before a new CV overwrites it.
 *
 * Replacing the CV clears everything downstream of it, which leaves her with
 * nothing at all if she abandons the redo halfway: no old snapshot, no new one.
 * The stash makes that recoverable until the redo produces its own gap.
 *
 * Only a plan that reached a snapshot is worth keeping. Returns null once a
 * redo is already under way, so a second upload cannot overwrite the stash
 * with the half-built plan the first one left behind.
 */
const stash = (state) =>
  state.snapshot ? Object.fromEntries(PLAN_FIELDS.map((field) => [field, state[field]])) : null;

export const useIntakeStore = create(
  persist(
    (set, get) => ({
      ...initialState,

      setCv: (cv) =>
        set((state) => ({
          cv,
          cvParsed: true,
          previousPlan: stash(state) ?? state.previousPlan,
          ...resetAfterCv(),
        })),

      clearCv: () =>
        set((state) => ({
          cv: null,
          cvParsed: false,
          previousPlan: stash(state) ?? state.previousPlan,
          ...resetAfterCv(),
        })),

      setBreakDuration: (years) =>
        set((state) => ({
          break: { ...state.break, duration_years: years },
          ...resetAfterBreak(),
        })),

      // Whole-break set used when the companion returns a break in journey_update;
      // mirrors the page path's downstream reset so chat and page stay interchangeable.
      setBreak: (careerBreak) =>
        set(() => ({
          break: {
            duration_years: careerBreak?.duration_years ?? 0,
            activities: careerBreak?.activities ?? [],
          },
          ...resetAfterBreak(),
        })),

      toggleActivity: (id) =>
        set((state) => {
          const selected = state.break.activities;
          return {
            break: {
              ...state.break,
              activities: selected.includes(id)
                ? selected.filter((a) => a !== id)
                : [...selected, id],
            },
            ...resetAfterBreak(),
          };
        }),

      /* Replaced wholesale rather than toggled here: the cap on how many she
         may pick belongs to the screen that shows the cap, not to the store. */
      setEmployerPriorities: (employerPriorities) => set({ employerPriorities }),

      setSnapshot: (snapshot) =>
        set({
          snapshot,
          // Index 0 is her previous occupation and the default target role. Held as the
          // full role object ({ role, role_id, similarity }) so the gap resolves by id.
          selectedRole: snapshot?.recommended_roles?.[0] ?? null,
          // Drop any gap from a previous snapshot so it is recomputed for the new role.
          gapResult: null,
        }),

      setSelectedRole: (role) => set({ selectedRole: role, gapResult: null }),
      // A gap means the redo is finished and has replaced what it set out to
      // replace, so there is no longer an earlier plan to go back to.
      setGapResult: (gapResult) => set({ gapResult, previousPlan: null }),
      setCurrentStepIndex: (currentStepIndex) => set({ currentStepIndex }),

      /** True once at least one activity is recorded. Duration 0 ("less than a year") is valid. */
      canGenerateSnapshot: () => {
        const { break: careerBreak } = get();
        return careerBreak.activities.length > 0;
      },

      /** What gets saved to an account (US5.3). */
      exportPlan: () => {
        const state = get();
        return Object.fromEntries(PLAN_FIELDS.map((field) => [field, state[field]]));
      },

      /**
       * What comes back when she signs in on any device (US5.4). Unknown keys
       * are dropped, so a plan saved by an older version cannot inject state.
       */
      importPlan: (plan) => {
        if (!plan) return;
        set(Object.fromEntries(PLAN_FIELDS.filter((f) => f in plan).map((f) => [f, plan[f]])));
      },

      /** Abandon the redo and put back the journey it was overwriting. */
      restorePreviousPlan: () =>
        set((state) =>
          state.previousPlan ? { ...state.previousPlan, previousPlan: null } : state
        ),

      /** Commit to the redo: the earlier journey stops being offered back. */
      discardPreviousPlan: () => set({ previousPlan: null }),

      reset: () => set(initialState),
    }),
    // v2: selectedRole is the full role object, not a role-title string.
    { name: STORAGE_KEY, version: 2, storage: sessionBacked() }
  )
);
