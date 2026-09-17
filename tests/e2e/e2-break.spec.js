import { expect, test } from '@playwright/test';
import { ACTIVITY_TAXONOMY } from '../../src/config/activityTaxonomy.js';
import { mockApi } from './helpers/mockApi.js';

const VALID_CV = 'tests/fixtures/cv/valid-cv.pdf';

/** Completes the Background step so the break step is reachable as a user reaches it. */
async function reachBreakStep(page) {
  await page.goto('/diagnostic/background');
  await page.locator('input[type="file"]').setInputFiles(VALID_CV);
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page).toHaveURL(/\/diagnostic\/break$/);
}

const slider = (page) => page.getByRole('slider');
const activity = (page, label) => page.getByText(label, { exact: true });

test.beforeEach(async ({ page }) => {
  await mockApi(page);
  await reachBreakStep(page);
});

test.describe('E2 — Career Break (US2.2)', () => {
  test('AC 2.2.1 — the step shows a Back to CV button, a duration slider and the activity list', async ({
    page,
  }) => {
    await expect(page.getByRole('button', { name: /back to cv/i })).toBeVisible();
    await expect(slider(page)).toBeVisible();
    await expect(page.getByText('2. What did you do during this time? *')).toBeVisible();
  });

  test('AC 2.2.2 — Back to CV returns to the CV upload page', async ({ page }) => {
    await page.getByRole('button', { name: /back to cv/i }).click();
    await expect(page).toHaveURL(/\/diagnostic\/background$/);
  });

  test('AC 2.2.3 — moving the slider updates the duration shown in years', async ({ page }) => {
    await slider(page).fill('7');
    await expect(page.getByText('7 years', { exact: true })).toBeVisible();

    await slider(page).fill('1');
    await expect(page.getByText('1 year', { exact: true })).toBeVisible();
  });

  test('AC 2.2.4 — activities appear grouped under the four categories', async ({ page }) => {
    for (const category of ACTIVITY_TAXONOMY) {
      await expect(page.getByText(category.label, { exact: true })).toBeVisible();
    }

    const first = ACTIVITY_TAXONOMY[0].activities[0];
    await expect(activity(page, first.label)).toBeVisible();
  });

  test('AC 2.2.5 — selecting an activity highlights it with a green background and white text', async ({
    page,
  }) => {
    const chip = activity(page, 'Childcare');
    const restingBg = await chip.evaluate((node) => getComputedStyle(node).backgroundColor);

    await chip.click();

    await expect(page.getByRole('checkbox', { checked: true })).toHaveCount(1);
    await expect
      .poll(() => chip.evaluate((node) => getComputedStyle(node).color))
      .toBe('rgb(255, 255, 255)'); // white text
    const selectedBg = await chip.evaluate((node) => getComputedStyle(node).backgroundColor);
    expect(selectedBg).not.toBe(restingBg); // filled (green) background
  });

  test('AC 2.2.6 — clicking a selected activity unselects it and restores its appearance', async ({
    page,
  }) => {
    const chip = activity(page, 'Childcare');

    await chip.click();
    await expect(page.getByRole('checkbox', { checked: true })).toHaveCount(1);

    await chip.click();
    await expect(page.getByRole('checkbox', { checked: true })).toHaveCount(0);
    await expect
      .poll(() => chip.evaluate((node) => getComputedStyle(node).color))
      .not.toBe('rgb(255, 255, 255)'); // reverted from the selected (white) text
  });

  test('AC 2.2.7 — Continue to Work Priorities is disabled while no activity is selected', async ({
    page,
  }) => {
    const cta = page.getByRole('button', { name: 'Continue to Work Priorities' });
    await expect(cta).toBeDisabled();

    await slider(page).fill('5');
    await expect(cta).toBeDisabled(); // a duration alone is not enough
  });

  test('AC 2.2.8 — with an activity selected, Continue opens the Work Priorities step @smoke', async ({
    page,
  }) => {
    const cta = page.getByRole('button', { name: 'Continue to Work Priorities' });

    await slider(page).fill('5');
    await activity(page, 'Childcare').click();
    await expect(cta).toBeEnabled();

    await cta.click();
    await expect(page).toHaveURL(/\/diagnostic\/priorities$/);
  });

  test('AC 2.2.9 — a reload restores the duration and the selected activities', async ({
    page,
  }) => {
    await slider(page).fill('9');
    await activity(page, 'Childcare').click();
    await activity(page, 'Running the household').click();

    await page.reload();

    await expect(page.getByText('9 years', { exact: true })).toBeVisible();
    await expect(page.getByRole('checkbox', { checked: true })).toHaveCount(2);
  });

  test('@regression — selecting several activities keeps all of them selected', async ({
    page,
  }) => {
    await activity(page, 'Childcare').click();
    await activity(page, 'Budgeting').click();
    await activity(page, 'Volunteering').click();

    await expect(page.getByRole('checkbox', { checked: true })).toHaveCount(3);
  });

  test('@regression — activities are a fixed set with no free-text entry', async ({ page }) => {
    const count = ACTIVITY_TAXONOMY.reduce((total, c) => total + c.activities.length, 0);

    await expect(page.getByRole('checkbox')).toHaveCount(count);
    await expect(page.getByRole('searchbox')).toHaveCount(0);
    await expect(page.getByRole('textbox')).toHaveCount(0);
  });
});
