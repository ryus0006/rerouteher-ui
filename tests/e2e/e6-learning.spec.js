import { expect, test } from '@playwright/test';

// Full-stack only: the learning recommendations come from the real API + DB
// (see helpers/fullstack-README.md). Reaching /plan/learning needs guest journey
// state, so we seed the client store; the recommendations themselves are wired.
test.skip(!process.env.E2E_FULLSTACK, 'full-stack learning e2e (set E2E_FULLSTACK=1)');

// A seeded guest journey: a snapshot, a selected role, and three gaps carrying
// real skill_taxonomy ids. JavaScript and SQL have curated rows from the db seed
// (db/04_e6_learning_seed.sql); Project Management has none, so the backend must
// supply a YouTube search fallback.
const GUEST_SESSION = {
  state: {
    cv: { fileName: 'cv.pdf', fileSize: 1 },
    cvParsed: true,
    break: { duration_years: 5, activities: ['caregiving'] },
    employerPriorities: [],
    snapshot: {
      previous_occupation: { role: 'Software Developer', role_id: 'role_dev', confidence: 0.9 },
      professional_skills: [],
      reframed_skills: [],
      recommended_roles: [],
    },
    selectedRole: { role: 'Software Developer', role_id: 'role_dev' },
    gapResult: {
      readiness: 60,
      skills_have: [],
      gaps: [
        {
          skill_id: '3cd569a2-4f88-4c1e-9995-8dce8c5e51a7',
          skill: 'JavaScript',
          band: 'role',
          importance: 0.9,
          uplift: 12,
        },
        {
          skill_id: '598de5b0-5b58-4ea7-8058-a4bc4d18c742',
          skill: 'SQL',
          band: 'role',
          importance: 0.8,
          uplift: 9,
        },
        {
          skill_id: '7111b95d-0ce3-441a-9d92-4c75d05c4388',
          skill: 'Project Management',
          band: 'role',
          importance: 0.7,
          uplift: 6,
        },
      ],
    },
  },
  version: 2,
};

test('learning plan shows curated resources and a search fallback from the real backend', async ({
  page,
}) => {
  await page.addInitScript((session) => {
    window.sessionStorage.setItem('rerouteher.guestSession', JSON.stringify(session));
  }, GUEST_SESSION);

  await page.goto('/plan/learning');

  await expect(page.getByRole('heading', { name: 'Your learning plan' })).toBeVisible();

  // Curated rows from our db seed (04_e6_learning_seed.sql).
  await expect(page.getByRole('heading', { name: 'Introduction to JavaScript' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Learn SQL Fundamentals' })).toBeVisible();

  // Project Management has no curated row, so the backend supplies a YouTube search.
  await expect(page.getByRole('heading', { name: 'Project Management tutorials' })).toBeVisible();

  // Every resource opens on its provider in a new tab (AC 6.3.1 / 6.3.2).
  const links = page.getByRole('link', { name: /opens in a new tab/ });
  expect(await links.count()).toBeGreaterThan(0);
  for (const link of await links.all()) {
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', /noopener/);
  }
});
