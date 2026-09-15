import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { routes } from '../../src/routes.jsx';
import { useAccountStore } from '../../src/store/accountStore.js';
import { useIntakeStore } from '../../src/store/intakeStore.js';

let router;

const OPENERS_FIRST = 'What does my readiness score actually mean?';

const GAPS = [
  {
    skill_id: 'mock-ai-design',
    skill: 'AI Design Tools (Figma AI, Midjourney)',
    band: 'ai_usage',
    importance: 0.81,
    uplift: 9,
  },
  {
    skill_id: 'mock-design-systems',
    skill: 'Scalable Design Systems (Tokens & Multi-brand)',
    band: 'role',
    importance: 0.74,
    uplift: 7,
  },
  {
    skill_id: 'mock-design-ops',
    skill: 'Design Ops & Handoff Automation',
    band: 'role',
    importance: 0.52,
    uplift: 3,
  },
];

beforeEach(() => {
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches: false }))
  );
  Element.prototype.scrollIntoView = vi.fn();

  useIntakeStore.setState({
    cv: { fileName: 'cv.pdf', fileSize: 1 },
    break: { duration_years: 7, activities: ['a'] },
    employerPriorities: [],
    snapshot: {
      previous_occupation: { role: 'Senior UX/UI Designer', role_id: 'role_ux', confidence: 0.9 },
      professional_skills: [{ skill: 'A' }],
      reframed_skills: [{ skill: 'B' }],
      recommended_roles: [{ role: 'Senior UX/UI Designer', role_id: 'role_ux', similarity: 1 }],
    },
    selectedRole: { role: 'Senior UX/UI Designer', role_id: 'role_ux' },
    gapResult: { readiness: 78, gaps: GAPS },
  });
});

afterEach(() => {
  cleanup();
  router?.dispose();
  useAccountStore.setState({ user: null });
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function open(initialEntries) {
  router = createMemoryRouter(routes, { initialEntries });
  render(<RouterProvider router={router} />);
}

describe('learning plan', () => {
  it('groups each resource under the gap it closes', async () => {
    open(['/plan/learning']);

    expect(await screen.findByRole('heading', { name: 'Your learning plan' })).toBeVisible();

    const section = (
      await screen.findByRole('heading', { name: 'Scalable Design Systems (Tokens & Multi-brand)' })
    ).closest('section');

    expect(within(section).getByText('Variables and modes in Figma')).toBeVisible();
    expect(within(section).getByText('+7% if learned')).toBeVisible();
    // A resource for a different gap must not appear under this heading.
    expect(within(section).queryByText('AI features in Figma')).toBeNull();
  });

  it('narrows to one format without hiding the focus areas', async () => {
    open(['/plan/learning']);

    expect(await screen.findByText('AI features in Figma')).toBeVisible();
    expect(screen.getByText('Midjourney for product design')).toBeVisible();

    fireEvent.click(screen.getByRole('button', { name: 'Articles' }));

    // The article stays, the video goes, and the heading it sat under remains
    // so she can see the filter emptied it rather than the plan losing a part.
    expect(screen.getByText('AI features in Figma')).toBeVisible();
    expect(screen.queryByText('Midjourney for product design')).toBeNull();
    expect(
      screen.getByRole('heading', { name: 'AI Design Tools (Figma AI, Midjourney)' })
    ).toBeVisible();
  });

  it('costs her nothing, and does not offer a filter that selects everything', async () => {
    open(['/plan/learning']);

    await screen.findByText('AI features in Figma');

    // Every resource in the plan is free, so a "free only" chip would be a
    // control that never changes what she sees.
    expect(screen.queryByRole('button', { name: 'Free only' })).toBeNull();
    expect(screen.queryByText(/RM |USD |\/ month/)).toBeNull();
  });

  it('collapses a focus area she is not working on yet', async () => {
    open(['/plan/learning']);

    const toggle = await screen.findByRole('button', { name: /^3 resources/ });
    expect(screen.getByText('AI features in Figma')).toBeVisible();

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('AI features in Figma')).toBeNull();
    // The card itself stays, so the plan still reads as four focus areas.
    expect(
      screen.getByRole('heading', { name: 'AI Design Tools (Figma AI, Midjourney)' })
    ).toBeVisible();
  });

  it('opens every resource in a new tab, safely', async () => {
    open(['/plan/learning']);

    const links = await screen.findAllByRole('link', { name: /opens in a new tab/ });
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
    }
  });

  it('sends someone with no gap back to work it out', async () => {
    useIntakeStore.setState({ gapResult: null });
    open(['/plan/learning']);

    expect(await screen.findByRole('heading', { level: 1 })).not.toHaveTextContent('learning plan');
  });
});

