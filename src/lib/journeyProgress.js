/**
 * How far along the journey is, measured in the chapters she can actually see.
 *
 * One model, not two: the same three chapters that appear on the journey page
 * are what the percentage counts, so the number on screen is always something
 * she can point at. The work priorities step is left out — it feeds the
 * employer matching rather than any chapter, and counting it would show an
 * incomplete journey to someone who has finished the diagnostic.
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
 * @param {{ cv: object | null, activities: string[], snapshot: object | null, gapResult: object | null }} state
 */
export function journeyProgress({ cv, activities = [], snapshot, gapResult }) {
  const done = {
    story: Boolean(cv) && activities.length > 0,
    skills: Boolean(snapshot),
    'next-move': Boolean(gapResult),
  };

  /* Chapters run in order, so one is open when everything before it is done.
     The distinction matters for copy: an open chapter is an invitation, a
     blocked one has to say what it is waiting for. */
  let reachable = true;
  const chapters = JOURNEY_CHAPTERS.map((chapter) => {
    const row = { ...chapter, done: done[chapter.id], available: reachable };
    reachable = reachable && row.done;
    return row;
  });

  const completed = chapters.filter((chapter) => chapter.done).length;

  return {
    chapters,
    completed,
    total: chapters.length,
    percent: Math.round((completed / chapters.length) * 100),
    /** The first unfinished chapter, or null once the diagnostic is done. */
    next: chapters.find((chapter) => !chapter.done) ?? null,
  };
}
