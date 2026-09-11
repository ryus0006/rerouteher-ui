import { cleanup, fireEvent, render, screen } from '@testing-library/react';
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
      break: { duration_years: 7, activities: ['a', 'b', 'c'] },
      // The matched occupation is an object, not a string.
      snapshot: {
        previous_occupation: { role: 'Senior UX/UI Designer', role_id: '1', confidence: 0.9 },
      },
    });

    open();

    expect(await screen.findByText('hr-officer-cv.pdf')).toBeVisible();
    expect(screen.getByText('7 years · 3 activities')).toBeVisible();
    expect(screen.getByText('Senior UX/UI Designer')).toBeVisible();
  });

  it('offers one way back into the diagnostic, not one per answer', async () => {
    useAccountStore.setState({ user: { username: 'ccc', displayName: 'ccc' } });
    open();

    expect(await screen.findByRole('heading', { name: 'Your answers' })).toBeVisible();

    // Previous occupation is read off the CV, so it was never hers to edit.
    expect(screen.getByText('Read from your CV')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Edit' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /Start again from your CV/ }));
    expect(router.state.location.pathname).toBe('/diagnostic/background');
  });

  it('sends a signed-out visitor home', async () => {
    open();

    expect(await screen.findByRole('heading', { level: 1 })).not.toHaveTextContent('Your profile');
  });
});
