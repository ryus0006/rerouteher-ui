import { http, HttpResponse } from 'msw';
import cvParsed from './fixtures/cv-parse.200.json';
import snapshotHighConfidence from './fixtures/snapshot.high-confidence.json';
import gapDefault from './fixtures/gap.default.json';
import gapAltRole from './fixtures/gap.alt-role.json';
import learningDefault from './fixtures/learning.default.json';
import employersDefault from './fixtures/employers.default.json';
import { validateCvFile } from '../api/cv.js';
import { interviewHandlers } from './interview.js';

const DEFAULT_ROLE_ID = 'role_ux';

const cvDraftForRole = (roleId) => ({
  version: 3,
  roleId,
  personal: { name: '', email: '', phone: '', location: '' },
  summary: `Professional prepared for ${roleId}.`,
  skills: ['User Research & Persona Synthesis', 'Active Listening'],
  experiences: [
    {
      title: 'Senior Product Designer',
      organisation: 'Wira Digital',
      start: '2015-03',
      end: '2019-11',
      description: '- Owned the design system and ran usability testing.',
    },
  ],
  careerBreak: null,
});

/** In-memory accounts created during the session, keyed by username. */
const accounts = new Map();

/** Simulated session: the currently signed-in username. */
let sessionUser = null;

export const handlers = [
  ...interviewHandlers,

  http.post('*/api/cv/parse', async ({ request }) => {
    const form = await request.formData();
    const file = form.get('file');

    const message = validateCvFile(file);
    if (message) return HttpResponse.json({ error: message }, { status: 400 });

    return HttpResponse.json(cvParsed);
  }),

  http.post('*/api/cv/generate', async ({ request }) => {
    const { roleId = DEFAULT_ROLE_ID } = await request.json();
    return HttpResponse.json({
      role_id: roleId,
      generation_status: 'generated',
      generated_at: '2026-10-04T00:00:00Z',
      draft: cvDraftForRole(roleId),
    });
  }),

  http.post('*/api/cv/improve', async ({ request }) => {
    const { section } = await request.json();
    return HttpResponse.json({
      section,
      experience_index: section === 'experience' ? 0 : null,
      suggestion:
        section === 'summary'
          ? 'Professional prepared to contribute through user research and design coordination.'
          : 'Owned the design system and ran usability testing across product teams.',
      evidence:
        section === 'summary'
          ? 'Owned the design system, ran usability testing, and led information architecture for the mobile app.'
          : 'Owned the design system, ran usability testing, and led information architecture for the mobile app.',
    });
  }),

  /* Fixture definitions mirror skill_taxonomy.definition. The last reframed
     skill intentionally has no definition, to exercise the missing-definition
     state. */
  http.post('*/api/snapshot/generate', () => HttpResponse.json(snapshotHighConfidence)),

  http.post('*/api/gap/compute', async ({ request }) => {
    const { target_role_id: targetRoleId } = await request.json();
    return HttpResponse.json(targetRoleId === DEFAULT_ROLE_ID ? gapDefault : gapAltRole);
  }),

  /* Learning resources for the requested gaps, keyed by skill_id to match the
     real endpoint contract. */
  http.post('*/api/learning/recommend', async ({ request }) => {
    const { skill_ids: skillIds = [] } = await request.json();

    const resources = learningDefault.resources.filter((resource) =>
      skillIds.includes(resource.skill_id)
    );
    const groups = learningDefault.groups.filter((group) => skillIds.includes(group.skill_id));

    return HttpResponse.json({ groups, resources });
  }),

  /* Employers ranked against the requested priorities. Each fixture employer
     lists the priorities its report covers, so unmet priorities are explicit. */
  http.post('*/api/employers/match', async ({ request }) => {
    const { priorities = [], target_role_id: targetRoleId } = await request.json();

    if (targetRoleId === 'role_unavailable') {
      return HttpResponse.json({
        job_search: { status: 'temporarily_unavailable', searched_at: null },
        employers: [],
      });
    }

    const employers = employersDefault.employers
      .map(({ job, ...employer }) => ({
        ...employer,
        job: job ?? null,
        met: priorities.filter((id) => employer.discloses.includes(id)),
        unmet: priorities.filter((id) => !employer.discloses.includes(id)),
      }))
      /* Exclude employers that meet none of the requested priorities. */
      .filter((employer) => employer.met.length > 0)
      .sort(
        (a, b) =>
          Number(Boolean(b.job)) - Number(Boolean(a.job)) ||
          b.met.length - a.met.length ||
          a.name.localeCompare(b.name)
      );

    return HttpResponse.json({
      job_search: {
        status: employers.some((employer) => employer.job) ? 'ready' : 'empty',
        searched_at: '2026-10-04T00:00:00Z',
      },
      employers,
    });
  }),

  /* Companion endpoint. Without a snapshot it acts as the profile builder and
     returns a `journey_update` (cv + break), mirroring the real agent's
     update_profile tool; with a snapshot it answers from the journey sent in
     the request. */
  http.post('*/api/companion/ask', async ({ request }) => {
    const { question = '', journey = {} } = await request.json();
    const { snapshot, gapResult, selectedRole } = journey;
    const asked = question.toLowerCase();

    // Pre-snapshot: when an occupation is mentioned, return a role-skill checklist,
    // mirroring the offer_role_skills tool.
    if (!snapshot && /\bmanager\b|\bmy role\b|\boccupation\b/.test(asked)) {
      return HttpResponse.json({
        answer: 'Here are skills common for that role. Tick the ones you have.',
        sources: [],
        skill_choices: [
          { skill_id: 's1', skill_name: 'Campaign Management' },
          { skill_id: 's2', skill_name: 'SEO' },
        ],
      });
    }

    // Pre-snapshot: behave as the profile builder and hand back a structured profile.
    if (!snapshot) {
      return HttpResponse.json({
        answer:
          'Thanks - I have turned that into a profile covering your occupation, skills and break. Head to your snapshot when you are ready.',
        sources: ['Our conversation'],
        journey_update: {
          cv: {
            raw_text: question,
            experiences: [],
            skill_mentions: ['coordination', 'scheduling'],
          },
          break: { duration_years: 2, activities: ['caregiving'] },
          employerPriorities: ['flexible_work', 'childcare_support'],
        },
      });
    }

    const readiness = gapResult?.readiness ?? null;
    const role = selectedRole?.role ?? 'your target role';

    if (asked.includes('gap') || asked.includes('focus') || asked.includes('learn')) {
      const focusAreas = (gapResult?.gaps ?? []).map((g) => g.skill);
      return HttpResponse.json({
        answer: `Your focus areas are ${focusAreas.join(', ')}. They are ranked by how much readiness each one adds for ${role}, so the first one is the one worth your next free evening.`,
        sources: ['Your gap result'],
        // Mirrors the point_to_step tool: include an optional link to the learning plan.
        cta: { label: 'Open your learning plan', to: '/plan/learning' },
      });
    }

    return HttpResponse.json({
      answer: `You are ${readiness}% ready for ${role} today. That is the share of the role's requirements already covered by skills on your snapshot - it is not a pass mark, and most people apply well below 100%.`,
      sources: ['Your gap result'],
    });
  }),

  /* Account service mock. Accounts persist for the lifetime of the page,
     supporting create, sign-out and sign-in with the saved journey. The username
     `taken` always fails, to exercise the duplicate-username error. */
  http.post('*/api/account/create', async ({ request }) => {
    const { username, display_name: displayName, plan } = await request.json();

    if (username?.toLowerCase() === 'taken') {
      return HttpResponse.json(
        { error: 'That username is taken. Try another one.' },
        { status: 409 }
      );
    }

    const account = { username, display_name: displayName || username, plan: plan ?? null };
    accounts.set(username.toLowerCase(), account);
    sessionUser = username.toLowerCase();

    return HttpResponse.json({ username: account.username, display_name: account.display_name });
  }),

  http.post('*/api/account/plan', async ({ request }) => {
    if (!sessionUser) {
      return HttpResponse.json({ error: 'Not signed in.' }, { status: 401 });
    }

    const { plan } = await request.json();
    const account = accounts.get(sessionUser);
    if (account) account.plan = plan ?? null;

    return HttpResponse.json({ status: 'saved' });
  }),

  http.post('*/api/account/sign-in', async ({ request }) => {
    const { username, password } = await request.json();

    if (!username || !password) {
      return HttpResponse.json(
        { error: 'That username and password do not match.' },
        { status: 401 }
      );
    }

    const account = accounts.get(username.toLowerCase());
    sessionUser = username.toLowerCase();

    return HttpResponse.json({
      username,
      display_name: account?.display_name ?? username,
      plan: account?.plan ?? null,
    });
  }),

  http.post('*/api/account/sign-out', () => {
    sessionUser = null;
    return HttpResponse.json({ status: 'signed_out' });
  }),
];
