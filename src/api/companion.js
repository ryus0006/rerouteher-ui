import { postJson } from './client.js';

/**
 * One question to the re-entry companion (E8).
 *
 * The whole journey travels with the question. The companion's value is that it
 * answers about *her* readiness and *her* gaps rather than in general, and it
 * can only do that if it is given them.
 *
 * @param {{ question: string, context: object }} request
 * @returns {Promise<{ answer: string, sources: string[] }>}
 */
export function askCompanion({ question, context }) {
  return postJson('/api/companion/ask', { question, context });
}

/**
 * Turn the guided conversation into a skill snapshot (US8.1).
 *
 * The same shape the CV route produces, because everything downstream — the
 * gap, the learning plan, the employer match — reads a snapshot and must not
 * care which way she got here.
 *
 * @param {{ answers: Record<string, string> }} request
 * @returns {Promise<import('../types/api.js').Snapshot>}
 */
export function buildProfile({ answers }) {
  return postJson('/api/companion/profile', { answers });
}
