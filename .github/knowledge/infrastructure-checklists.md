# Infrastructure Checklists — NurtureOS

> Auto-generated from a capability scan of the repo. Use these checklists when adding the **first** instance of a capability to a service that has never had it. They prevent the #1 class of runtime failures: code that compiles but fails at boot because configuration is missing.

## Service × capability matrix

| Service / module | HTTP server | HTTP client | Persistent store | Sync merge | Service worker / PWA | Scheduled jobs | Messaging | DB migrations | Caching |
|------------------|:-----------:|:-----------:|:----------------:|:----------:|:--------------------:|:--------------:|:---------:|:-------------:|:-------:|
| frontend (root)  | ❌          | ✅ (`fetch` in `useSync`) | ✅ localStorage via Zustand `persist` | ✅ client side | ✅ `vite-plugin-pwa` | ❌ | ❌ | ❌ | ❌ |
| backend          | ✅ Express  | ❌          | ✅ JSON file (`backend/data/sync-state.json`) | ✅ server side | ❌ | ❌ | ❌ | ❌ | ❌ |

Categories with no instances anywhere in the repo (messaging, DB migrations, scheduled jobs, server-side cache) are intentionally **not** documented here — adding them is a strategic decision that should pull in a real tool, not a checklist.

---

## First Persisted Zustand Store

When adding the **first** Zustand store for a new entity (or when introducing a brand-new entity that needs to round-trip via sync).

### Setup

- [ ] Type lives in `src/types/{entity}.ts`, exported via `src/types/index.ts` barrel.
- [ ] Type includes `id: string`, `createdAt: string`, `updatedAt: string` (ISO timestamps). Skipping `updatedAt` will silently break sync tiebreaking — see `domain-model.md` "Equality / merge traps".
- [ ] Store file `src/store/{entity}Store.ts` follows the existing pattern: `create<State>()(persist((set, get) => ({...}), { name: 'nurtureos-{slug}' }))`.
- [ ] Mutator actions stamp `updatedAt: new Date().toISOString()` on every write (and on the parent entity if the change is to an embedded child, like `WeekActivity` inside a `WeekPlan`).
- [ ] Store re-exported from `src/store/index.ts`.

### Sync wire-up (REQUIRED — three sites must be updated together)

- [ ] **Client snapshot:** add the new array to `getClientState()` in `src/hooks/useSync.ts`.
- [ ] **Client apply:** add a setter call in `applyServerState()` in `src/hooks/useSync.ts` (gated on `server.{field}?.length`).
- [ ] **Client fingerprint:** include the new array's length in the `fingerprint(s)` helper so a server change actually invalidates the cache.
- [ ] **Server type:** add the field to the `SyncState` interface in `backend/src/routes/sync.ts`.
- [ ] **Server default:** add an empty array to the two `readState()` fallback objects.
- [ ] **Server merge:** add a `mergeArrays(client.{field} ?? [], server.{field})` line inside the `withLock` block of `POST /merge`.

> Missing any one of these six edits is the same bug as commit `42b32a2` ("backend sync missing monthPlans/yearPlans fields").

### Verification

- [ ] Add an entity in browser A, wait for the next sync (≤30 s, or trigger by toggling visibility), confirm browser B picks it up.
- [ ] Edit the same entity on both sides within ~30 s; latest `updatedAt` wins on both.
- [ ] Stop backend mid-edit — UI keeps working, console logs `[useSync] Sync failed: ...`.

### Common traps

- Forgetting to stamp `updatedAt` in a mutator → the entity always loses merges to remote copies.
- Persisted shape changes without a Zustand `persist` migration → users on old browsers load bad data. Add a `version` and `migrate` to the persist config when the shape changes incompatibly.
- Embedding a child collection (like `WeekActivity[]` inside `WeekPlan`) and then editing children concurrently → merge resolves at the parent level, so concurrent edits to different children of the same parent race. Either accept it or split the child into its own store.

---

## First HTTP Client Call (frontend → backend)

### Setup

