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
      (process.env.E2E_FULLSTACK ? 'http://localhost:5173' : 'http://localhost:4173'),
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
  // the real UI (mocks off) runs against the real API; the API + DB are brought up
  // separately (see tests/e2e/helpers/fullstack-README.md).
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : process.env.E2E_FULLSTACK
      ? {
          // Must NOT reuse a plain `npm run dev` (VITE_USE_MOCKS=1) already on 5173, or
          // the tests hit MSW mocks instead of the real API. Always start dev:live
          // (mocks off); it reads VITE_API_BASE_URL from .env.development (or .env.local).
          command: 'npm run dev:live',
          url: 'http://localhost:5173',
          reuseExistingServer: false,
        }
      : {
          command: 'npm run preview',
          port: 4173,
          reuseExistingServer: true,
        },
});
