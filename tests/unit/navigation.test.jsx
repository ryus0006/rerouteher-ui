import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { routes } from '../../src/routes.jsx';
import { useIntakeStore } from '../../src/store/intakeStore.js';

let router;

beforeEach(() => {
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches: false }))
  );
  useIntakeStore.setState({ cv: null, cvParsed: false, snapshot: null });
});

afterEach(() => {
  cleanup();
  router?.dispose();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function open(initialEntries = ['/']) {
  router = createMemoryRouter(routes, { initialEntries });
  render(<RouterProvider router={router} />);
  return vi.spyOn(router, 'navigate');
}

describe('screen navigation', () => {
  it('opens the CV screen and focuses its heading without requiring animation support', async () => {
    const navigate = open();
    // The hero and the closing band make the same offer, so the name is on
    // the page twice; the hero is the one under test.
    fireEvent.click(screen.getAllByRole('button', { name: 'Get started' })[0]);
    const heading = await screen.findByRole('heading', { name: 'Upload your CV' });
    expect(heading).toHaveFocus();
    expect(navigate).toHaveBeenCalledWith('/diagnostic/background', expect.anything());
    fireEvent.click(screen.getByRole('button', { name: 'Continue to Career Break' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('CV is required');
    expect(router.state.location.pathname).toBe('/diagnostic/background');
  });

  it('preserves form data when moving forward and back between steps', async () => {
    useIntakeStore.setState({ cv: { fileName: 'sample.pdf', fileSize: 1024 }, cvParsed: true });
    open(['/diagnostic/background']);
    fireEvent.click(screen.getByRole('button', { name: 'Continue to Career Break' }));
    await screen.findByRole('heading', { name: 'Tell us about your career break' });
    fireEvent.click(screen.getByRole('button', { name: /Back to CV/ }));
    await screen.findByRole('heading', { name: 'Upload your CV' });
    expect(screen.getByText('sample.pdf')).toBeInTheDocument();
  });

  it('keeps direct-link guards and unknown-route redirects working', async () => {
    open(['/diagnostic/snapshot']);
    await screen.findByRole('heading', { name: 'Upload your CV' });
    expect(router.state.location.pathname).toBe('/diagnostic/background');
    await router.navigate('/does-not-exist');
    await screen.findByRole('heading', { name: /See what you still/ });
    expect(router.state.location.pathname).toBe('/');
  });
});
