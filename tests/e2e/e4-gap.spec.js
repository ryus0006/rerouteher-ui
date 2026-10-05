import { expect, test } from '@playwright/test';
import { mockApi } from './helpers/mockApi.js';

const VALID_CV = 'tests/fixtures/cv/valid-cv.pdf';

/** Walks the full intake and snapshot so the gap page is reached as a guest reaches it. */
async function reachGap(page) {
  await page.goto('/diagnostic/background');
  await page.locator('input[type="file"]').setInputFiles(VALID_CV);
  await page.getByRole('button', { name: 'Continue' }).click();

  await page.getByRole('slider').fill('5');
  await page.getByText('Childcare', { exact: true }).click();
  await page.getByRole('button', { name: 'Continue to Work Priorities' }).click();

  await page.getByText('Flexible Work').click();
  await page.getByRole('button', { name: 'Continue to Skill Snapshot' }).click();

  await page.getByRole('button', { name: 'See my readiness & gaps' }).click();
  await expect(page).toHaveURL(/\/diagnostic\/gap$/);
}

const focusAreas = (page) =>
  page.getByRole('list', { name: 'Your top skills to build' }).getByRole('listitem');

/* Focus-area names also appear in the closing panel, so gap assertions are
   scoped to the ranked list. */

/** The radio itself is visually hidden, so selection goes through its label. */
const selectRole = (page, role) => page.getByText(role, { exact: true }).click();

