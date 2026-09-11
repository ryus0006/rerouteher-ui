import { describe, expect, it } from 'vitest';
import { journeyProgress } from '../../src/lib/journeyProgress.js';

const FULL = {
  cv: { fileName: 'cv.pdf' },
  activities: ['a'],
  snapshot: { professional_skills: [] },
  gapResult: { readiness: 78, gaps: [] },
};

describe('journeyProgress', () => {
  it('is zero for an account with nothing in it', () => {
    const progress = journeyProgress({ cv: null, activities: [], snapshot: null, gapResult: null });

    expect(progress.percent).toBe(0);
    expect(progress.completed).toBe(0);
    expect(progress.next.id).toBe('story');
  });

  it('counts the story only once both halves of it are answered', () => {
    const cvOnly = journeyProgress({ ...FULL, activities: [], snapshot: null, gapResult: null });
    expect(cvOnly.completed).toBe(0);

    const both = journeyProgress({ ...FULL, snapshot: null, gapResult: null });
    expect(both.completed).toBe(1);
    expect(both.percent).toBe(33);
    expect(both.next.id).toBe('skills');
  });

  it('opens a chapter only once everything before it is done', () => {
    const [story, skills, nextMove] = journeyProgress({
      ...FULL,
      snapshot: null,
      gapResult: null,
    }).chapters;

    expect(story.available).toBe(true);
    expect(skills.available).toBe(true);
    expect(nextMove.available).toBe(false);
  });

  it('reaches 100 with no next chapter once the gap is computed', () => {
    const progress = journeyProgress(FULL);

    expect(progress.percent).toBe(100);
    expect(progress.next).toBeNull();
    expect(progress.chapters.every((chapter) => chapter.done)).toBe(true);
  });
});
