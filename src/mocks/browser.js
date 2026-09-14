import { setupWorker } from 'msw/browser';
import { handlers } from './handlers.js';

// Only started by `npm run dev:mock` (VITE_USE_MOCKS=1), never by the default
// `npm run dev`, which always talks to the real backend.
export const worker = setupWorker(...handlers);