describe('employer fit finder', () => {
  it('asks for three priorities at most, and will not run on none', async () => {
    open(['/plan/employers']);

    expect(
      await screen.findByRole('heading', { name: 'Change what you are asking for' })
    ).toBeVisible();

    const find = screen.getByRole('button', { name: /See your matches/ });
    expect(find).toBeDisabled();

    fireEvent.click(screen.getByLabelText(/Flexible Work/));
    fireEvent.click(screen.getByLabelText(/Childcare Support/));
    fireEvent.click(screen.getByLabelText(/Inclusive Workplace/));

    // The cap has to hold, or "what matters most" ranks against everything.
    expect(screen.getByLabelText(/Parental Support/)).toBeDisabled();
    expect(find).toBeEnabled();

    fireEvent.click(find);
    expect(router.state.location.pathname).toBe('/plan/employers/matches');
  });

  it('ranks by what each company published, and shows what it read', async () => {
    useIntakeStore.setState({
      employerPriorities: ['flexible_work', 'childcare_support', 'inclusive_workplace'],
    });
    open(['/plan/employers/matches']);

    expect(await screen.findByRole('heading', { name: 'Your employer matches' })).toBeVisible();

    const names = (await screen.findAllByRole('heading', { level: 2 })).map((h) => h.textContent);
    expect(names[0]).toBe('Maybank');

    const maybank = screen.getByRole('heading', { name: 'Maybank' }).closest('article');
    expect(within(maybank).getByText('Strong match')).toBeVisible();

    // One source per company, not one repeated beside every priority.
    const sources = within(maybank).getAllByRole('link', { name: /Sustainability Report/ });
    expect(sources).toHaveLength(1);
    expect(sources[0]).toHaveAttribute('target', '_blank');

    // Silence is reported as silence, not left out.
    const cimb = screen.getByRole('heading', { name: 'CIMB' }).closest('article');
    expect(within(cimb).getByText('Not found in report')).toBeVisible();

    // Company details go to the company, not to another page of ours.
    expect(within(cimb).getByRole('link', { name: /View company details/ })).toHaveAttribute(
      'href',
      'https://www.cimb.com/'
    );
  });

  it('sends her back to choose when she has picked nothing', async () => {
    useIntakeStore.setState({ employerPriorities: [] });
    open(['/plan/employers/matches']);

    expect(
      await screen.findByRole('heading', { name: 'Change what you are asking for' })
    ).toBeVisible();
    expect(router.state.location.pathname).toBe('/plan/employers');
  });
});

describe('companion', () => {
  it('answers from her own gap, and cites what it read', async () => {
    useAccountStore.setState({ user: { username: 'ccc', displayName: 'Chee Yeong' } });
    open(['/journey']);

    fireEvent.click(await screen.findByRole('button', { name: /Ask Hera/ }));
    fireEvent.click(
      await screen.findByRole('button', { name: 'Which focus area should I start with?' })
    );

    expect(await screen.findByText(/Scalable Design Systems/)).toBeVisible();
    expect(screen.getByText(/From Your gap result/)).toBeVisible();
  });

  it('drafts a profile from the conversation and applies it on confirm (US8.1)', async () => {
    useIntakeStore.setState({ cv: null, cvParsed: false, snapshot: null, gapResult: null });
    open(['/diagnostic/background']);

    // Pre-snapshot, the companion opens in build mode.
    fireEvent.click(await screen.findByRole('button', { name: /Ask Hera/ }));
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'I was an HR officer for five years, then two years at home.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    // The drafted profile is shown for review, not silently applied.
    expect(await screen.findByText(/Your profile so far/i)).toBeVisible();
    expect(useIntakeStore.getState().cvParsed).toBe(false);

    // On confirm it enters the store through the same mutators the pages use, so
    // the CV step reads as complete - no snapshot is produced here (next step).
    fireEvent.click(screen.getByRole('button', { name: 'Use this profile' }));
    expect(useIntakeStore.getState().cvParsed).toBe(true);
    expect(useIntakeStore.getState().cv).not.toBeNull();
    expect(useIntakeStore.getState().break.activities).toContain('caregiving');
    expect(useIntakeStore.getState().snapshot).toBeNull();
  });

  it('keeps both jobs reachable from inside the panel', async () => {
    useIntakeStore.setState({ cv: null, cvParsed: false, snapshot: null, gapResult: null });
    open(['/diagnostic/background']);

    fireEvent.click(await screen.findByRole('button', { name: /Ask Hera/ }));
    // Before a snapshot exists it opens in build mode, but is never stuck there.
    fireEvent.click(await screen.findByRole('button', { name: 'Ask a question instead' }));
    expect(await screen.findByRole('button', { name: OPENERS_FIRST })).toBeVisible();

    fireEvent.click(screen.getByRole('button', { name: 'Build my profile without a CV' }));
    expect(
      await screen.findByRole('button', {
        name: 'I was a teacher for six years, then home with my kids.',
      })
    ).toBeVisible();
  });

  it('stays off the landing page, where there is nothing of hers to read', async () => {
    open(['/']);

    expect(await screen.findByRole('heading', { level: 1 })).toBeVisible();
    expect(screen.queryByRole('button', { name: /Ask Hera/ })).toBeNull();
  });
});
