import { expect, test } from '@playwright/test';
import { mockApi } from './helpers/mockApi.js';

const VALID_CV = 'tests/fixtures/cv/valid-cv.pdf';

/** The chip list of a skill section, located from its heading (robust across layouts). */
const sectionList = (page, name) =>
  page.getByRole('heading', { name }).locator('xpath=../following-sibling::ul');

/** Walks the intake so the snapshot is generated the way a guest generates it. */
async function reachSnapshot(page) {
  await page.goto('/diagnostic/background');
  await page.locator('input[type="file"]').setInputFiles(VALID_CV);
  await page.getByRole('button', { name: 'Continue' }).click();

  await page.getByRole('slider').fill('5');
  await page.getByText('Childcare', { exact: true }).click();
  await page.getByRole('button', { name: 'Continue to Work Priorities' }).click();

  await page.getByText('Flexible Work').click();
  await page.getByRole('button', { name: 'Continue to Skill Snapshot' }).click();
  await expect(page).toHaveURL(/\/diagnostic\/snapshot$/);
}

test.describe('E3 — Skill Snapshot & Career Reframing', () => {
  test('AC 3.1.1 — the stepper shows the three steps before Skill Snapshot completed and Skill Snapshot current', async ({
    page,
  }) => {
    await mockApi(page);
    await reachSnapshot(page);

    await expect(page.locator('[data-state="complete"]')).toHaveCount(3);
    await expect(page.locator('[data-state="current"]')).toHaveCount(1);
    await expect(page.locator('[data-state="current"]')).toContainText('Skill Snapshot');
  });

  test('AC 3.1.2 — professional and break-reframed skills sit in separate sections @smoke', async ({
    page,
  }) => {
    await mockApi(page);
    await reachSnapshot(page);

    await expect(page.getByRole('heading', { name: 'From your CV' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'From your career break' })).toBeVisible();
  });

  test('AC 3.1.3 — a long CV skill list expands with Show all and collapses with Show fewer', async ({
    page,
  }) => {
    await mockApi(page, { snapshot: 'snapshot.many-cv-skills' });
    await reachSnapshot(page);

    const cv = sectionList(page, 'From your CV');
    const collapsed = await cv.getByRole('listitem').count();

    await page.getByRole('button', { name: /show all/i }).click();
    const expanded = await cv.getByRole('listitem').count();
    expect(expanded).toBeGreaterThan(collapsed);

    await page.getByRole('button', { name: /show fewer/i }).click();
    await expect(page.getByRole('button', { name: /show all/i })).toBeVisible();
  });

  test('AC 3.1.4 — stepping back reopens the career break with its answers intact', async ({
    page,
  }) => {
    await mockApi(page);
    await reachSnapshot(page);

    await page.getByRole('button', { name: 'Back to Work Priorities' }).click();
    await page.getByRole('button', { name: 'Back to career break' }).click();
    await expect(page).toHaveURL(/\/diagnostic\/break$/);
    await expect(page.getByRole('checkbox', { checked: true })).toHaveCount(1);

    await page.getByRole('button', { name: 'Continue to Work Priorities' }).click();
    await page.getByRole('button', { name: 'Continue to Skill Snapshot' }).click();
    await expect(page.getByRole('heading', { name: 'Your skill snapshot' })).toBeVisible();
  });

  test('AC 3.1.5 — returning to the snapshot restores it without regenerating', async ({
    page,
  }) => {
    await mockApi(page);
    await reachSnapshot(page);

    let regenerated = false;
    await page.route('**/api/snapshot/generate', (route) => {
      regenerated = true;
      return route.abort();
    });

    await page.reload();

    await expect(page.getByRole('heading', { name: 'From your CV' })).toBeVisible();
    expect(regenerated).toBe(false);
  });

  test('AC 3.2.1 — a matched CV skill is shown under "From your CV" with its recognised name', async ({
    page,
  }) => {
    await mockApi(page);
    await reachSnapshot(page);

    await expect(sectionList(page, 'From your CV')).toContainText(
      'User Research & Persona Synthesis'
    );
  });

  // Backend behaviour (dedupe by skill_id) verified in the rerouteher-system test suite;
  // not observable through the UI without a purpose-built duplicate fixture.
  test.fixme('AC 3.2.2 — a professional skill repeated in the CV appears only once', async () => {});

  test('AC 3.2.3 — a CV with no supported match shows an empty state, not invented skills', async ({
    page,
  }) => {
    await mockApi(page, { snapshot: 'snapshot.empty-professional' });
    await reachSnapshot(page);

    await expect(page.getByText(/No professional skills matched/i)).toBeVisible();
    await expect(sectionList(page, 'From your CV').getByRole('listitem')).toHaveCount(0);
  });

  test('AC 3.3.1 — a reframed break skill is shown under "From your career break"', async ({
    page,
  }) => {
    await mockApi(page);
    await reachSnapshot(page);

    await expect(sectionList(page, 'From your career break')).toContainText('Active Listening');
  });

  test('AC 3.3.2 — each reframed skill names the activity it came from', async ({ page }) => {
    await mockApi(page);
    await reachSnapshot(page);

    await expect(page.locator('li[title="from Childcare"]').first()).toBeVisible();
  });

  // Backend behaviour verified in the rerouteher-system test suite; not observable via the UI.
  test.fixme('AC 3.3.3 — a skill mapped from two activities appears only once', async () => {});
  test.fixme('AC 3.3.4 — an activity with no mapping produces no skill', async () => {});

  test('AC 3.4.1 — the occupation is shown in the "based on your CV as a …" sentence', async ({
    page,
  }) => {
    await mockApi(page);
    await reachSnapshot(page);

    await expect(page.getByText(/based on your CV as a/i)).toContainText('Senior UX/UI Designer');
  });

  test('AC 3.4.2 — an unmatchable profile shows the no-match state, not a random role', async ({
    page,
  }) => {
    await mockApi(page, { snapshot: 'snapshot.no-match' });
    await reachSnapshot(page);

    await expect(page.getByText('No suitable match found')).toBeVisible();
    await expect(page.getByText('Exploratory match')).toHaveCount(0);
  });

  test('AC 3.4.3 — "See my readiness & gaps" opens E4 with the closest occupation selected', async ({
    page,
  }) => {
    await mockApi(page);
    await reachSnapshot(page);

    await page.getByRole('button', { name: 'See my readiness & gaps' }).click();

    await expect(page).toHaveURL(/\/diagnostic\/gap$/);
    await expect(page.getByRole('heading', { name: 'Senior UX/UI Designer' })).toBeVisible();
  });

  test('@regression — a professional skill shows the evidence behind it', async ({ page }) => {
    await mockApi(page);
    await reachSnapshot(page);

    await expect(
      page.locator('li[title="Ran usability testing at Wira Digital"]').first()
    ).toBeVisible();
  });

  test('@regression — the reframed section explains where those skills come from', async ({
    page,
  }) => {
    await mockApi(page);
    await reachSnapshot(page);

    await expect(
      page.getByText(/come from the activities you did during your career break/i)
    ).toBeVisible();
  });

  test('@regression — a confident occupation match is stated plainly, with no caveat badge', async ({
    page,
  }) => {
    await mockApi(page);
    await reachSnapshot(page);

    await expect(page.getByText('Senior UX/UI Designer').first()).toBeVisible();
    await expect(page.getByText('Exploratory match')).toHaveCount(0);
    await expect(page.getByText(/starting point rather than a verdict/i)).toHaveCount(0);
  });

  test('@regression — confidence below 70% shows "Exploratory match" with guidance', async ({
    page,
  }) => {
    await mockApi(page, { snapshot: 'snapshot.low-confidence' });
    await reachSnapshot(page);

    await expect(page.getByText('Exploratory match')).toBeVisible();
    await expect(page.getByText(/starting point rather than a verdict/i)).toBeVisible();
  });
});
