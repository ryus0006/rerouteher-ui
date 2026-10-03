import { expect, test } from '@playwright/test';
import { JOURNEY_STAGES } from '../../src/config/journeyStages.js';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test.describe('E1 — Public Landing Page & Guest Entry', () => {
  test('AC 1.1.1 — the "Get started" button is displayed when the landing page loads', async ({
    page,
  }) => {
    await expect(page.getByRole('button', { name: 'Get started' })).toBeVisible();
  });

  test('AC 1.1.2 — the "Get started" button shows an elevated shadow on hover', async ({
    page,
    isMobile,
  }) => {
    test.skip(Boolean(isMobile), 'AC 1.1.2 applies to devices with a mouse or pointer');

    const button = page.getByRole('button', { name: 'Get started' });
    const resting = await button.evaluate((node) => getComputedStyle(node).boxShadow);

    await button.hover();
    await expect
      .poll(() => button.evaluate((node) => getComputedStyle(node).boxShadow))
      .not.toBe(resting);
  });

  test('AC 1.1.3 — "Get started" opens the Background step with no signup or login prompt @smoke', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'Get started' }).click();

    await expect(page).toHaveURL(/\/diagnostic\/background$/);
    await expect(page.getByText(/sign ?up|log ?in|create an account/i)).toHaveCount(0);
  });

  test('AC 1.1.4 — selecting the logo from another page returns to the landing page', async ({
    page,
  }) => {
    await page.goto('/diagnostic/background');
    await page.getByRole('link', { name: /home/i }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test('AC 1.2.1 — the three journey stages render in order', async ({ page }) => {
    const headings = page.getByRole('list').getByRole('heading', { level: 3 });
    await expect(headings).toHaveText(JOURNEY_STAGES.map((stage) => stage.label));
  });

  test('AC 1.2.2 — each journey stage displays its explanation text', async ({ page }) => {
    for (const stage of JOURNEY_STAGES) {
      await expect(page.getByText(stage.blurb, { exact: true })).toBeVisible();
    }
  });

  test('AC 1.2.3 — the tools section shows one tile per tool', async ({ page }) => {
    const tiles = page.getByRole('article').getByRole('heading', { level: 3 });
    await expect(tiles).toHaveCount(4);
  });

  test('AC 1.2.4 — the journey stages stay ordered and readable at this viewport', async ({
    page,
  }) => {
    const headings = page.getByRole('list').getByRole('heading', { level: 3 });
    await expect(headings).toHaveText(JOURNEY_STAGES.map((stage) => stage.label));

    // Untruncated: every stage keeps a real rendered height at this width.
    for (const stage of JOURNEY_STAGES) {
      const blurb = page.getByText(stage.blurb, { exact: true });
      await expect(blurb).toBeVisible();

      const box = await blurb.boundingBox();
      expect(box.height).toBeGreaterThan(0);
      expect(box.width).toBeLessThanOrEqual(page.viewportSize().width);
    }
  });

  test('a11y — the "Get started" button is keyboard operable: focus ring, Enter and Space @a11y', async ({
    page,
  }) => {
    const button = page.getByRole('button', { name: 'Get started' });

    await button.focus();
    await expect(button).toBeFocused();

    const outlineWidth = await button.evaluate((node) => getComputedStyle(node).outlineWidth);
    expect(parseFloat(outlineWidth)).toBeGreaterThan(0);

    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/diagnostic\/background$/);

    await page.goBack();
    await page.getByRole('button', { name: 'Get started' }).focus();
    await page.keyboard.press('Space');
    await expect(page).toHaveURL(/\/diagnostic\/background$/);
  });
});
