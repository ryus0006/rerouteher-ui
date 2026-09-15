import { http, HttpResponse } from 'msw';
import cvParsed from './fixtures/cv-parse.200.json';
import snapshotHighConfidence from './fixtures/snapshot.high-confidence.json';
import gapDefault from './fixtures/gap.default.json';
import gapAltRole from './fixtures/gap.alt-role.json';
import learningDefault from './fixtures/learning.default.json';
import employersDefault from './fixtures/employers.default.json';
import { validateCvFile } from '../api/cv.js';

const DEFAULT_ROLE_ID = 'role_ux';

/** Accounts created this session, so a sign-in can hand the journey back. */
const accounts = new Map();

/** Stands in for the session cookie: who the mock currently treats as signed in. */
let sessionUser = null;

export const handlers = [
  http.post('*/api/cv/parse', async ({ request }) => {
    const form = await request.formData();
    const file = form.get('file');

    const message = validateCvFile(file);
    if (message) return HttpResponse.json({ error: message }, { status: 400 });

    return HttpResponse.json(cvParsed);
  }),

  http.post('*/api/snapshot/generate', () => HttpResponse.json(snapshotHighConfidence)),

  http.post('*/api/gap/compute', async ({ request }) => {
    const { target_role_id: targetRoleId } = await request.json();
    return HttpResponse.json(targetRoleId === DEFAULT_ROLE_ID ? gapDefault : gapAltRole);
  }),

  /* Learning resources for the gaps she was actually shown (E6). Keyed by
     skill_id to match the real endpoint's deterministic contract. Used only by
     unit tests now (the running app always calls the real backend). */
  http.post('*/api/learning/recommend', async ({ request }) => {
    const { skill_ids: skillIds = [] } = await request.json();

    const resources = learningDefault.resources.filter((resource) =>
      skillIds.includes(resource.skill_id)
    );
    const groups = learningDefault.groups.filter((group) => skillIds.includes(group.skill_id));

    return HttpResponse.json({ groups, resources });
  }),

  /* Employers ranked against the priorities she chose (E9). Every employer
     lists the priorities its published report actually covers, so "not found
     in report" is a real answer rather than a gap in the fixture. */
  http.post('*/api/employers/match', async ({ request }) => {
    const { priorities = [] } = await request.json();

    const employers = employersDefault.employers
      .map((employer) => ({
        ...employer,
        met: priorities.filter((id) => employer.discloses.includes(id)),
        unmet: priorities.filter((id) => !employer.discloses.includes(id)),
      }))
      /* Silent on everything she asked for is not a match, it is a different
         company. Listing it would pad the count with rows that say nothing. */
      .filter((employer) => employer.met.length > 0)
      .sort((a, b) => b.met.length - a.met.length);

    return HttpResponse.json({ employers });
  }),

  /* The re-entry companion (E8). One conversational endpoint, guest-usable. When
     she has no snapshot yet the stand-in plays the profile-build role and returns
     a journey_update (cv + break) the frontend applies to its store, exactly as
     the real agent's update_profile tool does; once she has results it answers
     from the journey sent with the question. */
  http.post('*/api/companion/ask', async ({ request }) => {
    const { question = '', journey = {} } = await request.json();
    const { snapshot, gapResult, selectedRole } = journey;
    const asked = question.toLowerCase();

    // Pre-snapshot: if she names her occupation, offer a role-skill checklist (US8.1.17),
    // standing in for the offer_role_skills tool.
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
        // As the real point_to_step tool does: offer an optional link to her plan.
        cta: { label: 'Open your learning plan', to: '/plan/learning' },
      });
    }

    return HttpResponse.json({
      answer: `You are ${readiness}% ready for ${role} today. That is the share of the role's requirements already covered by skills on your snapshot - it is not a pass mark, and most people apply well below 100%.`,
      sources: ['Your gap result'],
    });
  }),

  /* Stands in for the account service. Accounts live for the life of the page,
     which is enough to walk US5.3 and US5.4: create, sign out, sign back in and
     the saved journey comes back. `taken` exists so the duplicate-username path
     can be walked without a backend. */
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
