import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
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
  preview: { port: 4173 },
  test: {
    environment: 'jsdom',
    // jsdom needs a real origin before it will expose localStorage.
    environmentOptions: { jsdom: { url: 'http://localhost:4173/' } },
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
