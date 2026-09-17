import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Iteration 2 uses 5174 (iteration 1 keeps 5173) so both UIs can run at once.
    port: 5174,
    // Mirrors production, where nginx proxies /api/ to the backend service.
    // Same-origin /api in dev too, so no CORS and the same relative URLs work everywhere.
    // The path is not rewritten, so /api/... reaches the backend's /api/... endpoints.
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET || 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: { port: 4174 },
  test: {
    environment: 'jsdom',
    // jsdom needs a real origin before it will expose localStorage.
    environmentOptions: { jsdom: { url: 'http://localhost:4174/' } },
    globals: true,
    setupFiles: './tests/setup.js',
    include: ['tests/unit/**/*.test.{js,jsx}'],
    coverage: {
      provider: 'v8',
      reportsDirectory: 'results/coverage',
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/main.jsx', 'src/mocks/**'],
    },
  },
});
