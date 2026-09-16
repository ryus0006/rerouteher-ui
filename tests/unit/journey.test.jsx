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
    vi.fn(() => ({ matches: false }))
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

  it('reads her own answers back rather than linking to the steps', async () => {
    useAccountStore.setState({ user: { username: 'ccc', displayName: 'Chee Yeong' } });
    open();

    expect(await screen.findByRole('heading', { name: 'Welcome back, Chee Yeong' })).toBeVisible();

    // Her skills and her focus areas are stated on the page itself.
    expect(screen.getByText('User Research')).toBeVisible();
    expect(screen.getByText('Time Management')).toBeVisible();
    expect(screen.getByText('2 roles matched your snapshot')).toBeVisible();
    expect(screen.getByText('A')).toBeVisible();

    // The readout reports; it does not send her back into the diagnostic, and
    // it does not restate the paperwork the profile already holds.
    expect(screen.queryByRole('button', { name: 'Revisit' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Open' })).toBeNull();
    expect(screen.queryByText(/hr-officer-cv\.pdf/)).toBeNull();
  });

  it('turns a guest away, and offers them no door to it', async () => {
    open();

    expect(router.state.location.pathname).toBe('/');
    // Her results are still hers to return to; nothing offers her the start again.
    expect((await screen.findAllByRole('button', { name: /Back to my results/ }))[0]).toBeVisible();
    expect(screen.queryByRole('button', { name: /Get started/ })).toBeNull();

    cleanup();
    open(['/diagnostic/snapshot']);
    expect(screen.queryByRole('link', { name: /My journey/ })).toBeNull();
  });

  it('saves the journey to an account and hands it back on sign in', async () => {
    open(['/']);

    // US5.3 — the guest journey in the store is saved with the new account.
    useAccountStore.setState({ sheet: 'create' });
    const createSheet = within(await screen.findByRole('dialog'));
    fireEvent.change(createSheet.getByLabelText('Username'), { target: { value: 'ccc' } });
    fireEvent.change(createSheet.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.click(createSheet.getByRole('button', { name: 'Create account and continue' }));
    await screen.findByRole('link', { name: /ccc/ });

    // US5.5 then a device that holds nothing of its own.
    useAccountStore.getState().signOut();
    useIntakeStore.setState({ snapshot: null, selectedRole: null, gapResult: null });

    // US5.4 — signing in brings the journey back, and lands on it.
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

  it('tells an open chapter apart from one that is still waiting', async () => {
    useAccountStore.setState({ user: { username: 'ccc', displayName: 'Chee Yeong' } });
    useIntakeStore.setState({ snapshot: null, gapResult: null });
    open();

    // The panel names the payoff; the row names the state. Never the same words.
    expect(
      await screen.findByText('Pick what matters most to you in a workplace.')
    ).toBeVisible();
    expect(screen.getByText('Ready to build from your story')).toBeVisible();
    expect(screen.getByText('Ready once your skills are named')).toBeVisible();
  });

  it('resumes the screen she stopped on, counting the ones behind it', async () => {
    useAccountStore.setState({ user: { username: 'ccc', displayName: 'Chee Yeong' } });
    // A CV and nothing else: half of the first chapter, one of the five screens.
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
    // She has already finished, so the page does not offer her the beginning.
    expect((await screen.findAllByRole('button', { name: /Go to my journey/ }))[0]).toBeVisible();
    expect(screen.queryByRole('button', { name: /Get started/ })).toBeNull();
  });

  it('returns her to the landing page when she signs out', async () => {
    useAccountStore.setState({ user: { username: 'ccc', displayName: 'Chee Yeong' } });
    open(['/journey']);

    fireEvent.click(await screen.findByRole('button', { name: 'Sign out' }));

    expect(router.state.location.pathname).toBe('/');
    expect(useAccountStore.getState().user).toBeNull();

    // Signing out returns the device to a guest with nothing on it, so the
    // next person to open the browser cannot read her CV or her readiness.
    expect(useIntakeStore.getState().cv).toBeNull();
    expect(useIntakeStore.getState().snapshot).toBeNull();
    expect((await screen.findAllByRole('button', { name: /Get started/ }))[0]).toBeVisible();
  });

  it('lets her aim at another matched role without leaving the readout', async () => {
    useAccountStore.setState({ user: { username: 'ccc', displayName: 'Chee Yeong' } });
    open();

    // Every role her snapshot matched is offered, not only the one in use.
    expect(await screen.findByRole('radio', { name: /Senior UX\/UI Designer/ })).toBeChecked();
    const other = screen.getByRole('radio', { name: 'Digital Marketing' });
    fireEvent.click(other);

    // The readout re-answers itself in place: new role, new readiness, same page.
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
