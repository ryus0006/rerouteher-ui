import { postJson } from './client.js';

/**
 * Sends one conversational turn to the companion. Available to guests.
 *
 * The full journey (cv, break, snapshot, gapResult, selectedRole,
 * employerPriorities, employerMatches, confirmedSkills, roleSkillsOfferedForRoleId,
 * learningProgress and learnedSkills) and the current page are sent so the backend can
 * ground its answer and, in build mode, return an updated cv/break in
 * `journey_update`.
 *
 * @param {{ question: string, sessionId: string, journey: object, currentPage?: string }} r
 * @returns {Promise<{ answer: string, sources: string[], journey_update?: object, cta?: object, skill_choices?: object[], skill_choices_role_id?: string, profile_skill_update?: object }>}
 */
export function askCompanion({ question, sessionId, journey, currentPage, interview }) {
  return postJson('/api/companion/ask', {
    question,
    session_id: sessionId,
    journey,
    current_page: currentPage ?? null,
    interview: interview ?? null,
  });
}
