import { readFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const baseURL = process.env.CAPTURE_BASE_URL ?? 'http://127.0.0.1:5173';
const output =
  'output/iteration-2-prototype-high-res/04-employer-fit-finder-3840x2160.png';
const resultsOutput =
  'output/iteration-2-prototype-high-res/05-employer-fit-results-3840x2160.png';

const [snapshot, gapResult] = await Promise.all([
  readFile('src/mocks/fixtures/snapshot.high-confidence.json', 'utf8').then(JSON.parse),
  readFile('src/mocks/fixtures/gap.default.json', 'utf8').then(JSON.parse),
]);

const priorities = ['flexible_work', 'childcare_support'];
const state = {
  cv: { fileName: 'Sarah-Tan-CV.pdf', fileSize: 184320 },
  cvParsed: true,
  break: { duration_years: 3, activities: ['care_household.cared_for_children'] },
  preferences: {},
  employerPriorities: priorities,
  snapshot,
  selectedRole: snapshot.recommended_roles[0],
  gapResult,
  currentStepIndex: 4,
  previousPlan: null,
};

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 2,
  colorScheme: 'light',
});

await context.addInitScript(({ state: storedState }) => {
  window.sessionStorage.setItem(
    'rerouteher.guestSession',
    JSON.stringify({ state: storedState, version: 2 })
  );
}, { state });

const page = await context.newPage();
await page.goto(`${baseURL}/plan/employers`, { waitUntil: 'networkidle' });
await page.getByRole('heading', { name: 'Find employers that support your return' }).waitFor();
await page.getByRole('button', { name: /Find employers/ }).waitFor();
await page.screenshot({ path: output, animations: 'disabled' });

await page.goto(`${baseURL}/plan/employers/matches`, { waitUntil: 'networkidle' });
await page.getByRole('heading', { name: 'Your employer matches' }).waitFor();
await page.getByRole('heading', { name: 'Maybank' }).waitFor();
await page.screenshot({ path: resultsOutput, animations: 'disabled' });

await browser.close();
console.log(output);
console.log(resultsOutput);
