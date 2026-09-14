import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { routes } from './routes.jsx';
import { startPlanSync } from './store/planSync.js';
import './index.css';

async function start() {
  // Opt-in only: `npm run dev:mock` sets VITE_USE_MOCKS=1 to serve the app from
  // src/mocks (no backend needed). Default `npm run dev` leaves it unset and hits
  // the real API.
  if (import.meta.env.VITE_USE_MOCKS === '1') {
    const { worker } = await import('./mocks/browser.js');
    await worker.start({ onUnhandledRequest: 'bypass' });
  }

  startPlanSync();

  const router = createBrowserRouter(routes);

  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>
  );
}

start();
