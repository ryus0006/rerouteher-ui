import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export const STORAGE_KEY = 'rerouteher.guestSession';

/**
 * Session-scoped persistence: state survives reloads but is cleared when the
 * tab closes, so personal data is not left on shared devices. Signed-in users'
 * plans are also saved to their account on every change.
 */
export const sessionBacked = () =>
  createJSONStorage(() => (typeof sessionStorage === 'undefined' ? undefined : sessionStorage));

/** @type {import('../types/intake.js').IntakeState} */
const initialState = {
  cv: null,
  cvParsed: false,
  break: { duration_years: 0, activities: [] },
  employerPriorities: [],
  // Skills confirmed from the previous-role checklist in the companion. Merged into
  // the snapshot's professional skills and cleared whenever the snapshot is.
  confirmedSkills: [],
  // Latest employer matches, mirrored here so the companion can reference them.
  // Derived data; cleared when priorities change or the snapshot resets.
  employerMatches: [],
  learningCompleted: [],
  // CV drafts, one per role (see openCvBook). Saved with the journey and cleared
  // whenever upstream profile data changes.
  cvDraft: null,
  snapshot: null,
  selectedRole: null,
  gapResult: null,
  currentStepIndex: 0,
  previousPlan: null,
};

const emptyBreak = () => ({ duration_years: 0, activities: [] });

/**
 * Whether a plan contains user progress (a parsed CV or a snapshot), as
 * opposed to the empty plan stored for an account created before starting.
 *
 * @param {object | null | undefined} plan
 */
export const hasJourney = (plan) => Boolean(plan?.cvParsed || plan?.snapshot);

/**
 * Store fields that make up the saved plan. Listed explicitly so only these
 * fields are exported to and imported from the account.
 */
export const PLAN_FIELDS = [
  'cv',
  'cvParsed',
  'break',
  'employerPriorities',
  'learningCompleted',
  'cvDraft',
  'confirmedSkills',
  'snapshot',
  'selectedRole',
  'gapResult',
  'currentStepIndex',
];

// Downstream state cleared by the mutators so stale results never survive an
// upstream edit (step order is defined in config/flowSteps.js). confirmedSkills
// feed the snapshot, so they are cleared with it.
const resetAfterBreak = () => ({
  confirmedSkills: [],
  employerMatches: [],
  cvDraft: null,
  snapshot: null,
  selectedRole: null,
  gapResult: null,
});
const resetAfterCv = () => ({ break: emptyBreak(), ...resetAfterBreak() });

/**
 * Snapshot of the current plan, taken before a new CV replaces it, so an
 * abandoned redo can be restored until the redo produces a new gap result.
 *
 * Returns null if the plan has no snapshot, or if a redo is already in
 * progress, so a second upload cannot overwrite the stash with a partial plan.
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

      // Replaces the whole break (used for companion `journey_update`), applying the
      // same downstream reset as the page actions.
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

      // Replaces the full selection and clears matches computed from the previous set.
      setEmployerPriorities: (employerPriorities) =>
        set({ employerPriorities, employerMatches: [] }),
      setEmployerMatches: (employerMatches) => set({ employerMatches: employerMatches ?? [] }),
      toggleLearningCompleted: (resourceId) =>
        set((state) => ({
          learningCompleted: state.learningCompleted.includes(resourceId)
            ? state.learningCompleted.filter((id) => id !== resourceId)
            : [...state.learningCompleted, resourceId],
        })),

      setConfirmedSkills: (confirmedSkills) => set({ confirmedSkills: confirmedSkills ?? [] }),
      addConfirmedSkills: (skills) =>
        set((state) => {
          const byId = new Map(state.confirmedSkills.map((s) => [s.skill_id, s]));
          for (const s of skills ?? []) if (s?.skill_id) byId.set(s.skill_id, s);
          return { confirmedSkills: [...byId.values()] };
        }),

      setSnapshot: (snapshot) =>
        set({
          snapshot,
          // Index 0 is the previous occupation and the default target role. Stored as the
          // full role object ({ role, role_id, similarity }) so the gap is resolved by id.
          selectedRole: snapshot?.recommended_roles?.[0] ?? null,
          // Drop any gap from a previous snapshot so it is recomputed for the new role.
          gapResult: null,
        }),

      setSelectedRole: (role) => set({ selectedRole: role, gapResult: null }),
      // A new gap result completes any redo, so the stashed previous plan is discarded.
      setGapResult: (gapResult) => set({ gapResult, previousPlan: null }),
      setCvDraft: (cvDraft) => set({ cvDraft }),
      setCurrentStepIndex: (currentStepIndex) => set({ currentStepIndex }),

      /** True once at least one activity is recorded. Duration 0 ("less than a year") is valid. */
      canGenerateSnapshot: () => {
        const { break: careerBreak } = get();
        return careerBreak.activities.length > 0;
      },

      /** Returns the plan fields to save to the account. */
      exportPlan: () => {
        const state = get();
        return Object.fromEntries(PLAN_FIELDS.map((field) => [field, state[field]]));
      },

      /**
       * Loads a plan from the account. Keys outside PLAN_FIELDS are ignored so
       * stored data cannot inject arbitrary state.
       */
      importPlan: (plan) => {
        if (!plan) return;
        set(Object.fromEntries(PLAN_FIELDS.filter((f) => f in plan).map((f) => [f, plan[f]])));
      },

      /** Abandons the redo and restores the stashed previous plan. */
      restorePreviousPlan: () =>
        set((state) =>
          state.previousPlan ? { ...state.previousPlan, previousPlan: null } : state
        ),

      /** Discards the stashed previous plan. */
      discardPreviousPlan: () => set({ previousPlan: null }),

      reset: () => set(initialState),
    }),
    // v2: selectedRole is the full role object, not a role-title string.
    { name: STORAGE_KEY, version: 2, storage: sessionBacked() }
  )
);
