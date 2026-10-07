import { create } from 'zustand';
import {
  createSession,
  deleteSession,
  getSession,
  listSessions,
  refreshSession,
  retryFeedback,
  uploadAttempt,
} from '../api/interview.js';

/**
 * @typedef {{ session_id: string, role: { role_id: string, role_title: string }, practice_focus: string, status: string, progress: number }} SessionSummary
 * @typedef {{ session_id: string, role: { role_id: string, role_title: string }, practice_focus: string, status: string, questions: object[] }} SessionDetail
 */

const initialState = {
  /** @type {SessionSummary[]} */
  sessions: [],
  /** @type {SessionDetail | null} */
  current: null,
  /** Index of the question on screen within `current.questions`. */
  index: 0,
  /** @type {'practice' | 'complete'} */
  view: 'practice',
  loading: false,
  /** @type {string | null} */
  error: null,
};

const clampIndex = (index, length) => Math.max(0, Math.min(index, Math.max(0, length - 1)));

/**
 * Interview practice state as a thin cache over the server, which owns the
 * sessions, attempts, and feedback. Not persisted: it rehydrates by calling
 * `loadSessions` / `openSession` on mount, so a signed-in user's work reloads
 * from the server after relogin rather than from this tab's storage.
 */
export const useInterviewStore = create((set, get) => {
  /** Runs an async unit with shared loading/error handling. */
  async function run(work) {
    set({ loading: true, error: null });
    try {
      return await work();
    } catch (error) {
      set({ error: error?.message ?? 'Something went wrong.' });
      throw error;
    } finally {
      set({ loading: false });
    }
  }

  /** Re-reads the current session so the view always matches the server. */
  async function reread() {
    const { current } = get();
    if (!current) return null;
    const detail = await getSession(current.session_id);
    set({ current: detail });
    return detail;
  }

  return {
    ...initialState,

    loadSessions: () =>
      run(async () => {
        const sessions = await listSessions();
        set({ sessions });
        return sessions;
      }),

    openSession: (sessionId) =>
      run(async () => {
        const detail = await getSession(sessionId);
        set({ current: detail, index: 0, view: 'practice' });
        return detail;
      }),

    startSession: ({ roleId, focus }) =>
      run(async () => {
        const detail = await createSession({ roleId, focus });
        set({ current: detail, index: 0, view: 'practice' });
        return detail;
      }),

    refreshCurrent: () =>
      run(async () => {
        const { current } = get();
        if (!current) return null;
        const detail = await refreshSession(current.session_id);
        set({ current: detail, index: 0, view: 'practice' });
        return detail;
      }),

    removeSession: (sessionId) =>
      run(async () => {
        await deleteSession(sessionId);
        set((state) => {
          const wasCurrent = state.current?.session_id === sessionId;
          return {
            sessions: state.sessions.filter((s) => s.session_id !== sessionId),
            current: wasCurrent ? null : state.current,
            view: wasCurrent ? 'practice' : state.view,
          };
        });
      }),

    submitAttempt: ({ sequenceNo, audio }) =>
      run(async () => {
        const { current } = get();
        if (!current) return { ok: false, attempt: null };
        const result = await uploadAttempt({ sessionId: current.session_id, sequenceNo, audio });
        await reread();
        return result;
      }),

    retry: (responseId) =>
      run(async () => {
        const result = await retryFeedback(responseId);
        await reread();
        return result;
      }),

    goTo: (index) =>
      set((state) => ({ index: clampIndex(index, state.current?.questions.length ?? 0) })),

    setView: (view) => set({ view }),

    reset: () => set({ ...initialState }),
  };
});
