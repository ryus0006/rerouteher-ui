import { beforeEach, describe, expect, it } from 'vitest';
import { useIntakeStore } from '../../src/store/intakeStore.js';
import snapshot from '../../src/mocks/fixtures/snapshot.high-confidence.json';

const store = () => useIntakeStore.getState();

beforeEach(() => store().reset());

describe('intake store', () => {
  it('marks the CV as parsed when one is stored', () => {
    store().setCv({ fileName: 'cv.pdf', raw_text: '', experiences: [], skill_mentions: [] });
    expect(store().cvParsed).toBe(true);

    store().clearCv();
    expect(store().cv).toBeNull();
    expect(store().cvParsed).toBe(false);
  });

  it('toggles activities without duplicating them', () => {
    store().toggleActivity('care_household.cared_for_children');
    store().toggleActivity('care_household.ran_household');
    store().toggleActivity('care_household.cared_for_children');

    expect(store().break.activities).toEqual(['care_household.ran_household']);
  });

  it('requires at least one activity before generating a snapshot (duration 0 is valid)', () => {
    expect(store().canGenerateSnapshot()).toBe(false);

    store().setBreakDuration(3);
    expect(store().canGenerateSnapshot()).toBe(false); // a duration alone is not enough

    store().toggleActivity('care_household.cared_for_children');
    expect(store().canGenerateSnapshot()).toBe(true);

    // "Less than a year" (duration 0) with an activity is still valid
    store().setBreakDuration(0);
    expect(store().canGenerateSnapshot()).toBe(true);
  });

  it('defaults the target role to the first recommended role', () => {
    store().setSnapshot(snapshot);
    expect(store().selectedRole).toEqual(snapshot.recommended_roles[0]);
    expect(store().selectedRole.role_id).toBe('role_ux');
  });

  it('leaves the target role unset when nothing matched', () => {
    store().setSnapshot({ ...snapshot, previous_occupation: null, recommended_roles: [] });
    expect(store().selectedRole).toBeNull();
  });

  it('drops a stale gap result when the target role changes', () => {
    store().setGapResult({ readiness: 78, skills_have: [], gaps: [] });
    store().setSelectedRole({
      role: 'Digital Marketing',
      role_id: 'role_marketing',
      similarity: 0.71,
    });

    expect(store().gapResult).toBeNull();
  });

  it('persists the session for the tab, not for the browser', () => {
    store().setBreakDuration(5);

    // sessionStorage, so a reload keeps her answers and closing the tab does
    // not leave them on a shared machine.
    expect(sessionStorage.getItem('rerouteher.guestSession')).toContain('"duration_years":5');
    expect(localStorage.getItem('rerouteher.guestSession')).toBeNull();
  });
});

describe('resetting downstream state when an upstream input changes', () => {
  it('clears the break and all results when a new CV is set', () => {
    store().setBreakDuration(4);
    store().toggleActivity('care_household.ran_household');
    store().setSnapshot(snapshot);
    store().setGapResult({ readiness: 80, skills_have: [], gaps: [] });

    store().setCv({ fileName: 'new.pdf', raw_text: '', experiences: [], skill_mentions: [] });

    expect(store().cvParsed).toBe(true);
    expect(store().break).toEqual({ duration_years: 0, activities: [] });
    expect(store().snapshot).toBeNull();
    expect(store().selectedRole).toBeNull();
    expect(store().gapResult).toBeNull();
  });

  it('clears the break and all results when the CV is removed', () => {
    store().setBreakDuration(4);
    store().toggleActivity('care_household.ran_household');
    store().setSnapshot(snapshot);

    store().clearCv();

    expect(store().cv).toBeNull();
    expect(store().cvParsed).toBe(false);
    expect(store().break).toEqual({ duration_years: 0, activities: [] });
    expect(store().snapshot).toBeNull();
    expect(store().selectedRole).toBeNull();
    expect(store().gapResult).toBeNull();
  });

  it('clears the snapshot, role and gap when the break duration changes (keeps the CV)', () => {
    store().setCv({ fileName: 'cv.pdf', raw_text: '', experiences: [], skill_mentions: [] });
    store().setSnapshot(snapshot);
    store().setGapResult({ readiness: 80, skills_have: [], gaps: [] });

    store().setBreakDuration(2);

    expect(store().break.duration_years).toBe(2);
    expect(store().cvParsed).toBe(true); // CV survives an upstream break edit
    expect(store().snapshot).toBeNull();
    expect(store().selectedRole).toBeNull();
    expect(store().gapResult).toBeNull();
  });

  it('clears the snapshot, role and gap when an activity is toggled', () => {
    store().setCv({ fileName: 'cv.pdf', raw_text: '', experiences: [], skill_mentions: [] });
    store().setSnapshot(snapshot);
    store().setGapResult({ readiness: 80, skills_have: [], gaps: [] });

    store().toggleActivity('care_household.cared_for_children');

    expect(store().break.activities).toEqual(['care_household.cared_for_children']);
    expect(store().snapshot).toBeNull();
    expect(store().selectedRole).toBeNull();
    expect(store().gapResult).toBeNull();
  });
});
