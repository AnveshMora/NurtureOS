# Test Patterns — NurtureOS

> Auto-generated. **There are currently no automated tests in this repository.**

## Current state

- No `vitest.config.*`, `jest.config.*`, `playwright.config.*`, `karma.conf.*`.
- No `*.test.*` / `*.spec.*` files anywhere outside `node_modules/`.
- `package.json` (frontend) has no `test` script. `backend/package.json` has no `test` script.
- Verification today is manual: `npm run lint`, `npm run build` (which runs `tsc -b`), `cd backend && npm run typecheck`, plus exercising the UI via `npm run dev` or `npm start`.

## Recommended stack (when tests are added)

The repo is React 19 + Vite + TypeScript + Express + tsx. The natural fit is:

| Concern | Tool | Why |
|---------|------|-----|
| Frontend unit / store tests | **Vitest** + `@testing-library/react` + `jsdom` | Native to Vite, ESM-friendly, no separate transform pipeline. |
| Backend unit / route tests | **Vitest** + `supertest` | Same toolchain as frontend; supertest exercises the Express app object directly without listening on a port. |
| End-to-end | **Playwright** | Browser automation for the planning flows; ngrok-aware. |

Until the team adopts a framework, document tests as steps in the relevant PR description and follow the manual verification checklist below.

## Manual verification checklist

Run these whenever a change touches sync, persistence, or routing:

1. `npm run lint` — must be clean.
2. `npm run build` — must succeed (this also type-checks).
3. `cd backend && npm run typecheck` — must succeed.
4. `npm start` — bring up frontend (4173) + backend (3001).
5. Open the app, complete onboarding if needed, add/modify an entity, **reload the page** — confirm Zustand persist restored it.
6. Open a second browser/profile pointed at the same `VITE_SYNC_URL`, edit something on each side within ~30 s, confirm both converge after the next sync (visibility change or interval).
7. Stop the backend, edit on the client — app must keep working (sync silently fails with a `console.warn`).

## Conventions to honor when tests are added

- **One test framework only.** Do not introduce Jest alongside Vitest.
- **Test files** colocated as `Foo.test.ts` / `Foo.test.tsx` next to the source, OR under `src/__tests__/` — pick one and apply uniformly.
- **No mocking the merge file.** The sync route's correctness depends on `withLock` semantics; either run against a real temp file (preferred) or against an in-memory `fs` adapter — never stub `mergeArrays` in isolation.
- **Stable timestamps.** Tests that rely on `updatedAt` must inject `new Date(...).toISOString()` deterministically (e.g. via `vi.useFakeTimers()` / `vi.setSystemTime(...)`) — the merge tiebreak depends on string comparison.
- **Persisted store reset.** Zustand `persist` reads from `localStorage` on creation. Either run with a fresh `jsdom` per test (Vitest default) or call `useFooStore.persist.clearStorage()` in `beforeEach`.
- **No real network in unit tests.** Use `supertest(app)` against the Express app, not `fetch('http://localhost:3001/...')`.
- **Type-check tests** are part of `tsc -b` once a `tsconfig.test.json` exists. Add it to `tsconfig.json` references when introducing tests.

## Annotation patterns

There are no team-specific test annotations or base classes today. When tests land, this section will document them.
