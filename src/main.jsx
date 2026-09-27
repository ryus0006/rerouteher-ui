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
    const { startMockWorker } = await import('./mocks/browser.js');
    await startMockWorker();
  }

  startPlanSync();

  // Vite uses `/` locally and on Netlify, while a GitHub Pages preview is
  // served below the repository name. Keeping the router in Vite's base path
  // lets the same build navigate correctly in either hosting environment.
  const router = createBrowserRouter(routes, { basename: import.meta.env.BASE_URL });

  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>
  );
}

start();
