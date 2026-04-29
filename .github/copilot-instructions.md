# NurtureOS — AI Assistant Instructions

> **Updated 2026-04-29 by `/sdlc:init`.** The newer, project-specific knowledge base lives under `.github/knowledge/` and is indexed by `.github/ai-sdlc-config.yml`. Read those first for build commands, the domain model, the architecture, the sync contract, and first-time-setup checklists. The sections below are legacy guidance from the FocusFlow era — the **Hard Bugs** and **PWA Gotchas** rules are still load-bearing for NurtureOS (sync mutex, no dev SW, no store-subscription-driven sync), so they remain in force.

## Knowledge base

- `CLAUDE.md` (repo root) — entry point summary.
- `.github/ai-sdlc-config.yml` — build/test/lint commands, conventions.
- `.github/knowledge/architecture.md` — frontend layers, sync flow, "when adding new code".
- `.github/knowledge/domain-model.md` — entities, `updatedAt` contract, equality traps.
- `.github/knowledge/build-system.md` — scripts, tsconfig, env vars.
- `.github/knowledge/infrastructure-checklists.md` — checklists for adding stores, routes, HTTP calls, PWA changes.
- `.github/knowledge/test-patterns.md` — there are no tests yet; conventions documented for when there are.
- `.github/knowledge/lessons-learned.md` — append-only log.
- `.github/git-commit-instructions.md` — Conventional Commits, no ticket prefix.

---

## Workflow Orchestration

### 1. Plan Mode Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately — don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy
- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

### 3. Self-Improvement Loop
- After ANY correction from the user: update `tasks/lessons.md` with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project

### 4. Verification Before Done
- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

### 5. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes — don't over-engineer
- Challenge your own work before presenting it

### 6. Autonomous Bug Fixing
- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests — then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

## Task Management
1. **Plan First**: Write plan to `tasks/todo.md` with checkable items
2. **Verify Plan**: Check in before starting implementation
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Add review section to `tasks/todo.md`
6. **Capture Lessons**: Update `tasks/lessons.md` after corrections

## Core Principles
- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing bugs.

---

## FocusFlow — Known Bugs & Patterns

### Hard Bugs (encountered and fixed — watch for regressions)

1. **Stale Service Worker Cache**
   - SW with `devOptions: { enabled: true }` caches old bundles on localhost and silently serves them even after rebuild.
   - Rule: Never enable dev SW. Only register SW on production origins (ngrok/deployed). Auto-unregister on localhost (`main.tsx`).

2. **Sync Race Condition**
   - Two concurrent `/merge` requests read the same server JSON, merge independently, then write back — second write erases the first's changes.
   - Rule: Any read-modify-write on `sync-state.json` must be wrapped in a mutex lock (`backend/src/routes/sync.ts`).

3. **Sync Feedback Loop**
   - Applying merged state to Zustand triggers store subscription → triggers sync → triggers subscription → infinite loop.
   - Rule: Use `skipNextSubRef` flag in `useSync.ts` to skip one subscription callback after applying merged data.

4. **Settings Overwrite on Sync**
   - Merge logic `client.settings ?? server.settings` means non-null defaults always win over customized remote settings.
   - Rule: Every synced entity needs an `updatedAt` timestamp. Compare timestamps in merge — newer wins.

5. **Background Notifications Frozen**
   - `window.setTimeout()` gets frozen when browser tab is backgrounded. Notifications never fire.
   - Rule: Delegate time-sensitive scheduling to Service Worker via `postMessage`. Use `setTimeout` chain + `event.waitUntil()` to keep SW alive.

### PWA Gotchas

- **ngrok error pages get cached** — ngrok returns HTML (not network errors) when tunnel is down. SW caches these as the app shell. Always validate cached HTML contains app markers (`FocusFlow` / `root`) before serving.
- **iOS Safari SW lifetime** — Service workers have restricted lifetimes. `waitUntil` helps but isn't guaranteed for long durations. Only Web Push (server-side) can wake a killed browser.
- **Always show a version tag** — Display build version in the UI header so you can instantly verify which bundle is running on each device. Without this, caching bugs are invisible.
- **`vite preview` has no HMR** — After `npm run build`, users must manually hard-refresh. Consider adding a SW update prompt.

### Reusable Patterns

| Pattern | File | Purpose |
|---|---|---|
| Timestamp-based timers | `store/timerStore.ts` | Use `Date.now()` not `setInterval` counting — survives app backgrounding |
| Mutex lock on file I/O | `backend/src/routes/sync.ts` | Prevents concurrent merge corruption on shared JSON |
| `skipNextSubRef` | `hooks/useSync.ts` | Breaks reactive feedback loops in bidirectional sync |
| SW notification chain | `sw.ts` | `setTimeout` chain + `waitUntil` for precise background notification scheduling |
| `visibilitychange` listener | `pages/TimerPage.tsx` | Recalculate state when app returns to foreground |
| `focus` event + 60s interval | `App.tsx` | Detect midnight rollover / new day on app resume |
| Trust-based checkpoints | `components/CheckpointModal.tsx` | 5→10→20→40→60 min adaptive intervals; "Yes" grows trust, ignore shrinks it |
