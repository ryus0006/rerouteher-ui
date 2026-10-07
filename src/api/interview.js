import { ApiError, del, getJson, postFile, postJson } from './client.js';

export const QUESTIONS_PER_SET = 5;

/** The three practice focuses, keyed by the id the endpoints receive. */
export const PRACTICE_FOCUS = [
  {
    id: 'general',
    label: 'General',
    blurb: 'Your background, motivation, and returning after a career break.',
  },
  {
    id: 'role_specific',
    label: 'Role-specific',
    blurb: 'The work itself, and how your skills fit the role.',
  },
  {
    id: 'mixed',
    label: 'Mixed',
    blurb: 'A mix of both, like most real interviews.',
  },
];

export const focusLabel = (id) => PRACTICE_FOCUS.find((focus) => focus.id === id)?.label ?? id;

const BASE = '/api/interview';

/**
 * The setup a signed-in user sees before practising: their selected role, the
 * roles they may practise, the focus choices, and how many questions a set holds.
 *
 * @returns {Promise<{ selected_role: { role_id: string, role_title: string }, available_roles: { role_id: string, role_title: string }[], focus_choices: string[], question_count: number }>}
 */
export function getSetup() {
  return getJson(`${BASE}/setup`);
}

/**
 * The user's saved interview sessions, newest first. Each carries its role,
 * focus, status and progress so the UI can offer them to resume.
 *
 * @returns {Promise<{ session_id: string, role: { role_id: string, role_title: string }, practice_focus: string, status: string, progress: number, created_at: string, updated_at: string }[]>}
 */
export function listSessions() {
  return getJson(`${BASE}/sessions`);
}

/**
 * Creates (or returns the existing) session for one role and focus. The server
 * keeps one session per role and focus, so this is idempotent per pair.
 *
 * @param {{ roleId: string, focus: string }} request
 * @returns {Promise<SessionDetail>}
 */
export function createSession({ roleId, focus }) {
  return postJson(`${BASE}/sessions`, { role_id: roleId, practice_focus: focus });
}

/**
 * The full detail for one session: its role, focus, status, and the five
 * question slots, each with any attempts and their feedback.
 *
 * @param {string} sessionId
 * @returns {Promise<SessionDetail>}
 */
export function getSession(sessionId) {
  return getJson(`${BASE}/sessions/${sessionId}`);
}

/**
 * Replaces a session's questions with a freshly drawn set.
 *
 * @param {string} sessionId
 * @returns {Promise<SessionDetail>}
 */
export function refreshSession(sessionId) {
  return postJson(`${BASE}/sessions/${sessionId}/refresh`, {});
}

/**
 * Deletes a session and all its attempts. Resolves on the 204.
 *
 * @param {string} sessionId
 * @returns {Promise<void>}
 */
export function deleteSession(sessionId) {
  return del(`${BASE}/sessions/${sessionId}`);
}

/** Wraps a recorded answer as a File the attempts endpoint accepts. */
function audioToFile(audio) {
  const extension = audio.type?.includes('mp4')
    ? 'm4a'
    : audio.type?.includes('ogg')
      ? 'ogg'
      : 'webm';
  return new File([audio], `answer.${extension}`, { type: audio.type || 'audio/webm' });
}

/**
 * On a 503 whose body carries a saved attempt, the transcript was saved but
 * feedback failed: surface the attempt with `ok:false` so the caller can show
 * it and offer a retry. Other failures rethrow.
 */
function recoverable(error) {
  if (error instanceof ApiError && error.status === 503 && error.body?.attempt) {
    return { ok: false, attempt: error.body.attempt };
  }
  throw error;
}

/**
 * Uploads one recorded answer to its question slot. The server transcribes,
 * redacts, saves, and returns grounded feedback in a single call.
 *
 * @param {{ sessionId: string, sequenceNo: number, audio: Blob }} request
 * @returns {Promise<{ ok: boolean, attempt: object }>}
 */
export async function uploadAttempt({ sessionId, sequenceNo, audio }) {
  const path = `${BASE}/sessions/${sessionId}/questions/${sequenceNo}/attempts`;
  try {
    const attempt = await postFile(path, audioToFile(audio), 'file');
    return { ok: true, attempt };
  } catch (error) {
    return recoverable(error);
  }
}

/**
 * Asks the server to generate feedback again for a saved attempt whose earlier
 * feedback failed.
 *
 * @param {string | number} responseId
 * @returns {Promise<{ ok: boolean, attempt: object }>}
 */
export async function retryFeedback(responseId) {
  const path = `${BASE}/attempts/${responseId}/feedback`;
  try {
    const attempt = await postJson(path, {});
    return { ok: true, attempt };
  } catch (error) {
    return recoverable(error);
  }
}
