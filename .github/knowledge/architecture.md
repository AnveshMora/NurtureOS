# Architecture — NurtureOS

> Auto-generated from `src/`, `backend/src/`, and root configs.

## Top-level shape

```
                +------------------+
   browser  ⇄   |  Vite-built SPA  |  ──fetch──▶  Express backend
   (PWA)        |  React + Zustand |              POST /api/sync/merge
                |  + persist (LS)  |              GET  /api/sync/state
                +------------------+              GET  /api/health
                       │                                  │
                       ▼                                  ▼
                  localStorage                  backend/data/sync-state.json
                  (per-store key)               (mutex-locked single file)
```

Two independent processes orchestrated by `npm start`. The frontend is the source of truth in the user's browser; the backend is a **shared sync inbox/outbox** for moving state between devices on the same network.

## Frontend layers

| Layer | Path | Responsibility |
|-------|------|----------------|
| Pages | `src/pages/` | Route components — `OnboardingPage`, `DashboardPage`, `WeekPlannerPage`, `ActivityLibraryPage`, `ActivityDetailPage`, `WeekendReviewPage`, `SettingsPage`, `ImportExportPage`. Wired in `src/App.tsx` via React Router. |
| Layout | `src/components/layout/` | `AppShell` (Outlet host), `Header`, `BottomNav`, `ChildSwitcher`. |
| UI primitives | `src/components/ui/` | `Button`, `Card`, `Input`, `Modal`, `Badge`, `EmptyState`, `SkillDots`, `StatusPill`. Tailwind-styled, no logic. |
| Feature components | `src/components/{activities,dashboard,planner,review}/` | Currently empty placeholders — pages do most of the work today. |
| Hooks | `src/hooks/` | `useActiveChild`, `useAgeBand`, `useCurrentWeek`, `useSync`. |
| State | `src/store/` | Zustand stores with `persist` middleware. One store per entity. Re-exported via barrel `src/store/index.ts`. |
| Domain types | `src/types/` | Type unions, interfaces, label/icon constants. Re-exported via `src/types/index.ts`. |
| Lib | `src/lib/` | Pure utilities + the import/export pipeline (`importPlan.ts`, `exportPlan.ts`, `datasetAdapter.ts`), date helpers, skill mapping. |
| Seed data | `src/data/` | `activities.ts` (`SEED_ACTIVITIES`), `gotchas.ts`, `importantNotToMiss.ts`. |

### Routing

`src/App.tsx`:
- Outside the shell: `/onboarding` (forced when `!hasCompletedOnboarding || !hasChildren`).
- Inside `<AppShell>` (Header + BottomNav): `/` (Dashboard), `/week`, `/activities`, `/activities/:activityId`, `/review`, `/settings`, `/import-export`. Catch-all redirects to `/`.

### State management — Zustand + persist

Every entity store follows the same pattern:

```ts
export const useFooStore = create<FooState>()(
  persist(
    (set, get) => ({ /* state + actions */ }),
    { name: 'nurtureos-foo' }   // localStorage key
  )
);
```

| Store | LS key | Entity |
|-------|--------|--------|
| `useChildStore` | `nurtureos-children` | `ChildProfile[]` + `activeChildId` |
| `useActivityStore` | `nurtureos-activities` | `Activity[]` (seeded from `SEED_ACTIVITIES`) |
| `useWeekPlanStore` | `nurtureos-weekplans` | `WeekPlan[]` (with embedded `WeekActivity[]`) |
| `useMonthPlanStore` | `nurtureos-monthplans` | `MonthPlan[]` |
| `useYearPlanStore` | `nurtureos-yearplans` | `YearPlan[]` |
| `useReviewStore` | `nurtureos-reviews` | `WeekendReview[]` |
| `useSettingsStore` | `nurtureos-settings` | `{ hasCompletedOnboarding }` |

**Update convention:** mutator actions stamp `updatedAt: new Date().toISOString()` on the changed entity (and on the parent `WeekPlan` when an embedded activity changes). This is what the backend merge depends on. New stores **must** keep this contract.

**Reads:** components subscribe via the hook (`useChildStore((s) => s.children)`); imperative reads use `.getState()` (e.g. inside `useSync`).

### Sync (`src/hooks/useSync.ts`)

