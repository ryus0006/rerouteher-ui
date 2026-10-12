import { describe, expect, it } from 'vitest';
import { journeyProgress } from '../../src/lib/journeyProgress.js';

const FULL = {
  cvParsed: true,
  activities: ['a'],
  employerPriorities: ['flexible_work'],
  snapshot: { professional_skills: [] },
  gapResult: { readiness: 78, gaps: [] },
};

describe('journeyProgress', () => {
  it('is zero for an account with nothing in it', () => {
    const progress = journeyProgress({ cvParsed: false, activities: [], employerPriorities: [] });

    expect(progress.percent).toBe(0);
    expect(progress.completed).toBe(0);
    expect(progress.next.id).toBe('upload-cv');
  });

  it('counts a screen as soon as it is answered, not once its chapter is whole', () => {
    const cvOnly = journeyProgress({
      ...FULL,
      activities: [],
      employerPriorities: [],
      snapshot: null,
      gapResult: null,
    });

    expect(cvOnly.completed).toBe(1);
    expect(cvOnly.percent).toBe(20);
    expect(cvOnly.next.id).toBe('career-break');
  });

  it('offers the screen she stopped on rather than the start of its chapter', () => {
    const partway = { ...FULL, snapshot: null, gapResult: null };

    expect(journeyProgress({ ...partway, employerPriorities: [] }).next.to).toBe(
      '/diagnostic/priorities'
    );
    expect(journeyProgress({ ...FULL, gapResult: null }).next.to).toBe('/diagnostic/gap');
  });

  it('counts only the unbroken run, so a cleared answer is not skipped past', () => {
    // After a CV redo the break is cleared but priorities remain; progress must
    // stop at the break step rather than count the priorities.
    const afterRedo = journeyProgress({
      ...FULL,
      activities: [],
      snapshot: null,
      gapResult: null,
    });

    expect(afterRedo.completed).toBe(1);
    expect(afterRedo.next.to).toBe('/diagnostic/break');
  });

  it('resumes to the snapshot screen once priorities are picked', () => {
    // Priorities set but no snapshot: resume at the snapshot screen, which
    // generates the snapshot on load.
    const picked = journeyProgress({ ...FULL, snapshot: null, gapResult: null });

    expect(picked.completed).toBe(3);
    expect(picked.next.to).toBe('/diagnostic/snapshot');
  });

  it('reads a plan saved before a screen existed as whole, not as a hole', () => {
    // A gap result marks every step complete, even if an older plan lacks a field.
    const legacy = journeyProgress({ ...FULL, employerPriorities: [] });

    expect(legacy.completed).toBe(5);
    expect(legacy.percent).toBe(100);
    expect(legacy.next).toBeNull();
  });

  it('counts a chapter only once every screen in it is answered', () => {
    const cvOnly = journeyProgress({
      ...FULL,
      activities: [],
      employerPriorities: [],
      snapshot: null,
      gapResult: null,
    });
    const [story, skills, nextMove] = cvOnly.chapters;

    expect(story.done).toBe(false);
    expect(story.available).toBe(true);
    expect(skills.available).toBe(false);
    expect(nextMove.available).toBe(false);
  });

  it('opens a chapter only once everything before it is done', () => {
    const [story, skills, nextMove] = journeyProgress({
      ...FULL,
      employerPriorities: [],
      snapshot: null,
      gapResult: null,
    }).chapters;

    expect(story.available).toBe(true);
    expect(skills.available).toBe(true);
    expect(nextMove.available).toBe(false);
  });

  it('reaches 100 with no next screen once the gap is computed', () => {
    const progress = journeyProgress(FULL);

    expect(progress.percent).toBe(100);
    expect(progress.next).toBeNull();
    expect(progress.chapters.every((chapter) => chapter.done)).toBe(true);
  });
});
