import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { routes } from '../../src/routes.jsx';
import { server } from '../../src/mocks/server.js';
import snapshotFixture from '../../src/mocks/fixtures/snapshot.high-confidence.json';
import { useAccountStore } from '../../src/store/accountStore.js';
import { useIntakeStore } from '../../src/store/intakeStore.js';

let router;

beforeEach(() => {
  useAccountStore.setState({ user: { username: 'aisha', displayName: 'Aisha' } });
  useIntakeStore.setState({
    cv: { fileName: 'cv.pdf', fileSize: 1 },
    cvParsed: true,
    break: { duration_years: 2, activities: ['caregiving'] },
    confirmedSkills: [],
    snapshot: snapshotFixture,
    selectedRole: snapshotFixture.recommended_roles[0],
    gapResult: null,
    cvDraft: null,
  });
});

afterEach(() => {
  cleanup();
  router?.dispose();
  useAccountStore.setState({ user: null });
  useIntakeStore.getState().reset();
});

function open() {
  router = createMemoryRouter(routes, { initialEntries: ['/plan/cv'] });
  render(<RouterProvider router={router} />);
}

describe('CV generation page', () => {
  it('generates a server draft and does not show a separate career-break section', async () => {
    open();

    expect(await screen.findByDisplayValue('Professional prepared for role_ux.')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Regenerate from saved journey' })).toBeVisible();
    expect(screen.queryByText(/include your career break/i)).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Career break' })).toBeNull();
  });

  it('keeps a saved role draft and exposes explicit regeneration', async () => {
    useIntakeStore.setState({
      cvDraft: {
        version: 3,
        activeRoleId: 'role_ux',
        personal: { name: 'Aisha', email: '', phone: '', location: '' },
        drafts: {
          role_ux: {
            version: 3,
            roleId: 'role_ux',
            personal: { name: 'Aisha', email: '', phone: '', location: '' },
            summary: 'Saved wording.',
            skills: ['Saved skill'],
            experiences: [],
            careerBreak: null,
          },
        },
        gaps: {},
      },
    });
    open();

    expect(await screen.findByDisplayValue('Saved wording.')).toBeVisible();
    expect(screen.getByDisplayValue('Aisha')).toBeVisible();
  });

  it('accepts grounded wording without changing text before acceptance', async () => {
    const user = userEvent.setup();
    open();

    await screen.findByDisplayValue('Professional prepared for role_ux.');
    await user.click(
      screen.getByRole('button', { name: 'Improve the wording of your professional summary' })
    );
    expect(await screen.findByText(/professional prepared to contribute/i)).toBeVisible();
    expect(screen.getByDisplayValue('Professional prepared for role_ux.')).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Use this wording' }));
    expect(
      screen.getByDisplayValue(
        'Professional prepared to contribute through user research and design coordination.'
      )
    ).toBeVisible();
  });

  it('explains a temporary internal service problem without implying user failure', async () => {
    server.use(
      http.post('*/api/cv/generate', () =>
        HttpResponse.json({ error: 'cv_generation_unavailable' }, { status: 503 })
      )
    );
    open();

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/temporarily unavailable due to an internal service problem/i);
    expect(alert).not.toHaveTextContent(/failed|invalid|wrong/i);
    expect(screen.getByRole('button', { name: 'Try again' })).toBeVisible();
  });
});
