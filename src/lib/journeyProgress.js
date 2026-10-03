/**
 * Journey page sections. Progress is measured separately, per screen, by
 * `DIAGNOSTIC_STEPS`.
 */
export const JOURNEY_CHAPTERS = [
  {
    id: 'story',
    name: 'Your story',
    action: 'Revisit',
    to: '/diagnostic/background',
    start: 'Start',
  },
  {
    id: 'skills',
    name: 'Your skills',
    action: 'Open',
    to: '/diagnostic/snapshot',
    start: 'Generate',
  },
  {
    id: 'next-move',
    name: 'Your next move',
    action: 'Open',
    to: '/diagnostic/gap',
    start: 'Choose a role',
  },
];

/**
 * Sections unlocked by a gap result. Kept separate from the diagnostic steps
 * so they do not affect the completion percentage.
 */
export const PLAN_SECTIONS = [
  {
    id: 'learning',
    name: 'Your learning plan',
    to: '/plan/learning',
    blurb: 'Resources for each focus area, with the time and cost of every one.',
  },
  {
    id: 'employers',
    name: 'Employer fit finder',
    to: '/plan/employers/matches',
    blurb: 'The companies that have published what matters most to you.',
  },
];

/**
 * The five diagnostic screens, in order.
 *
 * Ids match `FLOW_STEPS` so the intake stepper and the dashboard progress
 * refer to the same steps. Each step references the chapter it belongs to.
 */
export const DIAGNOSTIC_STEPS = [
  { id: 'upload-cv', chapter: 'story', to: '/diagnostic/background' },
  { id: 'career-break', chapter: 'story', to: '/diagnostic/break' },
  { id: 'work-priorities', chapter: 'skills', to: '/diagnostic/priorities' },
  /* The snapshot screen generates the snapshot on load when its inputs exist. */
  { id: 'skill-snapshot', chapter: 'skills', to: '/diagnostic/snapshot' },
  { id: 'target-role-gap', chapter: 'next-move', to: '/diagnostic/gap' },
];

/**
 * Computes diagnostic progress per screen, grouped into chapters.
 *
 * Progress is counted per screen rather than per chapter so partial progress
 * within a chapter is reflected.
 *
 * @param {{ cvParsed: boolean, activities: string[], employerPriorities: string[], snapshot: object | null, gapResult: object | null }} state
 */
export function journeyProgress({
  cvParsed,
  activities = [],
  employerPriorities = [],
  snapshot,
  gapResult,
}) {
  const answered = [
    Boolean(cvParsed),
    activities.length > 0,
    employerPriorities.length > 0,
    Boolean(snapshot),
    Boolean(gapResult),
  ];

  /* A step counts as done only if every step before it is done; a computed
     gap result marks all steps done.

     Later answers can outlive earlier ones (replacing the CV clears the break
     but keeps priorities), so counting steps independently could resume on a
     screen whose inputs are missing. A gap result implies every step was
     completed, regardless of fields missing from older saved plans. */
  const firstUnanswered = answered.indexOf(false);
  const completed = gapResult || firstUnanswered === -1 ? DIAGNOSTIC_STEPS.length : firstUnanswered;
  const steps = DIAGNOSTIC_STEPS.map((step, index) => ({ ...step, done: index < completed }));

  const done = Object.fromEntries(
    JOURNEY_CHAPTERS.map((chapter) => [
      chapter.id,
      steps.filter((step) => step.chapter === chapter.id).every((step) => step.done),
    ])
  );

  /* A chapter is reachable when all previous chapters are complete; reachable
     and blocked chapters use different copy. */
  let reachable = true;
  const chapters = JOURNEY_CHAPTERS.map((chapter) => {
    const row = { ...chapter, done: done[chapter.id], available: reachable };
    reachable = reachable && row.done;
    return row;
  });

  return {
    chapters,
    steps,
    completed,
    total: steps.length,
    percent: Math.round((completed / steps.length) * 100),
    /** First incomplete step, or null when the diagnostic is complete. */
    next: steps.find((step) => !step.done) ?? null,
  };
}
