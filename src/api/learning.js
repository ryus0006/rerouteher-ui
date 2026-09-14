import { postJson } from './client.js';

/**
 * Learning resources for the focus areas the gap surfaced (US6.1).
 *
 * Sent as skill ids rather than names so a resource is tied to the exact gap it
 * closes deterministically; names are resolved server-side for display.
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