test.describe('E4 — Role Readiness & Skill Gap', () => {
  test('AC 4.1.1 — the readiness page shows Target Role & Gap as the current step with the target roles', async ({
    page,
  }) => {
    await mockApi(page);
    await reachGap(page);

    await expect(page.locator('[data-state="current"]')).toContainText('Gap');
    await expect(page.getByRole('radio')).toHaveCount(3);
  });

  test('AC 4.1.2 — the closest-match role is labelled and selected by default', async ({
    page,
  }) => {
    await mockApi(page);
    await reachGap(page);

    await expect(page.getByRole('radio', { checked: true })).toHaveValue('role_ux');
    await expect(page.getByText('Closest match', { exact: true })).toBeVisible();
  });

  test('AC 4.1.3 — the selected target role name is shown on the readiness card', async ({
    page,
  }) => {
    await mockApi(page);
    await reachGap(page);

    await expect(page.getByRole('heading', { name: 'Senior UX/UI Designer' })).toBeVisible();
  });

  test('AC 4.1.4 — readiness renders as met-requirement counts, without a percentage or level @smoke', async ({
    page,
  }) => {
    await mockApi(page);
    await reachGap(page);

    await expect(page.getByText('requirements you already have')).toBeVisible();
    await expect(page.getByRole('main').getByText(/\d+\s?%/)).toHaveCount(0);
    await expect(page.getByText(/strong match|good match/i)).toHaveCount(0);
  });

  test('AC 4.1.4 — a readiness result is available when the gap is opened from the snapshot', async ({
    page,
  }) => {
    await mockApi(page);
    await reachGap(page); // computes the gap once
    await expect(focusAreas(page).first()).toBeVisible();

    await page.getByRole('button', { name: 'Back to Skill Snapshot' }).click();
    await expect(page).toHaveURL(/\/diagnostic\/snapshot$/);

    // A fresh compute must fire on the Snapshot -> Gap transition, even though a
    // gap result already exists in the store from the first visit.
    const compute = page.waitForRequest('**/api/gap/compute');
    await page.getByRole('button', { name: 'See my readiness & gaps' }).click();
    await compute;
    await expect(page).toHaveURL(/\/diagnostic\/gap$/);
  });

  test('AC 4.1.5 — an explanation of how the result is worked out is available', async ({
    page,
  }) => {
    await mockApi(page);
    await reachGap(page);

    await page.getByText('How this result is worked out').click();
    await expect(page.getByText(/skills this role asks for/i)).toBeVisible();
  });

  test('AC 4.1.6 — switching role updates readiness without a full reload', async ({ page }) => {
    await mockApi(page);
    await reachGap(page);
    await expect(page.getByText('requirements you already have')).toBeVisible();

    let navigated = false;
    page.on('load', () => {
      navigated = true;
    });

    await selectRole(page, 'Digital Marketing');

    await expect(page.getByRole('heading', { name: 'Digital Marketing' })).toBeVisible();
    await expect(
      page.getByRole('button', { name: /See the 3 you already have out of 6 requirements/ })
    ).toBeVisible();
    expect(navigated).toBe(false);
  });

  test('AC 4.1.7 — a reload restores the role and readiness without recomputing', async ({
    page,
  }) => {
    await mockApi(page);
    await reachGap(page);
    await expect(page.getByText('requirements you already have')).toBeVisible();

    let recomputed = false;
    await page.route('**/api/gap/compute', (route) => {
      recomputed = true;
      return route.abort();
    });

    await page.reload();

    await expect(page.getByText('requirements you already have')).toBeVisible();
    await expect(page.getByRole('radio', { checked: true })).toHaveValue('role_ux');
    expect(recomputed).toBe(false);
  });

  test('AC 4.1.8 — Back to Skill Snapshot opens the Skill Snapshot page', async ({ page }) => {
    await mockApi(page);
    await reachGap(page);

    await page.getByRole('button', { name: 'Back to Skill Snapshot' }).click();
    await expect(page).toHaveURL(/\/diagnostic\/snapshot$/);
  });

  test('AC 4.2.1 — the missing-requirement count and skills she has are shown', async ({
    page,
  }) => {
    await mockApi(page);
    await reachGap(page);

    const met = page.getByRole('button', {
      name: /See the 7 you already have out of 15 requirements/,
    });
    await expect(met).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Missing for this role' })).toBeVisible();

    // Met requirement names stay collapsed behind the count.
    await expect(page.getByText('User Research & Persona Synthesis')).toBeHidden();
    await met.click();
    await expect(page.getByText('User Research & Persona Synthesis')).toBeVisible();
  });

  test('AC 4.2.2 — up to three ranked focus areas are shown under "Your top 3"', async ({
    page,
  }) => {
    await mockApi(page);
    await reachGap(page);

    await expect(page.getByText(/Your top \d to start with/)).toBeVisible();
    await expect(focusAreas(page)).toHaveCount(3);
  });

  test('AC 4.2.3 — gaps read as specific skills, not vague labels', async ({ page }) => {
    await mockApi(page);
    await reachGap(page);

    await expect(focusAreas(page).first()).toContainText('AI Design Tools (Figma AI, Midjourney)');
    await expect(page.getByText(/^Improve AI skills$/i)).toHaveCount(0);
  });

  test('AC 4.2.4 — each gap is labelled Role skill or AI literacy', async ({ page }) => {
    await mockApi(page);
    await reachGap(page);

    await expect(page.getByText('AI literacy').first()).toBeVisible();
    await expect(page.getByText('Role skill').first()).toBeVisible();
  });

  test('AC 4.2.5 — switching role updates the priority gaps', async ({ page }) => {
    await mockApi(page);
    await reachGap(page);
    await expect(focusAreas(page).first()).toContainText('AI Design Tools (Figma AI, Midjourney)');

    await selectRole(page, 'Digital Marketing');

    await expect(focusAreas(page).first()).toContainText('Campaign Analytics & Attribution');
    await expect(page.getByText('AI Design Tools (Figma AI, Midjourney)')).toHaveCount(0);
  });

  test('AC 4.3.1 — focus areas carry no percentages or impact tags', async ({ page }) => {
    await mockApi(page);
    await reachGap(page);

    await expect(page.getByText(/% if learned/)).toHaveCount(0);
    await expect(page.getByText('Biggest difference')).toHaveCount(0);
  });

  test('AC 4.3.2 — the highest-improvement gap appears first', async ({ page }) => {
    await mockApi(page);
    await reachGap(page);

    await expect(focusAreas(page).first()).toContainText('1');
    await expect(focusAreas(page).first()).toContainText('AI Design Tools (Figma AI, Midjourney)');
  });

  test('AC 4.3.3 — the match panel counts met requirements against the total', async ({ page }) => {
    await mockApi(page);
    await reachGap(page);

    await expect(page.getByText('Your next steps are the 3 skills on the right.')).toBeVisible();
    await expect(
      page.getByRole('button', { name: /See the 7 you already have out of 15 requirements/ })
    ).toBeVisible();
  });

  test('AC 4.3.4 — the estimate-not-a-guarantee note is shown', async ({ page }) => {
    await mockApi(page);
    await reachGap(page);

    await expect(page.getByText(/not a guarantee of employment/i)).toBeVisible();
  });

  test('AC 4.3.5 — switching role reorders the top skills', async ({ page }) => {
    await mockApi(page);
    await reachGap(page);
    await expect(focusAreas(page).first()).toContainText('AI Design Tools (Figma AI, Midjourney)');

    await selectRole(page, 'Digital Marketing');

    await expect(focusAreas(page).first()).toContainText('Campaign Analytics & Attribution');
  });

  test('@regression — gaps beyond the top three are still named, without a ranking', async ({
    page,
  }) => {
    await mockApi(page);
    await reachGap(page);

    // 7 met + 3 focus areas + 5 also-missing must reconcile with "7 of 15".
    await expect(
      page.getByRole('button', { name: /See the 7 you already have out of 15 requirements/ })
    ).toBeVisible();
    await expect(page.getByText('Prompt Engineering for UX Workflows')).toBeVisible();
  });

  test('@regression — with fewer than three gaps, only the actual gaps are shown', async ({
    page,
  }) => {
    await mockApi(page, { gap: 'gap.two-gaps' });
    await reachGap(page);

    await expect(focusAreas(page)).toHaveCount(2);
  });

  test('@regression — exactly one AI-literacy gap is kept so role skills still surface', async ({
    page,
  }) => {
    await mockApi(page);
    await reachGap(page);

    await expect(focusAreas(page).filter({ hasText: 'AI literacy' })).toHaveCount(1);
    await expect(focusAreas(page).filter({ hasText: 'Role skill' })).toHaveCount(2);
  });
});
