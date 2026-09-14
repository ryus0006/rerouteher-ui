# Full-stack e2e (E5 accounts)

Runs the real UI against the real FastAPI backend and a fresh Postgres.

1. Backend + DB (from rerouteher-system): db + API both in Docker (deps live in the
   image; nothing installed on your host), with auto-selected ports (default, else +1):

   ./scripts/local-start.sh

   (Fast host-uvicorn alternative with hot-reload, uses your host Python:
    ./scripts/local-start.sh --local)

   It prints the chosen ports, e.g.:

     DB:  localhost:5433 (database rerouteher)
     API: http://localhost:8081
     VITE_API_BASE_URL=http://localhost:8081

   Copy that VITE_API_BASE_URL for step 2. (First run of a fresh DB volume also runs
   the reference import + pgvector migration + account_store. If a stale volume lacks
   account_store, reset it first: ./scripts/local-stop.sh)

2. Frontend + tests (from rerouteher-ui), using the API URL printed above:

   E2E_FULLSTACK=1 VITE_API_BASE_URL=http://localhost:8081 npx playwright test tests/e2e/e5-account.spec.js --project=chromium

Notes:
- The account spec uses a unique username per run, so the persistent DB does not collide.
- Without E2E_FULLSTACK the suite runs mock-backed against `npm run preview`, as before.
- CORS: the backend allows http://localhost:5173 by default; the API port can differ (8080/8081) without affecting CORS, which keys off the frontend origin, not the API port.
- Stop: Ctrl-C the uvicorn (API), then ./scripts/local-stop.sh (add nothing to reset the DB, or --keep-data to preserve it).
