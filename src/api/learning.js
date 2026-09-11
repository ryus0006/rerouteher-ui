import { postJson } from './client.js';

/**
 * Learning resources for the focus areas the gap surfaced (US6.1).
 *
 * Sent as skills rather than free text so a resource can be tied back to the
 * exact gap it closes, which is what the page has to show her (US6.2).
 *
 * @param {{ skills: string[], targetRoleId: string, targetRole: string }} request
 * @returns {Promise<{ resources: import('../types/api.js').LearningResource[] }>}
 */
export function recommendLearning({ skills, targetRoleId, targetRole }) {
  return postJson('/api/learning/recommend', {
    skills,
    target_role_id: targetRoleId,
    target_role: targetRole,
  });
}
