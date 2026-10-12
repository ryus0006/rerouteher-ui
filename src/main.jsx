import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { routes } from './routes.jsx';
import { startPlanSync } from './store/planSync.js';
import './index.css';

async function start() {
  // Mock Service Worker is enabled only when VITE_USE_MOCKS=1 (`npm run dev:mock`);
  // otherwise requests go to the real API.
  if (import.meta.env.VITE_USE_MOCKS === '1') {
    const { startMockWorker } = await import('./mocks/browser.js');
    await startMockWorker();
  }

  startPlanSync();

  // Use Vite's base path so routing works both at the domain root and under a
  // sub-path (e.g. GitHub Pages).
  const router = createBrowserRouter(routes, { basename: import.meta.env.BASE_URL });

  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>
  );
}

start();
