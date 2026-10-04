/**
 * Helpers for the learning plan's per-resource status, stored in the intake
 * store as `learningProgress`: { [resourceId]: { status, at } }.
 */

/** @returns {'saved' | 'started' | 'done' | null} */
export const statusOf = (progress, id) => progress?.[id]?.status ?? null;

/** Formats minutes as "30 min" below an hour, otherwise as hours (e.g. "1.5h"). */
export function duration(minutes) {
  if (!minutes) return null;
  if (minutes < 60) return `${minutes} min`;
  const hours = minutes / 60;
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)}h`;
}

/** Total time as "2h 15m", "45 min", or null when no resource has a duration. */
export function totalTime(resources) {
  const minutes = resources.reduce((sum, resource) => sum + (resource.minutes ?? 0), 0);
  if (!minutes) return null;
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

/**
 * Saved and started resources. Started ones come first, most recently opened
 * first; saved ones follow in the order they were saved, so a new save joins
 * the end instead of replacing what is at the front.
 */
export function upNext(resources, progress) {
  const rank = { started: 0, saved: 1 };
  return resources
    .filter((resource) => statusOf(progress, resource.id) in rank)
    .sort((a, b) => {
      const status = statusOf(progress, a.id);
      const byRank = rank[status] - rank[statusOf(progress, b.id)];
      if (byRank) return byRank;
      const byTime = progress[a.id].at - progress[b.id].at;
      return status === 'started' ? -byTime : byTime;
    });
}

/**
 * Focus areas whose resources are all finished, merged with learned skills
 * from areas outside this plan (another target role's plan) so switching
 * roles keeps them.
 *
 * @param {{ skill_id: string, skill: string }[]} areas focus areas in this plan
 * @param {{ skill_id: string }[]} resources every resource in this plan
 * @param {object} progress status per resource id, as stored in `learningProgress`
 * @param {{ skill_id: string, skill: string }[]} stored current learned skills
 */
export function learnedSkillsFor(areas, resources, progress, stored) {
  const inPlan = new Set(areas.map((area) => area.skill_id));
  const learned = areas
    .filter((area) => {
      const own = resources.filter((resource) => resource.skill_id === area.skill_id);
      return own.length > 0 && own.every((resource) => statusOf(progress, resource.id) === 'done');
    })
    .map(({ skill_id, skill }) => ({ skill_id, skill }));
  return [...stored.filter((entry) => !inPlan.has(entry.skill_id)), ...learned];
}

/** Whether two learned-skill lists hold the same skill ids in the same order. */
export const sameLearned = (a, b) =>
  a.length === b.length && a.every((entry, at) => entry.skill_id === b[at].skill_id);
