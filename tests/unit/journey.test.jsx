import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { routes } from '../../src/routes.jsx';
import { useAccountStore } from '../../src/store/accountStore.js';
import { useIntakeStore } from '../../src/store/intakeStore.js';

let router;

const SNAPSHOT = {
  previous_occupation: { role: 'Senior UX/UI Designer', role_id: 'role_ux', confidence: 0.9 },
  professional_skills: [{ skill: 'User Research' }, { skill: 'Wireframing' }],
  reframed_skills: [{ skill: 'Time Management', source: 'break' }],
  recommended_roles: [
    { role: 'Senior UX/UI Designer', role_id: 'role_ux', similarity: 1 },
    { role: 'Digital Marketing', role_id: 'role_marketing', similarity: 0.71 },
  ],
};

beforeEach(() => {
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches: false, addEventListener() {}, removeEventListener() {} }))
  );
  useIntakeStore.setState({
    cv: { fileName: 'hr-officer-cv.pdf', fileSize: 1 },
    cvParsed: true,
    break: {
      duration_years: 7,
      activities: ['care_household.cared_for_children', 'finance.managed_budget_finances'],
    },
    snapshot: SNAPSHOT,
    selectedRole: { role: 'Senior UX/UI Designer', role_id: 'role_ux', similarity: 1 },
    gapResult: { readiness: 78, gaps: [{ skill: 'A', uplift: 6, kind: 'role' }] },
  });
});

