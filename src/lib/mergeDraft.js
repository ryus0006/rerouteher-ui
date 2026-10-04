/**
 * Merges a newly drafted profile into the one already shown, so a reply that
 * leaves a field out never removes what an earlier reply captured. Fields the
 * new draft does fill replace the old ones.
 */
export function mergeDraft(previous, next) {
  if (!previous) return next;

  const cv =
    next.cv || previous.cv
      ? {
          ...previous.cv,
          ...next.cv,
          experiences: next.cv?.experiences?.length
            ? next.cv.experiences
            : previous.cv?.experiences,
          skill_mentions: next.cv?.skill_mentions?.length
            ? next.cv.skill_mentions
            : previous.cv?.skill_mentions,
        }
      : undefined;

  return {
    ...previous,
    ...next,
    cv,
    break: next.break ?? previous.break,
    employerPriorities: next.employerPriorities?.length
      ? next.employerPriorities
      : previous.employerPriorities,
  };
}
