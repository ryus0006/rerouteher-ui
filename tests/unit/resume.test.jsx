import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { routes } from '../../src/routes.jsx';
import { resumePoint } from '../../src/hooks/useResumePoint.js';
import { startPlanSync } from '../../src/store/planSync.js';
import { createAccount, signIn } from '../../src/api/account.js';
import { hasJourney } from '../../src/store/intakeStore.js';
import { useAccountStore } from '../../src/store/accountStore.js';
import { useIntakeStore } from '../../src/store/intakeStore.js';

let router;
let stopSync;

const SNAPSHOT = {
  previous_occupation: { role: 'Senior UX/UI Designer', role_id: 'role_ux', confidence: 0.9 },
  professional_skills: [{ skill: 'User Research' }],
  reframed_skills: [{ skill: 'Time Management', source: 'break' }],
  recommended_roles: [{ role: 'Senior UX/UI Designer', role_id: 'role_ux', similarity: 1 }],
};

beforeEach(() => {
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches: false }))
  );
  useIntakeStore.getState().reset();
});

afterEach(() => {
  cleanup();
  stopSync?.();
  stopSync = undefined;
  router?.dispose();
  useAccountStore.setState({ user: null });
  useIntakeStore.getState().reset();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function open(initialEntries = ['/']) {
  router = createMemoryRouter(routes, { initialEntries });
  render(<RouterProvider router={router} />);
}

describe('resume point', () => {
  it('offers the beginning only to someone who has not begun', () => {
    expect(
      resumePoint({
        cvParsed: false,
        activities: [],
        snapshot: null,
        gapResult: null,
        signedIn: false,
      })
    ).toEqual({ label: 'Get started', to: '/diagnostic/background', started: false });
  });

  it('offers the next unfinished step to someone partway through', () => {
    const partway = { snapshot: null, gapResult: null, signedIn: false };

    expect(resumePoint({ ...partway, cvParsed: true, activities: [] }).to).toBe(
      '/diagnostic/break'
    );

    // The break is finished once an activity is named, so the question after it
    // is the one she is waiting on.
    expect(resumePoint({ ...partway, cvParsed: true, activities: ['caregiving'] }).to).toBe(
      '/diagnostic/priorities'
    );

    // Her snapshot exists, so that screen is answered and the role is what is
    // left; sending her back to the snapshot would be a step she has done.
    expect(
      resumePoint({
        cvParsed: true,
        activities: ['caregiving'],
        employerPriorities: ['flexible_work'],
        snapshot: SNAPSHOT,
        gapResult: null,
        signedIn: false,
      }).to
    ).toBe('/diagnostic/gap');
  });

  it('sends a finished guest to her results and a finished account to her journey', () => {
    const finished = {
      cvParsed: true,
      activities: ['caregiving'],
      snapshot: SNAPSHOT,
      gapResult: { readiness: 78 },
    };

    expect(resumePoint({ ...finished, signedIn: false }).to).toBe('/diagnostic/gap');
    expect(resumePoint({ ...finished, signedIn: true }).to).toBe('/journey');
  });

  it('takes a signed-in visitor from the front page back to her journey', async () => {
    useAccountStore.setState({ user: { username: 'ccc', displayName: 'Chee Yeong' } });
    useIntakeStore.setState({
      cv: { fileName: 'hr-officer-cv.pdf', fileSize: 1 },
      cvParsed: true,
      snapshot: SNAPSHOT,
      selectedRole: SNAPSHOT.recommended_roles[0],
      gapResult: { readiness: 78, gaps: [{ skill: 'A', uplift: 6, kind: 'role' }] },
    });

    open();

    fireEvent.click((await screen.findAllByRole('button', { name: /Go to my journey/ }))[0]);

    await screen.findByRole('heading', { name: 'Welcome back, Chee Yeong' });
    expect(router.state.location.pathname).toBe('/journey');
  });
});

describe('replacing the CV', () => {
  const built = {
    cv: { fileName: 'hr-officer-cv.pdf', fileSize: 1 },
    cvParsed: true,
    break: { duration_years: 7, activities: ['care_household.cared_for_children'] },
    snapshot: SNAPSHOT,
    selectedRole: SNAPSHOT.recommended_roles[0],
    gapResult: { readiness: 78, gaps: [{ skill: 'A', uplift: 6, kind: 'role' }] },
  };

  it('holds the previous plan until the redo produces its own gap', async () => {
    useIntakeStore.setState(built);
    open(['/diagnostic/background']);

    fireEvent.click(await screen.findByRole('button', { name: 'Remove' }));

    // The redo has wiped everything downstream of the CV, as it must.
    expect(useIntakeStore.getState().snapshot).toBeNull();
    expect(useIntakeStore.getState().previousPlan.snapshot).toEqual(SNAPSHOT);

    // She abandons it, and gets back exactly what she had.
    fireEvent.click(await screen.findByRole('button', { name: 'Keep my previous plan' }));

    await waitFor(() => expect(useIntakeStore.getState().snapshot).toEqual(SNAPSHOT));
    expect(useIntakeStore.getState().cv.fileName).toBe('hr-officer-cv.pdf');
    expect(useIntakeStore.getState().previousPlan).toBeNull();
  });

  it('stops offering the old plan once the new one is finished', () => {
    useIntakeStore.setState(built);
    useIntakeStore.getState().clearCv();
    expect(useIntakeStore.getState().previousPlan).not.toBeNull();

    useIntakeStore.getState().setGapResult({ readiness: 81, gaps: [] });
    expect(useIntakeStore.getState().previousPlan).toBeNull();
  });

  it('does not overwrite the stash when she uploads twice during one redo', () => {
    useIntakeStore.setState(built);

    useIntakeStore.getState().setCv({ fileName: 'first.pdf', fileSize: 1 });
    useIntakeStore.getState().setCv({ fileName: 'second.pdf', fileSize: 1 });

    expect(useIntakeStore.getState().previousPlan.cv.fileName).toBe('hr-officer-cv.pdf');
  });
});

describe('signing up before starting', () => {
  const finished = {
    cv: { fileName: 'hr-officer-cv.pdf', fileSize: 1 },
    cvParsed: true,
    snapshot: SNAPSHOT,
    selectedRole: SNAPSHOT.recommended_roles[0],
    gapResult: {
      readiness: 78,
      skills_have: ['User Research'],
      gaps: [{ skill: 'A', uplift: 6, kind: 'role' }],
    },
  };

  it('knows an empty plan from a real one', () => {
    expect(hasJourney(null)).toBe(false);
    expect(hasJourney({ cvParsed: false, snapshot: null })).toBe(false);
    expect(hasJourney({ cvParsed: true, snapshot: null })).toBe(true);
  });

  it('takes a new account with nothing yet straight to the CV screen', async () => {
    open();

    useAccountStore.setState({ sheet: 'create' });
    const sheet = within(await screen.findByRole('dialog'));

    fireEvent.change(sheet.getByLabelText('Username'), { target: { value: 'starter' } });
    fireEvent.change(sheet.getByLabelText('Password'), { target: { value: 'password1' } });
    fireEvent.click(sheet.getByRole('button', { name: /Create/ }));

    await screen.findByRole('heading', { name: 'Upload your CV' });
    expect(router.state.location.pathname).toBe('/diagnostic/background');
  });

  it('never lets an empty saved plan overwrite work done on the device', async () => {
    // She signed up first, so the account holds nothing.
    await createAccount({ username: 'early', password: 'password1', plan: { cvParsed: false } });

    // Then did the whole diagnostic as a guest, and signed in.
    useIntakeStore.setState(finished);
    open();

    useAccountStore.setState({ sheet: 'signIn' });
    const sheet = within(await screen.findByRole('dialog'));

    fireEvent.change(sheet.getByLabelText('Username'), { target: { value: 'early' } });
    fireEvent.change(sheet.getByLabelText('Password'), { target: { value: 'password1' } });
    fireEvent.click(sheet.getByRole('button', { name: /Sign in/ }));

    await waitFor(() => expect(useAccountStore.getState().user).not.toBeNull());
    expect(useIntakeStore.getState().snapshot).toEqual(SNAPSHOT);

    // And it is on the account now, so the next device gets it too.
    await waitFor(async () => {
      const result = await signIn({ username: 'early', password: 'password1' });
      expect(result.plan.snapshot).toEqual(SNAPSHOT);
    });
  });

  it('opens both doors from the gap result without an account', async () => {
    useAccountStore.setState({ user: null });
    useIntakeStore.setState(finished);

    open(['/diagnostic/gap']);

    // An account saves the journey rather than buying the plan, so a guest is
    // handed both halves of it and asked for nothing.
    expect(await screen.findByRole('link', { name: /Open your learning plan/ })).toBeVisible();
    expect(screen.getByRole('link', { name: /See your matches/ })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Create a free account' })).toBeNull();
  });
});

describe('plan sync', () => {
  it('keeps the account copy level with later edits, not just the first save', async () => {
    stopSync = startPlanSync();

    await createAccount({ username: 'syncer', password: 'password1', plan: { cvParsed: false } });
    useAccountStore.setState({ user: { username: 'syncer', displayName: 'syncer' } });

    useIntakeStore.setState({ cvParsed: true, snapshot: SNAPSHOT });

    await waitFor(
      async () => {
        const result = await signIn({ username: 'syncer', password: 'password1' });
        expect(result.plan.snapshot).toEqual(SNAPSHOT);
      },
      { timeout: 3000 }
    );
  });

  it('sends a waiting edit before sign-out clears the device', async () => {
    stopSync = startPlanSync();

    await createAccount({ username: 'leaver', password: 'password1', plan: { cvParsed: false } });
    useAccountStore.setState({ user: { username: 'leaver', displayName: 'leaver' } });

    // Edited and signed out inside the debounce window, which is the one way
    // an edit could have been wiped locally without ever reaching the account.
    useIntakeStore.setState({ cvParsed: true, snapshot: SNAPSHOT });
    useAccountStore.getState().signOut();

    expect(useIntakeStore.getState().snapshot).toBeNull();

    await waitFor(
      async () => {
        const result = await signIn({ username: 'leaver', password: 'password1' });
        expect(result.plan.snapshot).toEqual(SNAPSHOT);
      },
      { timeout: 3000 }
    );
  });

  it('saves nothing for a guest', async () => {
    stopSync = startPlanSync();

    useIntakeStore.setState({ cvParsed: true, snapshot: SNAPSHOT });

    // No account is signed in, so there is nowhere for this to have gone; the
    // mock server errors on an unhandled request, so a stray save would fail.
    await new Promise((resolve) => setTimeout(resolve, 1000));
    expect(useAccountStore.getState().user).toBeNull();
  });
});
