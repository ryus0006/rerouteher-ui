import { setupWorker } from 'msw/browser';
import { handlers } from './handlers.js';

// Only started by `npm run dev:mock` (VITE_USE_MOCKS=1), never by the default
// `npm run dev`, which always talks to the real backend.
export const worker = setupWorker(...handlers);

export const startMockWorker = () =>
  worker.start({
    serviceWorker: {
      // Use Vite's base so the worker remains in scope on GitHub Pages, where
      // the app lives below `/rerouteher-ui/` rather than at the domain root.
      url: `${import.meta.env.BASE_URL}mockServiceWorker.js`,
    },
    onUnhandledRequest: 'bypass',
  });
