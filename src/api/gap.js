import { postJson } from './client.js';

/**
 * Compute the skill gap for a target role. The role and skills are passed as
 * deterministic ids (role primary key, ESCO skill_id) so ambiguous display names
 * never drive the computation; the role name is sent only as a log label.
 *
 * @param {import('../types/api.js').Snapshot} snapshot
 * @param {import('../types/api.js').RecommendedRole} targetRole
 * @param {{ skill_id?: string | null, skill_name: string }[]} [confirmedSkills] skills
 *   the user said they have that are not in the snapshot (e.g. missing from an outdated CV)
 * @returns {Promise<import('../types/api.js').GapResult>}
 */
export function computeGap(snapshot, targetRole, confirmedSkills = []) {
  const skill_ids = [
    ...new Set(
      [...snapshot.professional_skills, ...snapshot.reframed_skills, ...confirmedSkills]
        .map((s) => s.skill_id)
        .filter(Boolean)
    ),
  ];

  return postJson('/api/gap/compute', {
    skill_ids,
    target_role_id: targetRole.role_id,
    target_role: targetRole.role,
  }).then((result) => withConfirmedSkills(result, confirmedSkills));
}

/**
 * Moves gaps the user confirmed into `skills_have`. Gaps carry a skill name but
 * no ESCO id, so skills added from the gap list cannot be sent as ids and are
 * matched here by name instead.
 *
 * @param {import('../types/api.js').GapResult} result
 * @param {{ skill_name: string }[]} confirmedSkills
 * @returns {import('../types/api.js').GapResult}
 */
function withConfirmedSkills(result, confirmedSkills) {
  const names = new Set(confirmedSkills.map((s) => s.skill_name?.toLowerCase()));
  const met = result.gaps.filter((gap) => names.has(gap.skill.toLowerCase()));
  if (met.length === 0) return result;

  return {
    ...result,
    gaps: result.gaps.filter((gap) => !met.includes(gap)),
    skills_have: [...result.skills_have, ...met.map((gap) => gap.skill)],
  };
}
