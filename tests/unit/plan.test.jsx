import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { routes } from '../../src/routes.jsx';
import { server } from '../../src/mocks/server.js';
import { useAccountStore } from '../../src/store/accountStore.js';
import { useIntakeStore } from '../../src/store/intakeStore.js';
import snapshotFixture from '../../src/mocks/fixtures/snapshot.high-confidence.json';

let router;

const OPENERS_FIRST = 'What does my match for this role mean?';

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

const PROMPT_GAP = {
  skill_id: 'mock-prompt-ux',
  skill: 'Prompt Engineering for UX Workflows',
  band: 'ai_usage',
  importance: 0.6,
  uplift: 5,
};

beforeEach(() => {
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches: false, addEventListener() {}, removeEventListener() {} }))
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
    learningProgress: {},
    learnedSkills: [],
    addedFocusAreas: {},
    cvDraft: null,
  });
});

afterEach(() => {
  cleanup();
  router?.dispose();
  useAccountStore.setState({ user: null, sheet: null, sheetRedirect: null });
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

/** The focus-area list, below the resource featured at the top. */
const list = () => within(screen.getByRole('region', { name: 'All resources' }));

function signIn() {
  useAccountStore.setState({ user: { username: 'ccc', displayName: 'Chee Yeong' } });
}

function open(initialEntries) {
  router = createMemoryRouter(routes, { initialEntries });
  render(<RouterProvider router={router} />);
}

describe('learning plan', () => {
  it('costs her nothing, and does not offer a filter that selects everything', async () => {
    signIn();
    open(['/plan/learning']);

    await screen.findByRole('region', { name: 'All resources' });

    // All resources are free, so no "Free only" filter is rendered.
    expect(screen.queryByRole('button', { name: 'Free only' })).toBeNull();
    expect(screen.queryByText(/RM |USD |\/ month/)).toBeNull();
  });

  it('opens every resource in a new tab, safely', async () => {
    signIn();
    open(['/plan/learning']);

    const links = await screen.findAllByRole('link', { name: /opens in a new tab/ });
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
    }
  });

  it('puts a saved resource at the top until she removes it', async () => {
    signIn();
    open(['/plan/learning']);

    fireEvent.click(
      await screen.findByRole('button', { name: 'Save AI in UX practice for later' })
    );

    const featured = screen
      .getByRole('heading', { name: 'From your saved list' })
      .closest('section');
    expect(within(featured).getByText('AI in UX practice')).toBeVisible();

    fireEvent.click(
      within(featured).getByRole('button', { name: /Remove from saved: AI in UX practice/ })
    );
    expect(screen.getByRole('heading', { name: 'Start here' })).toBeVisible();
  });

  it('marks an opened resource in progress and finishes it without a pop-up', async () => {
    signIn();
    open(['/plan/learning']);

    await screen.findByRole('region', { name: 'All resources' });
    const link = list().getByRole('link', { name: /AI features in Figma at .*new tab/ });
    link.addEventListener('click', (event) => event.preventDefault());
    fireEvent.click(link);

    expect(
      await screen.findByRole('heading', { name: 'Pick up where you left off' })
    ).toBeVisible();

    fireEvent.click(list().getByRole('button', { name: 'Mark AI features in Figma as finished' }));

    expect(
      list().getByRole('button', { name: 'Mark AI features in Figma as not finished' })
    ).toBeVisible();
    expect(screen.queryByRole('region', { name: /is done/ })).not.toBeInTheDocument();
  });

  it('puts an unfinished resource back the way it was before she ticked it', async () => {
    signIn();
    open(['/plan/learning']);

    const ring = (title, done) =>
      list().getByRole('button', { name: `Mark ${title} as ${done ? 'not ' : ''}finished` });

    await screen.findByRole('region', { name: 'All resources' });
    fireEvent.click(ring('AI features in Figma', false));
    fireEvent.click(ring('AI features in Figma', true));
    expect(screen.getByRole('heading', { name: 'Start here' })).toBeVisible();
    expect(list().queryByText('In progress')).not.toBeInTheDocument();

    fireEvent.click(list().getByRole('button', { name: 'Save AI in UX practice for later' }));
    fireEvent.click(ring('AI in UX practice', false));
    fireEvent.click(ring('AI in UX practice', true));
    expect(screen.getByRole('heading', { name: 'From your saved list' })).toBeVisible();
    expect(
      list().getByRole('button', { name: 'Save AI in UX practice for later' })
    ).toHaveAttribute('aria-pressed', 'true');
  });

  it('offers the next skill once everything in the plan is finished', async () => {
    signIn();
    const done = { status: 'done', at: 1 };
    useIntakeStore.setState({
      gapResult: { readiness: 78, gaps: [...GAPS, PROMPT_GAP] },
      learningProgress: Object.fromEntries(
        [
          'ai-figma-features',
          'ai-midjourney-product',
          'ai-ux-practice',
          'ds-variables-figma',
          'ds-multibrand-video',
          'ops-dev-mode',
          'ops-designops-nng',
        ].map((id) => [id, done])
      ),
    });
    open(['/plan/learning']);

    const hero = (
      await screen.findByRole('heading', { name: 'Everything here is finished' })
    ).closest('section');
    expect(within(hero).getByText('Prompt Engineering for UX Workflows')).toBeVisible();

    fireEvent.click(within(hero).getByRole('button', { name: /Add to plan/ }));
    expect(
      await screen
        .findByRole('heading', { name: 'Pick up where you left off' })
        .catch(() => screen.findByRole('heading', { name: 'Start here' }))
    ).toBeVisible();
  });
});

describe('employer fit finder', () => {
  it('asks a guest to create an account before matching employers', async () => {
    useIntakeStore.setState({ employerPriorities: ['flexible_work'] });
    open(['/plan/employers']);

    expect(await screen.findByRole('heading', { name: 'Employer fit' })).toBeVisible();
    expect(router.state.location.pathname).toBe('/plan/employers/matches');
    expect(screen.queryByRole('heading', { name: 'Your employer matches' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Create an account' }));
    expect(useAccountStore.getState().sheet).toBe('create');
    expect(useAccountStore.getState().sheetRedirect).toBe('/plan/employers/matches');
  });

  describe('signed in', () => {
    beforeEach(signIn);

    it('lets her pick as many priorities as matter, and will not run on none', async () => {
      open(['/plan/employers']);

      expect(
        await screen.findByRole('heading', { name: 'What matters most for your return?' })
      ).toBeVisible();

      const find = screen.getByRole('button', { name: /See your matches/ });
      expect(find).toBeDisabled();

      fireEvent.click(screen.getByLabelText(/Flexible Work/));
      fireEvent.click(screen.getByLabelText(/Childcare Support/));
      fireEvent.click(screen.getByLabelText(/Inclusive Workplace/));

      // There is no selection limit: a fourth priority remains selectable.
      expect(screen.getByLabelText(/Parental Support/)).toBeEnabled();
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
      expect(within(maybank).getByText('Hiring for your role.')).toBeVisible();
      expect(within(maybank).getByText('UX Designer, Digital Banking')).toBeVisible();
      expect(within(maybank).getByText(/Found 27 Sept? 2026/)).toBeVisible();
      expect(within(maybank).getByRole('link', { name: /Open job/ })).toHaveAttribute(
        'href',
        'https://www.maybank.com/'
      );

      // The report is linked once per company, not per priority.
      const sources = within(maybank).getAllByRole('link', { name: /Sustainability Report/ });
      expect(sources).toHaveLength(1);
      expect(sources[0]).toHaveAttribute('target', '_blank');

      // Unmet priorities are listed explicitly.
      const cimb = screen.getByRole('heading', { name: 'CIMB' }).closest('article');
      expect(within(cimb).getByText('Not found in report')).toBeVisible();

      // Company details link to the company's own website.
      expect(within(cimb).getByRole('link', { name: /View company details/ })).toHaveAttribute(
        'href',
        'https://www.cimb.com/'
      );
    });

    it('stores matches and offers an Ask Hera entry on the matches page (US8.3.1)', async () => {
      useIntakeStore.setState({
        employerPriorities: ['flexible_work', 'childcare_support', 'inclusive_workplace'],
      });
      open(['/plan/employers/matches']);

      await screen.findByRole('heading', { name: 'Your employer matches' });
      await vi.waitFor(() =>
        expect(useIntakeStore.getState().employerMatches.length).toBeGreaterThan(0)
      );
      fireEvent.click(screen.getByRole('button', { name: 'Ask Hera about your results' }));
      expect(await screen.findByRole('dialog', { name: 'Ask Hera' })).toBeVisible();
    });

    it('sends her back to choose when she has picked nothing', async () => {
      useIntakeStore.setState({ employerPriorities: [] });
      open(['/plan/employers/matches']);

      expect(
        await screen.findByRole('heading', { name: 'What matters most for your return?' })
      ).toBeVisible();
      expect(router.state.location.pathname).toBe('/plan/employers');
    });

    it('distinguishes temporary job-search unavailability from an empty search', async () => {
      useIntakeStore.setState({
        employerPriorities: ['flexible_work'],
        selectedRole: { role: 'Unavailable role', role_id: 'role_unavailable' },
      });
      open(['/plan/employers/matches']);

      expect(await screen.findByText(/Job openings are temporarily unavailable/i)).toBeVisible();
      expect(screen.queryByText(/No current openings were found for this target role/i)).toBeNull();
    });
  });
});

describe('companion', () => {
  it('sends learning context and applies Hera profile mutations immediately', async () => {
    let requestBody;
    server.use(
      http.post('*/api/companion/ask', async ({ request }) => {
        requestBody = await request.json();
        return HttpResponse.json({
          answer: 'SQL was added to your professional skills.',
          sources: [],
          profile_skill_update: {
            action: 'add',
            status: 'added',
            skill_id: 's1',
            skill: 'SQL',
            snapshot: {
              ...useIntakeStore.getState().snapshot,
              professional_skills: [{ skill_id: 's1', skill: 'SQL' }],
            },
            gap_result: { readiness: 79, skills_have: ['SQL'], gaps: [] },
            learned_skills: [{ skill_id: 's1', skill: 'SQL', uplift: 9 }],
          },
        });
      })
    );
    useAccountStore.setState({ user: { username: 'ccc', displayName: 'Chee Yeong' } });
    useIntakeStore.setState({
      learningProgress: { r1: { status: 'done', at: 1 } },
      learnedSkills: [{ skill_id: 'old', skill: 'Existing skill' }],
    });
    open(['/journey']);

    fireEvent.click(await screen.findByRole('button', { name: /Ask Hera/ }));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Add SQL' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ask' }));

    expect(await screen.findByText(/SQL was added/)).toBeVisible();
    expect(requestBody.journey.learningProgress).toEqual({
      r1: { status: 'done', at: 1 },
    });
    expect(requestBody.journey.learnedSkills).toEqual([
      { skill_id: 'old', skill: 'Existing skill' },
    ]);
    expect(useIntakeStore.getState().snapshot.professional_skills[0].skill).toBe('SQL');
    expect(useIntakeStore.getState().gapResult.readiness).toBe(79);
    // A Hera add updates the snapshot and gap, but not the client-owned learnedSkills.
    expect(useIntakeStore.getState().learnedSkills).toEqual([
      { skill_id: 'old', skill: 'Existing skill' },
    ]);
    expect(screen.queryByText('Use this profile')).toBeNull();
  });

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

  it('opens results Q&A from her results page, guest-allowed (US8.2.1 entry)', async () => {
    open(['/diagnostic/snapshot']);

    // Inline entry point on the results page, in addition to the floating launcher.
    fireEvent.click(await screen.findByRole('button', { name: 'Ask Hera about your results' }));

    expect(await screen.findByRole('dialog', { name: 'Ask Hera' })).toBeVisible();
    // Ask mode: shows results questions, not profile-build openers.
    expect(screen.getByRole('button', { name: OPENERS_FIRST })).toBeVisible();
  });

  it('offers an optional learning link and keeps the chat open (US8.2)', async () => {
    useAccountStore.setState({ user: { username: 'ccc', displayName: 'Chee Yeong' } });
    open(['/journey']);

    fireEvent.click(await screen.findByRole('button', { name: /Ask Hera/ }));
    fireEvent.click(
      await screen.findByRole('button', { name: 'Which focus area should I start with?' })
    );

    const cta = await screen.findByRole('button', { name: 'Open your learning plan' });
    fireEvent.click(cta);

    expect(router.state.location.pathname).toBe('/plan/learning');
    // The chat stays open across the navigation.
    expect(screen.getByRole('dialog', { name: 'Ask Hera' })).toBeVisible();
  });

  it('offers a snapshot link after a chat-built profile is confirmed (US8.1.13)', async () => {
    useIntakeStore.setState({ cv: null, cvParsed: false, snapshot: null, gapResult: null });
    open(['/diagnostic/background']);

    fireEvent.click(await screen.findByRole('button', { name: /Ask Hera/ }));
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'I was an HR officer for five years, then two years at home.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Use this profile' }));

    const cta = await screen.findByRole('button', { name: 'See my skill snapshot' });
    fireEvent.click(cta);

    expect(router.state.location.pathname).toBe('/diagnostic/snapshot');
    // No snapshot exists yet, so the snapshot page generates it from cv + break on
    // load and renders the result.
    expect(await screen.findByRole('heading', { name: 'Your skill snapshot' })).toBeVisible();
    // The chat stays open across the navigation.
    expect(screen.getByRole('dialog', { name: 'Ask Hera' })).toBeVisible();
  });

  it('sends confirmed skill ids to snapshot generate', async () => {
    let body = null;
    server.use(
      http.post('*/api/snapshot/generate', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(snapshotFixture);
      })
    );
    useIntakeStore.setState({
      cv: { fileName: 'c.pdf', fileSize: 1 },
      break: { duration_years: 2, activities: ['care_household.ran_household'] },
      employerPriorities: ['flexible_work'],
      confirmedSkills: [{ skill_id: 's1', skill_name: 'SQL' }],
      snapshot: null,
    });
    open(['/diagnostic/snapshot']);

    await screen.findByRole('heading', { name: 'Your skill snapshot' });
    expect(body.confirmed_skills).toEqual(['s1']);
  });

  it('renders both the profile card and a role checklist in one turn', async () => {
    server.use(
      http.post('*/api/companion/ask', async () =>
        HttpResponse.json({
          answer: 'Drafted your profile and here are role skills.',
          sources: [],
          journey_update: {
            cv: { raw_text: 'x', experiences: [], skill_mentions: [] },
            break: { duration_years: 2, activities: ['care_household.ran_household'] },
          },
          skill_choices: [{ skill_id: 's1', skill_name: 'Campaign Management' }],
          skill_choices_role_id: 'R1',
        })
      )
    );
    useIntakeStore.setState({ cv: null, cvParsed: false, snapshot: null, gapResult: null });
    open(['/diagnostic/background']);

    fireEvent.click(await screen.findByRole('button', { name: /Ask Hera/ }));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'I was a manager.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    // both surfaces present in the same turn
    expect(await screen.findByRole('checkbox', { name: 'Campaign Management' })).toBeVisible();
    expect(screen.getByText(/Your profile so far/i)).toBeVisible();
  });

  it('echoes the offered role id on the next turn so the same role is not re-offered', async () => {
    const bodies = [];
    server.use(
      http.post('*/api/companion/ask', async ({ request }) => {
        bodies.push(await request.json());
        return HttpResponse.json({
          answer: 'ok',
          sources: [],
          skill_choices: bodies.length === 1 ? [{ skill_id: 's1', skill_name: 'SQL' }] : undefined,
          skill_choices_role_id: bodies.length === 1 ? 'R1' : undefined,
        });
      })
    );
    useIntakeStore.setState({ cv: null, cvParsed: false, snapshot: null, gapResult: null });
    open(['/diagnostic/background']);

    fireEvent.click(await screen.findByRole('button', { name: /Ask Hera/ }));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'I was a manager.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    await screen.findByRole('checkbox', { name: 'SQL' });

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'anything else?' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    await vi.waitFor(() => expect(bodies.length).toBe(2));
    expect(bodies[1].journey.roleSkillsOfferedForRoleId).toBe('R1');
  });

  it('offers a role-skill checklist and applies ticked skills (skill elicitation)', async () => {
    useIntakeStore.setState({
      cv: null,
      cvParsed: false,
      snapshot: null,
      gapResult: null,
      confirmedSkills: [],
    });
    open(['/diagnostic/background']);

    fireEvent.click(await screen.findByRole('button', { name: /Ask Hera/ }));
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'I was a marketing manager.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    const campaign = await screen.findByRole('checkbox', { name: 'Campaign Management' });
    fireEvent.click(campaign);
    fireEvent.click(screen.getByRole('button', { name: 'Add these skills' }));

    expect(useIntakeStore.getState().confirmedSkills.map((s) => s.skill_name)).toContain(
      'Campaign Management'
    );
  });

  it('keeps confirmed role skills when a chat profile is confirmed', async () => {
    // Role skills confirmed earlier must survive confirmProfile, whose setCv call
    // would otherwise clear them.
    useIntakeStore.setState({
      cv: null,
      cvParsed: false,
      snapshot: null,
      gapResult: null,
      confirmedSkills: [{ skill_id: 's1', skill_name: 'Campaign Management' }],
    });
    open(['/diagnostic/background']);

    fireEvent.click(await screen.findByRole('button', { name: /Ask Hera/ }));
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'I was an HR officer for five years, then two years at home.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Use this profile' }));

    expect(useIntakeStore.getState().confirmedSkills.map((s) => s.skill_id)).toEqual(['s1']);
  });

  it('captures work priorities in the chat and applies them on confirm', async () => {
    useIntakeStore.setState({
      cv: null,
      cvParsed: false,
      snapshot: null,
      gapResult: null,
      employerPriorities: [],
    });
    open(['/diagnostic/background']);

    fireEvent.click(await screen.findByRole('button', { name: /Ask Hera/ }));
    fireEvent.change(screen.getByRole('textbox'), {
      target: {
        value: 'HR officer for five years, then home. I most want flexible work and childcare.',
      },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    // The drafted profile shows the priorities before anything is saved.
    expect(await screen.findByText(/Flexible Work/)).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Use this profile' }));

    expect(useIntakeStore.getState().employerPriorities).toEqual([
      'flexible_work',
      'childcare_support',
    ]);
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

    // Confirming applies the profile through the store actions, marking the CV
    // step complete; the snapshot is generated on the next step.
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
    // Build mode by default before a snapshot exists, with a switch to ask mode.
    fireEvent.click(await screen.findByRole('button', { name: 'Ask a question instead' }));
    expect(await screen.findByRole('button', { name: OPENERS_FIRST })).toBeVisible();

    fireEvent.click(screen.getByRole('button', { name: 'Build my profile without a CV' }));
    expect(await screen.findByText(/start with your last job before your break/)).toBeVisible();
  });

  it('stays off the landing page, where there is nothing of hers to read', async () => {
    open(['/']);

    expect(await screen.findByRole('heading', { level: 1 })).toBeVisible();
    expect(screen.queryByRole('button', { name: /Ask Hera/ })).toBeNull();
  });
});
