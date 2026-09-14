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

  /* Learning resources for the gaps she was actually shown (E6). Filtering by
     the requested skills is the point: a resource that answers no gap of hers
     would break the promise the page makes about relevance. */
  http.post('*/api/learning/recommend', async ({ request }) => {
    const { skills = [] } = await request.json();

    const resources = learningDefault.resources.filter((resource) =>
      skills.includes(resource.skill)
    );
    const groups = learningDefault.groups.filter((group) => skills.includes(group.skill));

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

  /* The conversational route into a snapshot (US8.1). It returns the same
     payload the CV route returns, so nothing downstream can tell the two
     apart — which is the requirement, not a shortcut in the stand-in. */
  http.post('*/api/companion/profile', async ({ request }) => {
    const { answers = {} } = await request.json();

    if (!answers.occupation?.trim()) {
      return HttpResponse.json(
        { error: 'Tell me what your job was and I can build the rest.' },
        { status: 400 }
      );
    }

    return HttpResponse.json({
      ...snapshotHighConfidence,
      previous_occupation: {
        ...snapshotHighConfidence.previous_occupation,
        role: answers.occupation.trim(),
        method: 'conversation',
      },
    });
  }),

  /* The re-entry companion (E8). Answers are assembled from the journey sent
     with the question, so the stand-in demonstrates the one thing that matters
     about this feature: it talks about her numbers, not about careers. */
  http.post('*/api/companion/ask', async ({ request }) => {
    const { question = '', context = {} } = await request.json();
    const { readiness, role, focusAreas = [], skillCount } = context;
    const asked = question.toLowerCase();

    if (!readiness) {
      return HttpResponse.json({
        answer:
          'I can answer once your readiness is worked out. Finish the gap step and ask me again — I will have your score and your focus areas to work from.',
        sources: [],
      });
    }

    if (asked.includes('gap') || asked.includes('focus') || asked.includes('learn')) {
      return HttpResponse.json({
        answer: `Your focus areas are ${focusAreas.join(', ')}. They are ranked by how much readiness each one adds for ${role}, not by how hard they are — so the first one is the one worth your next free evening.`,
        sources: ['Your gap result', 'O*NET role requirements'],
      });
    }

    if (asked.includes('break') || asked.includes('experience')) {
      return HttpResponse.json({
        answer: `${skillCount} of the skills on your snapshot came from your CV and your time away combined. Budgeting, scheduling and coordination are mapped to the same O*NET taxonomy an employer reads, so they count as experience, not as a gap.`,
        sources: ['Your skill snapshot', 'O*NET skill taxonomy'],
      });
    }

    return HttpResponse.json({
      answer: `You are ${readiness}% ready for ${role} today. That is the share of the role's requirements already covered by skills on your snapshot — it is not a pass mark, and most people apply well below 100%.`,
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
