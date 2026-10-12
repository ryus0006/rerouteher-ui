import { expect, test } from '@playwright/test';

// Full-stack only: needs the real API + DB (see helpers/fullstack-README.md).
test.skip(!process.env.E2E_FULLSTACK, 'full-stack account e2e (set E2E_FULLSTACK=1)');

const password = 'password1';

/** Opens the account sheet from the header and switches it to create mode. */
async function openCreateSheet(page) {
  await page.getByRole('button', { name: 'Sign in' }).first().click();
  const sheet = page.getByRole('dialog');
  await sheet.getByRole('button', { name: 'Create one' }).click();
  return sheet;
}

test('create account, persist session across reload, sign out, sign back in', async ({ page }) => {
  const username = `user_${Date.now()}`;

  await page.goto('/');

  const sheet = await openCreateSheet(page);
  await sheet.getByLabel('Username').fill(username);
  await sheet.getByLabel('Password', { exact: true }).fill(password);
  await sheet.getByRole('button', { name: 'Create account and continue' }).click();

  // Signed in: the Sign out button appears.
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();

  // Session survives a reload in the same tab.
  await page.reload();
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();

  // Sign out returns to guest.
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();

  // Sign back in with the same credentials.
  await page.getByRole('button', { name: 'Sign in' }).first().click();
  const signInSheet = page.getByRole('dialog');
  await signInSheet.getByLabel('Username').fill(username);
  await signInSheet.getByLabel('Password', { exact: true }).fill(password);
  await signInSheet.getByRole('button', { name: 'Sign in' }).click();

  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();
});

test('wrong password shows a generic error and does not sign in (AC 5.3.4)', async ({ page }) => {
  const username = `user_${Date.now()}_b`;

  await page.goto('/');

  const sheet = await openCreateSheet(page);
  await sheet.getByLabel('Username').fill(username);
  await sheet.getByLabel('Password', { exact: true }).fill(password);
  await sheet.getByRole('button', { name: 'Create account and continue' }).click();
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();
  await page.getByRole('button', { name: 'Sign out' }).click();

  await page.getByRole('button', { name: 'Sign in' }).first().click();
  const signInSheet = page.getByRole('dialog');
  await signInSheet.getByLabel('Username').fill(username);
  await signInSheet.getByLabel('Password', { exact: true }).fill('wrong-password');
  await signInSheet.getByRole('button', { name: 'Sign in' }).click();

  await expect(signInSheet.getByText(/wrong username or password/i)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign out' })).toHaveCount(0);
});
