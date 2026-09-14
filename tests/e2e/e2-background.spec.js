import { expect, test } from '@playwright/test';
import { mockApi } from './helpers/mockApi.js';

const VALID_CV = 'tests/fixtures/cv/valid-cv.pdf';
const NOT_A_PDF = 'tests/fixtures/cv/not-a-cv.png';
const OVERSIZED_CV = 'tests/fixtures/cv/oversized-cv.pdf';

const dropzone = (page) => page.locator('input[type="file"]');
const continueButton = (page) => page.getByRole('button', { name: 'Continue' });

test.beforeEach(async ({ page }) => {
  await mockApi(page);
  await page.goto('/diagnostic/background');
});

test.describe('E2 — Career Background (US2.1)', () => {
  test('AC 2.1.1 — the upload area shows the drag/browse copy and the PDF up-to-10-MB note', async ({
    page,
  }) => {
    await expect(page.getByText('Drag a file, or click to browse')).toBeVisible();
    await expect(page.getByText('PDF, up to 10 MB')).toBeVisible();
  });

  test('AC 2.1.2 — the file picker is restricted to PDF files', async ({ page }) => {
    await expect(dropzone(page)).toHaveAttribute('accept', /pdf/);
  });

  test('AC 2.1.3 — a valid PDF of 10 MB or less is accepted for processing', async ({ page }) => {
    await dropzone(page).setInputFiles(VALID_CV);

    // Accepted: no rejection, and the CV reaches the verified state.
    await expect(page.getByText('Verified')).toBeVisible();
  });

  test('AC 2.1.4 — a non-PDF is rejected with a clear message before upload', async ({ page }) => {
    let uploadAttempted = false;
    await page.route('**/api/cv/parse', (route) => {
      uploadAttempted = true;
      return route.abort();
    });

    await dropzone(page).setInputFiles(NOT_A_PDF);

    await expect(page.getByRole('alert')).toContainText(/not a PDF/i);
    expect(uploadAttempted).toBe(false);
  });

  test('AC 2.1.5 — a PDF over 10 MB is rejected and the upload area stays available', async ({
    page,
  }) => {
    let uploadAttempted = false;
    await page.route('**/api/cv/parse', (route) => {
      uploadAttempted = true;
      return route.abort();
    });

    await dropzone(page).setInputFiles(OVERSIZED_CV);

    await expect(page.getByRole('alert')).toContainText(/exceeds 10 MB/i);
    await expect(page.getByText('Drag a file, or click to browse')).toBeVisible();
    expect(uploadAttempted).toBe(false);
  });

  test('AC 2.1.6 — while the CV is processing, the controls are disabled and "Reading your CV" is shown', async ({
    page,
  }) => {
    // Hold the parse response open so the processing state is observable.
    let release;
    await page.route('**/api/cv/parse', async (route) => {
      await new Promise((resolve) => {
        release = resolve;
      });
      route.fulfill({
        status: 200,
        json: { cv: { raw_text: '', experiences: [], skill_mentions: [] } },
      });
    });

    await dropzone(page).setInputFiles(VALID_CV);

    await expect(page.getByText('Reading your CV')).toBeVisible();
    await expect(continueButton(page)).toBeDisabled();

    release();
  });

  test('AC 2.1.7 — a processed CV shows the file name, size, Verified status and Remove', async ({
    page,
  }) => {
    await dropzone(page).setInputFiles(VALID_CV);

    await expect(page.getByText('valid-cv.pdf')).toBeVisible();
    await expect(page.getByText(/\d[\d.]* (B|KB|MB) · Verified/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Remove' })).toBeVisible();
  });

  test('AC 2.1.8 — Remove clears the CV, restores the upload area and blocks Continue', async ({
    page,
  }) => {
    await dropzone(page).setInputFiles(VALID_CV);
    await expect(page.getByText('valid-cv.pdf')).toBeVisible();

    await page.getByRole('button', { name: 'Remove' }).click();
    await expect(page.getByText('Drag a file, or click to browse')).toBeVisible();

    await continueButton(page).click();
    await expect(page.getByRole('alert')).toContainText(/CV is required/i);
    await expect(page).toHaveURL(/\/diagnostic\/background$/);
  });

  test('AC 2.1.9 — continuing without a valid CV is blocked and explains why', async ({ page }) => {
    await continueButton(page).click();

    await expect(page.getByRole('alert')).toContainText(/CV is required/i);
    await expect(page).toHaveURL(/\/diagnostic\/background$/);
  });

  test('AC 2.1.10 — with a verified CV, Continue opens the Career Break step @smoke', async ({
    page,
  }) => {
    await dropzone(page).setInputFiles(VALID_CV);
    await expect(page.getByText('Verified')).toBeVisible();

    await continueButton(page).click();
    await expect(page).toHaveURL(/\/diagnostic\/break$/);
  });

  test('AC 2.1.11 — a reload restores the uploaded CV and keeps Continue enabled', async ({
    page,
  }) => {
    await dropzone(page).setInputFiles(VALID_CV);
    await expect(page.getByText('Verified')).toBeVisible();

    await page.reload();

    await expect(page.getByText('valid-cv.pdf')).toBeVisible();
    await expect(page.getByText('Verified')).toBeVisible();

    await continueButton(page).click();
    await expect(page).toHaveURL(/\/diagnostic\/break$/);
  });

  test('AC 2.1.12 — a server-rejected CV shows the reason and leaves the upload area available', async ({
    page,
  }) => {
    await page.route('**/api/cv/parse', (route) =>
      route.fulfill({ status: 400, json: { error: 'unreadable' } })
    );

    await dropzone(page).setInputFiles(VALID_CV);
    await expect(page.getByRole('alert')).toContainText('unreadable');
    await expect(page.getByText('Drag a file, or click to browse')).toBeVisible();

    await mockApi(page);
    await dropzone(page).setInputFiles(VALID_CV);
    await expect(page.getByText('valid-cv.pdf')).toBeVisible();
  });

  test('@regression — the intake stepper marks the current and upcoming steps', async ({
    page,
  }) => {
    await expect(page.locator('[data-state="current"]')).toHaveCount(1);
    await expect(page.locator('[data-state="upcoming"]')).toHaveCount(4);
  });
});
