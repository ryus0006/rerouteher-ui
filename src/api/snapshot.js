import { postJson } from './client.js';

/**
 * @param {import('../types/intake.js').StoredCv} cv
 * @param {{ duration_years: number, activities: string[] }} careerBreak
 * @param {{ skill_id: string, skill_name: string }[]} [confirmedSkills] skills the user
 *   confirmed from the previous-role checklist in the companion; merged into the snapshot.
 * @returns {Promise<import('../types/api.js').Snapshot>}
 */
export function generateSnapshot(cv, careerBreak, confirmedSkills = []) {
  // fileName is local bookkeeping and is not part of the request contract.
  const { fileName: _fileName, ...structuredCv } = cv;

  return postJson('/api/snapshot/generate', {
    cv: structuredCv,
    break: careerBreak,
    confirmed_skills: confirmedSkills.map((s) => s.skill_id).filter(Boolean),
  });
}
