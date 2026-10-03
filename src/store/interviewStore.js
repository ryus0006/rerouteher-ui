import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { sessionBacked } from './intakeStore.js';

export const INTERVIEW_STORAGE_KEY = 'rerouteher.interviewPractice';

/**
 * @typedef {{ id: string, text: string, kind: 'general' | 'role_specific', role: { role: string, role_id: string }, focus: string }} PracticeQuestion
 * @typedef {{ summary: string, worked_well: { area: string, detail: string }[], to_improve: { area: string, detail: string }[] }} AnswerFeedback
 * @typedef {{ id: string, transcript: string, seconds: number, feedback: AnswerFeedback | null, at: number }} Attempt
 */

const initialState = {
  /** @type {{ role: { role: string, role_id: string }, focus: string } | null} */
  setup: null,
  /** Questions in the current set. @type {PracticeQuestion[]} */
  questions: [],
  index: 0,
  /** Attempts keyed by question id, oldest first. @type {Record<string, Attempt[]>} */
  attempts: {},
  /** Answered questions from previous sets, retained for feedback aggregation. @type {PracticeQuestion[]} */
  earlier: [],
  /** Whether any set has been completed; unlocks the areas-to-improve view. */
  finishedASet: false,
};

const answered = (attempts, question) => (attempts[question.id] ?? []).length > 0;

/**
 * Interview practice state, persisted for the tab session.
 *
 * Each question records the role and focus it was generated with, so a setup
 * change mid-set only affects subsequent questions.
 */
export const useInterviewStore = create(
  persist(
    (set) => ({
      ...initialState,

      setSetup: (setup) => set({ setup }),

      /** Starts a new set; answered questions from the current set move to `earlier`. */
      startSet: (setup, questions) =>
        set((state) => ({
          setup,
          questions,
          index: 0,
          earlier: [
            ...state.earlier,
            ...state.questions.filter((q) => answered(state.attempts, q)),
          ],
        })),

      /**
       * Applies a new setup to the rest of the set: unanswered questions from the
       * current index onward are replaced; answered questions are unchanged.
       */
      replaceUpcoming: (setup, replacements) =>
        set((state) => {
          const queue = [...replacements];
          const questions = state.questions.map((question, position) =>
            position >= state.index && !answered(state.attempts, question) && queue.length > 0
              ? queue.shift()
              : question
          );
          return { setup, questions };
        }),

      goTo: (index) =>
        set((state) => ({ index: Math.max(0, Math.min(index, state.questions.length - 1)) })),

      addAttempt: (questionId, attempt) =>
        set((state) => ({
          attempts: {
            ...state.attempts,
            [questionId]: [...(state.attempts[questionId] ?? []), attempt],
          },
        })),

      updateAttempt: (questionId, attemptId, change) =>
        set((state) => ({
          attempts: {
            ...state.attempts,
            [questionId]: (state.attempts[questionId] ?? []).map((attempt) =>
              attempt.id === attemptId ? { ...attempt, ...change } : attempt
            ),
          },
        })),

      finishSet: () => set({ finishedASet: true }),

      reset: () => set(initialState),
    }),
    { name: INTERVIEW_STORAGE_KEY, version: 1, storage: sessionBacked() }
  )
);

/** Number of unanswered questions from `index` onward, i.e. those a setup change would replace. */
export function upcomingCount({ questions, attempts, index }) {
  return questions.filter(
    (question, position) => position >= index && !answered(attempts, question)
  ).length;
}