- Activates only when `import.meta.env.VITE_SYNC_URL` is set.
- Triggers: mount, 30 s interval, `visibilitychange` (foreground), and the returned `sync()` callback.
- **No store subscriptions** — earlier versions used them and triggered feedback loops; the rewrite explicitly removes them. See `.github/copilot-instructions.md` for prior incidents.
- POST `${VITE_SYNC_URL}/api/sync/merge` with full client snapshot, applies merged result via `useXStore.setState({...})`. Apply is gated by a hash fingerprint to avoid no-op re-renders.

## Backend layers

| Layer | Path | Responsibility |
|-------|------|----------------|
| Entry | `backend/src/index.ts` | Express setup: `cors()`, `express.json({ limit: '5mb' })`, mounts routers, `/api/health`. Listens on `process.env.PORT ?? 3001`. |
| Routes | `backend/src/routes/sync.ts` | `GET /state`, `POST /merge`. Mutex-locked file I/O. Timestamp-tiebreak per-`id` array merge. |
| Storage | `backend/data/sync-state.json` | Single-file persistence. Lazily created. |

### Mutex pattern

```ts
let lock: Promise<void> = Promise.resolve();
function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const prev = lock;
  let resolve: () => void;
  lock = new Promise<void>((r) => { resolve = r; });
  return prev.then(fn).finally(() => resolve!());
}
```

Any read-modify-write on `sync-state.json` MUST flow through `withLock(...)`. Concurrent merges without it caused "second writer erases first" — see `.github/copilot-instructions.md`.

### Merge algorithm

`mergeArrays(client, server)` builds a `Map<id, item>`:
1. Seed map with server items.
2. For each client item: if no server entry, take client; else compare `updatedAt ?? createdAt ?? ''` lexicographically — client wins on `>=`.

`settings` merges per-key with the same timestamp rule (currently no entity in the client builds settings with `updatedAt`, so server keys are preserved on draws).

## Cross-process communication

- Frontend ⇄ backend: **HTTP only** (POST/GET to `/api/sync/*`).
- Service worker ⇄ pages: registered in `src/main.tsx`, `prompt`-style updates. **Do not enable dev SW** — it caches stale bundles. Localhost auto-unregisters any existing SW.
- No WebSockets, no SSE, no Kafka/RabbitMQ/SQS, no scheduled jobs.

## Configuration management

- Frontend: Vite env vars (`VITE_*`), surfaced through `import.meta.env`. Only `VITE_SYNC_URL` is in active use.
- Backend: process env (`PORT`).
- No profiles, no `.env` files committed, no config service.

## Security / authn / authz

None. The sync endpoint is unauthenticated and the JSON file is shared. Treat the backend as a **trusted local helper** for one user's devices on a LAN/ngrok tunnel — never expose it publicly without adding auth and per-user partitioning.

## Build & deploy

- Frontend builds with `tsc -b && vite build` → `dist/`. Served by `vite preview` for local prod or any static host.
- Backend runs in dev/prod via `tsx` (no compilation step required to run; `npm run build` exists for completeness).
- `npm start` from repo root: builds frontend with `VITE_SYNC_URL=http://localhost:3001`, then runs preview (4173) and backend (3001) together via `concurrently`.
- ngrok-friendly: `vite preview --host` plus `allowedHosts: ['.ngrok-free.dev', '.ngrok.io']` in `vite.config.ts`.

## PWA architecture

- `vite-plugin-pwa` with `registerType: 'prompt'`.
- SW registered only on non-localhost (`src/main.tsx`).
- Manifest set in `vite.config.ts` (name, theme color, icons).
- `devOptions.enabled: false` is **intentional** — see `.github/copilot-instructions.md` "Stale Service Worker Cache". Do not flip it on.

## When adding new code

1. **New entity?** Add types under `src/types/`, export in `types/index.ts`, create `src/store/{entity}Store.ts` mirroring the existing pattern (Zustand + `persist` + `nurtureos-{slug}` key, `updatedAt` stamp on every mutator). Then wire into `useSync` (`getClientState` and `applyServerState`) **and** `backend/src/routes/sync.ts` (`SyncState` interface + `mergeArrays` call). All three sites must be updated together — missing any one of them is the bug from commit 42b32a2.
2. **New page?** Add under `src/pages/`, register in `App.tsx`, optionally add a `BottomNav` entry.
3. **New API?** Add a router under `backend/src/routes/`, mount in `backend/src/index.ts`. If it touches `sync-state.json`, use `withLock()`.