afterEach(() => {
  cleanup();
  router?.dispose();
  useAccountStore.setState({ user: null });
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function open(initialEntries = ['/journey']) {
  router = createMemoryRouter(routes, { initialEntries });
  render(<RouterProvider router={router} />);
}

describe('journey', () => {
  it('greets an account holder by their display name', async () => {
    useAccountStore.setState({ user: { username: 'ccc', displayName: 'Chee Yeong' } });
    open();

    expect(await screen.findByRole('heading', { name: 'Welcome back, Chee Yeong' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Create a free account' })).toBeNull();
  });

  it('summarises her results and points to the next step', async () => {
    useAccountStore.setState({ user: { username: 'ccc', displayName: 'Chee Yeong' } });
    open();

    expect(await screen.findByRole('heading', { name: 'Welcome back, Chee Yeong' })).toBeVisible();

    // The match in the gap page's terms, and the path with its current step;
    // the full skill and gap lists stay on their own pages.
    expect(screen.getByText('requirements you already have')).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Build your top skills' })).toBeVisible();
    expect(screen.getByText(/Start with: A\./)).toBeVisible();
    expect(screen.getByRole('link', { name: /View full breakdown/ })).toBeVisible();
    expect(screen.queryByText('User Research')).toBeNull();

    // Read-only: no controls back into the diagnostic, and no intake answers
    // (those are shown on the profile).
    expect(screen.queryByRole('button', { name: 'Revisit' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Open' })).toBeNull();
    expect(screen.queryByText(/hr-officer-cv\.pdf/)).toBeNull();
  });

  it('turns a guest away, and offers them no door to it', async () => {
    open();

    expect(router.state.location.pathname).toBe('/');
    // A finished user is offered their results, not the start of the diagnostic.
    expect((await screen.findAllByRole('button', { name: /Back to my results/ }))[0]).toBeVisible();
    expect(screen.queryByRole('button', { name: /Get started/ })).toBeNull();

    cleanup();
    open(['/diagnostic/snapshot']);
    expect(screen.queryByRole('link', { name: /My journey/ })).toBeNull();
  });

  it('saves the journey to an account and hands it back on sign in', async () => {
    open(['/']);

    // The guest journey in the store is saved with the new account.
    useAccountStore.setState({ sheet: 'create' });
    const createSheet = within(await screen.findByRole('dialog'));
    fireEvent.change(createSheet.getByLabelText('Username'), { target: { value: 'ccc' } });
    fireEvent.change(createSheet.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.click(createSheet.getByRole('button', { name: 'Create account and continue' }));
    await screen.findByRole('link', { name: /ccc/ });

    // Sign out, leaving no local journey data.
    useAccountStore.getState().signOut();
    useIntakeStore.setState({ snapshot: null, selectedRole: null, gapResult: null });

    // Signing in restores the journey and navigates to it.
    useAccountStore.setState({ sheet: 'signIn' });
    const signInSheet = within(await screen.findByRole('dialog'));
    fireEvent.change(signInSheet.getByLabelText('Username'), { target: { value: 'ccc' } });
    fireEvent.change(signInSheet.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.click(signInSheet.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('heading', { name: 'Welcome back, ccc' })).toBeVisible();
    expect(router.state.location.pathname).toBe('/journey');
    expect(useIntakeStore.getState().snapshot).toEqual(SNAPSHOT);
  });

  it('gives an account holder with an empty journey somewhere to start', async () => {
    useAccountStore.setState({ user: { username: 'ccc', displayName: 'Chee Yeong' } });
    useIntakeStore.setState({
      cv: null,
      cvParsed: false,
      break: undefined,
      employerPriorities: [],
      snapshot: null,
      gapResult: null,
    });
    open();

    expect(await screen.findByRole('heading', { name: 'Welcome back, Chee Yeong' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Start your story' })).toBeVisible();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  });

  it('locks the path until a target role is chosen', async () => {
    useAccountStore.setState({ user: { username: 'ccc', displayName: 'Chee Yeong' } });
    useIntakeStore.setState({ snapshot: null, gapResult: null });
    open();

    expect(await screen.findByText('Pick what matters most to you in a workplace.')).toBeVisible();
    expect(screen.getAllByText('Built around your target role')).toHaveLength(4);
    expect(screen.queryByRole('link', { name: /Build your top skills/ })).toBeNull();
  });

  it('resumes the screen she stopped on, counting the ones behind it', async () => {
    useAccountStore.setState({ user: { username: 'ccc', displayName: 'Chee Yeong' } });
    // CV only: one of five screens complete.
    useIntakeStore.setState({
      break: { duration_years: null, activities: [] },
      employerPriorities: [],
      snapshot: null,
      selectedRole: null,
      gapResult: null,
    });
    open();

    expect(await screen.findByText('1 of 5 steps')).toBeVisible();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '20');
    expect(screen.queryByText(/Nothing here yet/)).toBeNull();

    // The CV screen is answered, so Continue opens the break question.
    fireEvent.click(screen.getByRole('button', { name: 'Continue your story' }));
    expect(router.state.location.pathname).toBe('/diagnostic/break');
  });

  it('keeps the landing page reachable from the logo while signed in', async () => {
    useAccountStore.setState({ user: { username: 'ccc', displayName: 'Chee Yeong' } });
    open(['/journey']);

    fireEvent.click(await screen.findByRole('link', { name: /ReRouteHer/ }));

    expect(router.state.location.pathname).toBe('/');
    // Diagnostic complete: the CTA links to the journey, not the first step.
    expect((await screen.findAllByRole('button', { name: /Go to my journey/ }))[0]).toBeVisible();
    expect(screen.queryByRole('button', { name: /Get started/ })).toBeNull();
  });

  it('returns her to the landing page when she signs out', async () => {
    useAccountStore.setState({ user: { username: 'ccc', displayName: 'Chee Yeong' } });
    open(['/journey']);

    fireEvent.click(await screen.findByRole('button', { name: 'Sign out' }));

    expect(router.state.location.pathname).toBe('/');
    expect(useAccountStore.getState().user).toBeNull();

    // Signing out clears all local journey data.
    expect(useIntakeStore.getState().cv).toBeNull();
    expect(useIntakeStore.getState().snapshot).toBeNull();
    expect((await screen.findAllByRole('button', { name: /Get started/ }))[0]).toBeVisible();
  });

  it('lets her aim at another matched role without leaving the readout', async () => {
    useAccountStore.setState({ user: { username: 'ccc', displayName: 'Chee Yeong' } });
    open();

    // All recommended roles are offered, not only the selected one.
    expect(await screen.findByRole('radio', { name: /Senior UX\/UI Designer/ })).toBeChecked();
    const other = screen.getByRole('radio', { name: 'Digital Marketing' });
    fireEvent.click(other);

    // Switching role updates readiness in place.
    expect(await screen.findByRole('heading', { name: 'Digital Marketing' })).toBeVisible();
    expect(other).toBeChecked();
    expect(router.state.location.pathname).toBe('/journey');
    expect(useIntakeStore.getState().selectedRole.role_id).toBe('role_marketing');
  });

  it('keeps the journey link in the bar once she is on the journey', async () => {
    useAccountStore.setState({ user: { username: 'ccc', displayName: 'Chee Yeong' } });
    open(['/journey']);

    const link = await screen.findByRole('link', { name: /My journey/ });
    expect(link).toHaveAttribute('aria-current', 'page');
  });

  it('hides the header progress ring once the diagnostic is finished', async () => {
    useAccountStore.setState({ user: { username: 'ccc', displayName: 'Chee Yeong' } });
    open(['/diagnostic/snapshot']);

    const link = await screen.findByRole('link', { name: /My journey/ });
    expect(link).toBeVisible();
    expect(link.querySelector('svg')).toBeNull();
  });
});
