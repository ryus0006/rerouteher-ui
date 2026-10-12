import { setupWorker } from 'msw/browser';
import { employerMatchHandler, handlers } from './handlers.js';
import employersDefault from './fixtures/employers.default.json';
import { sampleEmployers } from './sampleEmployers.js';

// Started only when VITE_USE_MOCKS=1 (`npm run dev:mock`). Employer matching
// uses a larger pool than the tests, so the matches page has more than one page
// of results. Handlers listed first take precedence.
export const worker = setupWorker(
  employerMatchHandler([...employersDefault.employers, ...sampleEmployers]),
  ...handlers
);

export const startMockWorker = () =>
  worker.start({
    serviceWorker: {
      // Resolve the worker script against Vite's base path so it stays in scope
      // when the app is served under a sub-path.
      url: `${import.meta.env.BASE_URL}mockServiceWorker.js`,
    },
    onUnhandledRequest: 'bypass',
  });
