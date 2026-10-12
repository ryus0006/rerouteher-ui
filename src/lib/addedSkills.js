/**
 * Confirmed skills the snapshot does not already list. Skills confirmed in the
 * companion are merged into the snapshot when it is generated; skills added
 * from the gap list are not, and are matched by name since they have no id.
 *
 * @param {import('../types/api.js').Snapshot | null} snapshot
 * @param {{ skill_id?: string | null, skill_name: string }[]} confirmedSkills
 */
export function addedSkillsFor(snapshot, confirmedSkills) {
  const listed = [...(snapshot?.professional_skills ?? []), ...(snapshot?.reframed_skills ?? [])];
  return (confirmedSkills ?? []).filter(
    (added) =>
      !listed.some(
        (s) =>
          (added.skill_id && s.skill_id === added.skill_id) ||
          s.skill.toLowerCase() === added.skill_name.toLowerCase()
      )
  );
}
