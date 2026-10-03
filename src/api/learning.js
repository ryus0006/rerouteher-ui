import { postJson } from './client.js';

/**
 * Fetches learning resources for the skill gaps of the target role.
 *
 * Skills are sent as ids so each resource maps deterministically to the gap it
 * addresses; display names are resolved server-side.
 *
 * @param {{ skillIds: string[], targetRoleId: string, targetRole: string }} request
 * @returns {Promise<{ groups: import('../types/api.js').LearningGroup[], resources: import('../types/api.js').LearningResource[] }>}
 */
export function recommendLearning({ skillIds, targetRoleId, targetRole }) {
  return postJson('/api/learning/recommend', {
    skill_ids: skillIds,
    target_role_id: targetRoleId,
    target_role: targetRole,
  });
}
