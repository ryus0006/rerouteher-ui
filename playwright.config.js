import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: true,
  retries: 1,
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['junit', { outputFile: 'results/junit.xml' }],
    ['list'],
  ],
  use: {
    baseURL:
      process.env.E2E_BASE_URL ??
      (process.env.E2E_FULLSTACK ? 'http://localhost:5174' : 'http://localhost:4174'),
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
  // WebKit ships a frozen build that crashes on some macOS versions, so the Safari
  // projects are opt-in. Set PLAYWRIGHT_WEBKIT=1 (e.g. on CI/Linux) to include them.
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
    ...(process.env.PLAYWRIGHT_WEBKIT === '1'
      ? [
          { name: 'webkit', use: { ...devices['Desktop Safari'] } },
          { name: 'mobile-safari', use: { ...devices['iPhone 13'] } },
        ]
      : []),
  ],
  // Skipped when E2E_BASE_URL points at a deployed environment. With E2E_FULLSTACK
  // the real UI runs against the real API; the API + DB are brought up separately
  // (see tests/e2e/helpers/fullstack-README.md).
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : process.env.E2E_FULLSTACK
      ? {
          // `npm run dev` talks to the real API (VITE_API_BASE_URL from
          // .env.development / .env.local); the API + DB are brought up separately
          // (see tests/e2e/helpers/fullstack-README.md).
          command: 'npm run dev',
          url: 'http://localhost:5174',
          reuseExistingServer: false,
        }
      : {
          command: 'npm run preview',
          port: 4174,
          reuseExistingServer: true,
        },
});
