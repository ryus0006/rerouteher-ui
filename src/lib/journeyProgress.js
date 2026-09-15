/**
 * The three chapters the journey page is written in. They title the sections
 * and say what each one is for; the measure of how far she has come is
 * `DIAGNOSTIC_STEPS`, which is finer.
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
 * What the gap unlocks: not chapters of the diagnostic, but the two things it
 * was for. Kept separate so the percentage stays a measure of the diagnostic
 * and does not drop when a new plan section is added.
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
 * The five screens of the diagnostic, in the order she walks them.
 *
 * Ids are the ones `FLOW_STEPS` uses, so the stepper she sees on her way
 * through and the count she sees on her dashboard name the same things. Each
 * step carries the chapter it belongs to: the screen is what gets measured,
 * the chapter is what gets titled.
 */
export const DIAGNOSTIC_STEPS = [
  { id: 'upload-cv', chapter: 'story', to: '/diagnostic/background' },
  { id: 'career-break', chapter: 'story', to: '/diagnostic/break' },
  { id: 'work-priorities', chapter: 'skills', to: '/diagnostic/priorities' },
  /* Resumes to the priorities screen, not its own: the snapshot is a readout
     of what that screen generates, so arriving here without one would land
     her on a page with nothing to show. */
  { id: 'skill-snapshot', chapter: 'skills', to: '/diagnostic/priorities' },
  { id: 'target-role-gap', chapter: 'next-move', to: '/diagnostic/gap' },
];

/**
 * How far along the journey is, counted in screens and grouped into chapters.
 *
 * Counted in screens because that is what she experiences: a CV on its own is
 * real progress, and a measure that only moves on whole chapters would show her
 * an empty bar for work she has done.
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

  /* Only the unbroken run from the start counts, and a computed gap settles the
     whole thing.

     The run, because an answer further along is not proof of the ones before
     it: replacing the CV clears the break and leaves the priorities standing,
     and a screen counted on its own there would send her to one that has
     nothing to show. The gap, because reaching it means every screen was
     walked, whatever a plan saved before one of them existed happens to carry. */
  const firstUnanswered = answered.indexOf(false);
  const completed = gapResult || firstUnanswered === -1 ? DIAGNOSTIC_STEPS.length : firstUnanswered;
  const steps = DIAGNOSTIC_STEPS.map((step, index) => ({ ...step, done: index < completed }));

  const done = Object.fromEntries(
    JOURNEY_CHAPTERS.map((chapter) => [
      chapter.id,
      steps.filter((step) => step.chapter === chapter.id).every((step) => step.done),
    ])
  );

  /* Chapters run in order, so one is open when everything before it is done.
     The distinction matters for copy: an open chapter is an invitation, a
     blocked one has to say what it is waiting for. */
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
    /** The first unfinished screen, or null once the diagnostic is done. */
    next: steps.find((step) => !step.done) ?? null,
  };
}
