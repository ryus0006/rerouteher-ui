import { expect, test } from '@playwright/test';

// Full-stack only: matches come from the real API + DB and the deterministic E9 fixture.
test.skip(!process.env.E2E_FULLSTACK, 'full-stack employer e2e (set E2E_FULLSTACK=1)');

// The fixture supplies a ready R03 opening for CIMB Group Holdings Berhad.
const GUEST_SESSION = {
  state: {
    cv: { fileName: 'cv.pdf', fileSize: 1 },
    cvParsed: true,
    break: { duration_years: 5, activities: ['caregiving'] },
    employerPriorities: ['flexible_work', 'inclusive_workplace'],
    snapshot: {
      previous_occupation: { role: 'Human Resources Officer', role_id: 'R03', confidence: 0.9 },
      professional_skills: [],
      reframed_skills: [],
      recommended_roles: [],
    },
    selectedRole: { role: 'Human Resources Officer', role_id: 'R03' },
    gapResult: { readiness: 60, skills_have: [], gaps: [] },
  },
  version: 2,
};

test('employer matches show the fixture opening and real report link', async ({ page }) => {
  await page.addInitScript((session) => {
    window.sessionStorage.setItem('rerouteher.guestSession', JSON.stringify(session));
  }, GUEST_SESSION);

  await page.goto('/plan/employers/matches');

  await expect(page.getByRole('heading', { name: 'Your employer matches' })).toBeVisible();

  const cimb = page.getByRole('heading', { name: 'CIMB Group Holdings Berhad' });
  await expect(cimb).toBeVisible();
  const card = page.locator('article', { has: cimb });
  await expect(card.getByText('Hiring for your role.')).toBeVisible();
  await expect(card.getByText('Human Resources Officer')).toBeVisible();
  await expect(card.getByRole('link', { name: /Open job/ })).toHaveAttribute(
    'href',
    'https://example.test/jobs/hr-officer-r03'
  );
  const report = card.getByRole('link', { name: /opens in a new tab/ });
  await expect(report).toHaveAttribute('href', /cimb\.com/);

  // Every match names at least one met priority the user asked for.
  await expect(card.getByText('Flexible Work')).toBeVisible();
});