- [ ] All requests go to `${import.meta.env.VITE_SYNC_URL}/api/...` — never hard-code a host.
- [ ] When `VITE_SYNC_URL` is unset, the call must be a **no-op**, matching `useSync`'s pattern. Onboarding/dev work without a backend should keep functioning.
- [ ] Wrap fetches in `try/catch`, log with `console.warn('[caller] failed:', err)`, do **not** show error UI for sync-style background calls.
- [ ] Use `JSON.stringify(...)` with a typed payload; the backend expects `Content-Type: application/json`.
- [ ] Respect the 5 MB body limit configured in `backend/src/index.ts`. If you need more, raise both ends and reconsider sending the full snapshot.

### Verification

- [ ] Confirm the call works against the local backend (`npm start`).
- [ ] Confirm the call gracefully degrades when the backend is down.
- [ ] If the call mutates server state, verify it's idempotent or guarded — there is no auth and no user partitioning.

### Common traps

- Calling `fetch` inside a Zustand subscription is the exact pattern that caused the 16k-requests/9-min incident (commit `b0f1094`). Drive sync from `useEffect` + interval/visibility, **not** from store subscriptions.

---

## First Backend Route

When adding a new endpoint group to the Express backend.

### Setup

- [ ] New router file under `backend/src/routes/{name}.ts`, exporting `export const {name}Router = Router();`.
- [ ] Mounted in `backend/src/index.ts` with `app.use('/api/{name}', {name}Router);`.
- [ ] Any read-modify-write of a shared file (today: `sync-state.json`) goes through `withLock(...)` — copy the helper from `sync.ts`, do not re-implement it ad hoc.
- [ ] Errors return `res.status(5xx).json({ error: '...' })`. Don't leak stack traces.
- [ ] Body parsing inherits from `app.use(express.json({ limit: '5mb' }))` — don't add another parser per-route.

### Verification

- [ ] `cd backend && npm run typecheck` passes.
- [ ] `curl -i http://localhost:3001/api/{path}` returns the expected status and JSON.
- [ ] Hit it under concurrency (`for i in 1 2 3 4 5; do curl ... & done`) and confirm shared file state stays consistent.

### Common traps

- Reading `sync-state.json` outside the mutex while another handler writes it → silent data loss. Always use `withLock`.
- Treating the backend as authenticated. It isn't. If you add a route that handles secrets or per-user data, add auth first.

---

## First / changed PWA configuration

The repo already has a PWA. These rules carry over from earlier work and apply to any change that touches the SW or `vite-plugin-pwa` config.

### Setup

- [ ] Keep `devOptions.enabled: false` in `vite.config.ts`. Re-enabling dev SW caches stale bundles on `localhost`.
- [ ] Register SW only on non-localhost origins; the localhost branch in `src/main.tsx` must continue to unregister any existing SW.
- [ ] If the manifest icons or `start_url` change, bump the version visible in the UI so device-level cache state is debuggable at a glance.
- [ ] Hosting must serve correct cache headers for the SW file itself (no aggressive caching on `sw.js` / the registered SW asset).

### Verification

- [ ] `npm run build && npm run preview`, open the app in a fresh profile, confirm "New version available" prompt appears on a second deploy.
- [ ] On localhost, verify no SW is registered (DevTools → Application → Service Workers).
- [ ] Through ngrok (`vite preview --host` already allows `.ngrok-free.dev` and `.ngrok.io`), verify SW registers and update prompt fires.

### Common traps

- ngrok tunnel down → ngrok returns HTML error pages with 200 OK; SW caches them as the app shell. Validate cached HTML contains expected app markers before serving (this rule is documented in `.github/copilot-instructions.md`).
- iOS Safari kills SWs aggressively; only server-side Web Push can wake a closed browser. If you ever add background notifications, do not assume `setTimeout` chains will survive — see prior FocusFlow lessons in `.github/copilot-instructions.md`.

---

## Proxy / gateway pattern

NurtureOS does not have a proxy/gateway tier. The frontend talks directly to the backend over `${VITE_SYNC_URL}/api/...`. If you add one, document the full path here:

```
UI → (no proxy) → backend (Express)
```
