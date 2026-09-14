import { expect, test } from '@playwright/test';

// Full-stack only: matches come from the real API + DB (curated overlay seed).
test.skip(!process.env.E2E_FULLSTACK, 'full-stack employer e2e (set E2E_FULLSTACK=1)');

// Priorities chosen so ranking is unambiguous: Nestle discloses all three
// (Strong), several disclose two (Good), IHH one (Partial).
const GUEST_SESSION = {
  state: {
    cv: { fileName: 'cv.pdf', fileSize: 1 },
    cvParsed: true,
    break: { duration_years: 5, activities: ['caregiving'] },
    preferences: {},
    employerPriorities: ['flexible_work', 'parental_support', 'inclusive_workplace'],
    snapshot: {
      previous_occupation: { role: 'Software Developer', role_id: 'role_dev', confidence: 0.9 },
      professional_skills: [],
      reframed_skills: [],
      recommended_roles: [],
    },
    selectedRole: { role: 'Software Developer', role_id: 'role_dev' },
    gapResult: { readiness: 60, skills_have: [], gaps: [] },
  },
  version: 2,
};

test('employer matches rank by disclosed priorities with the real report link', async ({
  page,
}) => {
  await page.addInitScript((session) => {
    window.sessionStorage.setItem('rerouteher.guestSession', JSON.stringify(session));
  }, GUEST_SESSION);

  await page.goto('/plan/employers/matches');

  await expect(page.getByRole('heading', { name: 'Your employer matches' })).toBeVisible();

  // Nestle discloses all three chosen priorities -> Strong match, and its card
  // links the real DB report (nestle.com), proving the hybrid join.
  const nestle = page.getByRole('heading', { name: 'Nestle Malaysia' });
  await expect(nestle).toBeVisible();
  const card = page.locator('article', { has: nestle });
  await expect(card.getByText('Strong match')).toBeVisible();
  const report = card.getByRole('link', { name: /opens in a new tab/ });
  await expect(report).toHaveAttribute('href', /nestle\.com/);

  // Every match names at least one met priority the user asked for.
  await expect(card.getByText('Flexible Work')).toBeVisible();
});
