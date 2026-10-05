import { expect, test } from '@playwright/test';
import { mockApi } from './helpers/mockApi.js';

const VALID_CV = 'tests/fixtures/cv/valid-cv.pdf';

test('@journey — a guest goes from landing to readiness without signing up @smoke', async ({
  page,
}) => {
  await mockApi(page);

  await page.goto('/');
  await page.getByRole('button', { name: 'Get started' }).click();

  await page.locator('input[type="file"]').setInputFiles(VALID_CV);
  await expect(page.getByText('Verified')).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();

  await page.getByRole('slider').fill('6');
  await page.getByText('Childcare', { exact: true }).click();
  await page.getByText('Budgeting', { exact: true }).click();
  await page.getByRole('button', { name: 'Continue to Work Priorities' }).click();

  await page.getByText('Flexible Work').click();
  await page.getByRole('button', { name: 'Continue to Skill Snapshot' }).click();

  await expect(page.getByText(/based on your CV as a/i)).toBeVisible();

  await page.getByRole('button', { name: 'See my readiness & gaps' }).click();
  await expect(page.getByText('requirements you already have')).toBeVisible();

  // No sign-up or sign-in prompt appears during the guest journey.
  await expect(page.getByText(/sign ?up|log ?in|create an account/i)).toHaveCount(0);
});
