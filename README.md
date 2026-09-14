# ReRouteHer — UI

React frontend for **ReRouteHer**, a career re-entry platform helping Malaysian mothers returning to
work after a career break turn their experience into modern, AI-era workforce readiness.

Iteration 1 scope: a guest can go from career context to a skill snapshot and a two-band skill gap
without creating an account (Epics E1–E4).

## Stack

React 19 · Vite · Tailwind CSS 4 · React Router · Zustand · MSW · Vitest · Playwright

## Getting started

```bash
npm install
npm run dev          # http://localhost:5173, calls the real API at VITE_API_BASE_URL
```

The backend is a separate FastAPI service; start it first (see
`../rerouteher-system`, `scripts/local-start.sh`). `npm run dev` always talks to the
real API — there is no in-browser mock mode. MSW is used only for unit tests
(`tests/setup.js` -> `src/mocks/server.js`).

| Variable             | Purpose                                                         |
| -------------------- | --------------------------------------------------------------- |
| `VITE_API_BASE_URL`  | Base URL of the API. Empty means same-origin.                     |

## Testing

```bash
npm run lint
npm run test:unit    # Vitest + Testing Library
npm run test:e2e     # Playwright, 5 browser projects
npm run gate         # all of the above + build, then writes an acceptance record
```

`npm run gate` is the promotion gate: it must exit 0 before a build is deployed. It writes
`docs/test-runs/<date>-<sha>.md`, one row per acceptance criterion, which is the sign-off record for
UAT and production.

Point the suite at a deployed environment instead of a local build:

```bash
E2E_BASE_URL=https://uat.example E2E_MOCK=0 npx playwright test --grep @smoke
```

## Build and deploy

```bash
npm run build        # -> dist/
docker build --build-arg VITE_API_BASE_URL=https://api.uat.example -t rerouteher-ui:uat .
```

`VITE_API_BASE_URL` is inlined at build time, so each environment gets its own image.
`nginx.conf` serves `index.html` for unknown paths so client-side routes survive a direct hit.

## Layout

```
src/
  api/           fetch wrappers for the three diagnostic endpoints
  components/    ui primitives, layout, and per-epic components
  config/        journey stages and the career-break activity taxonomy
  mocks/         MSW handlers and the API fixtures they serve
  routes/        one component per screen
  store/         Zustand guest session, persisted to local storage
tests/
  unit/          Vitest specs
  e2e/           Playwright specs, one per epic
scripts/         asset conversion and acceptance-record generation
_prototype/      archived pre-React prototype; delete once this app ships
```

## License

MIT — see [LICENSE](LICENSE).
