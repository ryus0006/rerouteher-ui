import { postJson } from './client.js';

/**
 * One turn with the re-entry companion (E8). Guest-usable; the whole journey and
 * the current page travel so the backend can ground its answer and, when building
 * a profile, return the updated cv/break in journey_update.
 *
 * @param {{ question: string, sessionId: string, journey: object, currentPage?: string }} r
 * @returns {Promise<{ answer: string, sources: string[], journey_update?: { cv?: object, break?: object } }>}
 */
export function askCompanion({ question, sessionId, journey, currentPage }) {
  return postJson('/api/companion/ask', {
    question,
    session_id: sessionId,
    journey,
    current_page: currentPage ?? null,
  });
}
