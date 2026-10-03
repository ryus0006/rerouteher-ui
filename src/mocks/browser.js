import { setupWorker } from 'msw/browser';
import { handlers } from './handlers.js';

// Started only when VITE_USE_MOCKS=1 (`npm run dev:mock`).
export const worker = setupWorker(...handlers);

export const startMockWorker = () =>
  worker.start({
    serviceWorker: {
      // Resolve the worker script against Vite's base path so it stays in scope
      // when the app is served under a sub-path.
      url: `${import.meta.env.BASE_URL}mockServiceWorker.js`,
    },
    onUnhandledRequest: 'bypass',
  });
