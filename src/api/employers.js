import { postJson } from './client.js';

/**
 * Fetches employers ranked against the selected workplace priorities.
 *
 * Priorities are sent as ids so each match can report exactly which priorities
 * an employer discloses (`met`) and which it does not (`unmet`).
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
