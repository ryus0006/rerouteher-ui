import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { routes } from '../../src/routes.jsx';
import { useAccountStore } from '../../src/store/accountStore.js';
import { useIntakeStore } from '../../src/store/intakeStore.js';

let router;

beforeEach(() => {
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches: false }))
  );
});

afterEach(() => {
  cleanup();
  router?.dispose();
  useAccountStore.setState({ user: null });
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function open(initialEntries = ['/profile']) {
  router = createMemoryRouter(routes, { initialEntries });
  render(<RouterProvider router={router} />);
}

describe('profile', () => {
  it('renames the account and shows the new name in the header', async () => {
    useAccountStore.setState({ user: { username: 'ccc', displayName: 'ccc' } });
    open();

    const field = await screen.findByLabelText('Display name');
    fireEvent.change(field, { target: { value: 'Choong Chee Yeong' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(useAccountStore.getState().user.displayName).toBe('Choong Chee Yeong');
    expect(screen.getByRole('link', { name: /Choong Chee Yeong/ })).toBeVisible();
  });

  it('falls back to the username for an account stored before display names', async () => {
    useAccountStore.setState({ user: { username: 'ccc' } });
    open();

    expect(await screen.findByRole('heading', { name: 'Your profile' })).toBeVisible();
    expect(screen.getByLabelText('Display name')).toHaveValue('ccc');
  });

  it('renders before the career break step has been answered', async () => {
    useAccountStore.setState({ user: { username: 'ccc', displayName: 'ccc' } });
    useIntakeStore.setState({ break: undefined });

    open();

    expect(await screen.findByRole('heading', { name: 'Your profile' })).toBeVisible();
  });

  it('renders the stored intake shapes rather than raw objects', async () => {
    useAccountStore.setState({ user: { username: 'ccc', displayName: 'ccc' } });
    useIntakeStore.setState({
      cv: { fileName: 'hr-officer-cv.pdf', fileSize: 79134 },
      break: {
        duration_years: 7,
        activities: ['care_household.cared_for_children', 'finance.managed_budget_finances'],
      },
      employerPriorities: ['flexible_work', 'childcare_support'],
      // The matched occupation is an object, not a string.
      snapshot: {
        previous_occupation: { role: 'Senior UX/UI Designer', role_id: '1', confidence: 0.9 },
      },
    });

    open();

    expect(await screen.findByText('hr-officer-cv.pdf')).toBeVisible();
    expect(screen.getByText('7 years')).toBeVisible();

    // Stored ids are resolved to the words she picked, not counted.
    expect(screen.getByText('Childcare')).toBeVisible();
    expect(screen.getByText('Budgeting')).toBeVisible();
    expect(screen.getByText('Flexible Work')).toBeVisible();
    expect(screen.getByText('Childcare Support')).toBeVisible();
    expect(screen.queryByText(/2 activities/)).toBeNull();
  });

  it('shows only the answers she gave, not what the CV was read for', async () => {
    useAccountStore.setState({ user: { username: 'ccc', displayName: 'ccc' } });
    useIntakeStore.setState({
      snapshot: {
        previous_occupation: { role: 'Senior UX/UI Designer', role_id: '1', confidence: 0.9 },
      },
    });

    open();

    const given = (await screen.findByText('CV')).closest('dl');
    for (const label of ['CV', 'Career break', 'What filled it', 'Work priorities']) {
      expect(within(given).getByText(label)).toBeVisible();
    }
    expect(screen.queryByText('Previous occupation')).toBeNull();
    expect(screen.queryByText('Senior UX/UI Designer')).toBeNull();
  });

  it('offers one way back into the diagnostic, not one per answer', async () => {
    useAccountStore.setState({ user: { username: 'ccc', displayName: 'ccc' } });
    open();

    expect(await screen.findByRole('heading', { name: 'Your answers' })).toBeVisible();

    expect(screen.queryByRole('button', { name: 'Edit' })).toBeNull();

    // Clearing is confirmed first, so the click alone goes nowhere.
    fireEvent.click(screen.getByRole('button', { name: /Start again from your CV/ }));
    expect(router.state.location.pathname).toBe('/profile');

    fireEvent.click(screen.getByRole('button', { name: 'Clear and start again' }));
    expect(router.state.location.pathname).toBe('/diagnostic/background');
  });

  it('sends a signed-out visitor home', async () => {
    open();

    expect(await screen.findByRole('heading', { level: 1 })).not.toHaveTextContent('Your profile');
  });
});
