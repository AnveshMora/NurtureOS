# NurtureOS — AI Assistant Instructions

NurtureOS is a Montessori home-execution system for parents of children ages 2–6. It is a small monorepo: a React 19 + Vite PWA at the repo root, an Express 5 sync backend in `backend/`. State lives in the browser (Zustand + localStorage) and is synced through a single `POST /api/sync/merge` endpoint backed by one JSON file.

## Where to look first

- `.github/ai-sdlc-config.yml` — build commands, conventions, knowledge file index.
- `.github/knowledge/` — domain knowledge (start here when planning any change):
  - `build-system.md` — workspaces, scripts, tsconfig, env vars.
  - `architecture.md` — frontend layers, sync flow, mutex pattern, "when adding new code" checklist.
  - `domain-model.md` — entities, relationships, the `updatedAt` merge contract, equality traps.
  - `infrastructure-checklists.md` — first-time setup checklists for adding stores, routes, HTTP calls, PWA changes.
  - `test-patterns.md` — current state (no tests yet) and conventions for when tests are added.
  - `lessons-learned.md` — append-only log; promote mature entries into the topical files above.
- `.github/git-commit-instructions.md` — commit and branch conventions (Conventional Commits, no ticket prefix).
- `.github/copilot-instructions.md` — legacy guidance carried over from FocusFlow. Several "Hard Bugs" rules (sync mutex, `skipNextSubRef` predecessor, dev SW disabled) still apply to NurtureOS — read it before touching sync, the service worker, or background timing.

## Quick reference

| Action | Command |
|--------|---------|
| Frontend dev server (LAN-exposed) | `npm run dev` |
| Frontend build (with type-check) | `npm run build` |
| Frontend lint | `npm run lint` |
| Backend dev (watch) | `cd backend && npm run dev` |
| Backend type-check | `cd backend && npm run typecheck` |
| Full local prod (frontend preview + backend) | `npm start` |

## Architecture in one paragraph

Pages (`src/pages/`) call hooks (`src/hooks/`) that read from Zustand stores (`src/store/`). Each store is `persist`-ed to a `nurtureos-*` localStorage key and stamps `updatedAt` on every mutator. `useSync` (`src/hooks/useSync.ts`) POSTs the full client snapshot to the backend on mount, every 30 s, and on visibility change — **never via a store subscription**, which previously caused infinite loops. The backend (`backend/src/routes/sync.ts`) merges arrays by `id` with timestamp tiebreak, all under a process-wide mutex (`withLock`). Storage is a single JSON file at `backend/data/sync-state.json`.

## Hard rules (don't break these)

1. **Every persisted entity has `updatedAt`.** Mutators stamp it. Sync merge depends on it lexicographically.
2. **Every read-modify-write of `sync-state.json` runs inside `withLock(...)`.** Anything else races and loses data.
3. **Sync is driven by `useEffect` + interval/visibility, never by store subscriptions.** This is what commit `f5daf01` enforced; reintroducing subscriptions is the path to 16k requests in 9 minutes.
4. **Service worker is registered only on non-localhost origins.** Localhost auto-unregisters. Do not enable `vite-plugin-pwa` `devOptions`.
5. **Adding a new synced entity touches six places in two files.** See `infrastructure-checklists.md` "First Persisted Zustand Store" — missing any one of them is the bug from commit `42b32a2`.

## Conventions

- TypeScript everywhere. `import type { ... }` for type-only imports.
- Components: PascalCase files (`DashboardPage.tsx`). Utilities/hooks: camelCase files (`useSync.ts`, `dateUtils.ts`).
- Tailwind for styling; UI primitives live under `src/components/ui/`.
- No tests yet — verify with `npm run lint`, `npm run build`, manual flows. See `.github/knowledge/test-patterns.md` before adding a framework.
- Commits follow `feat:` / `fix:` (Conventional Commits). No ticket prefix in use.

## When in doubt

- For a new feature: start by reading `architecture.md` and `domain-model.md`.
- For a sync change: read `.github/copilot-instructions.md` "Hard Bugs" first.
- For a new entity: follow the checklist in `infrastructure-checklists.md`.
- After learning something non-obvious: append to `lessons-learned.md`.
