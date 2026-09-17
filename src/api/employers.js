import { postJson } from './client.js';

/**
 * Employers ranked against the priorities she chose (US9.3).
 *
 * Priorities travel as ids, so a match can name exactly which one an employer
 * discloses — and, as importantly, which one it is silent on.
 *
 * @param {{ priorities: string[], targetRoleId: string }} request
 * @returns {Promise<{ employers: import('../types/api.js').EmployerMatch[] }>}
 */
export function matchEmployers({ priorities, targetRoleId }) {
  return postJson('/api/employers/match', {
    priorities,
    target_role_id: targetRoleId,
  });
}
