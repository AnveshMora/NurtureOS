# Build System — NurtureOS

> Auto-generated. NurtureOS is a small npm monorepo: frontend at the repo root, an Express sync backend in `backend/`. No tests, no proto, no migrations.

## Workspaces

| Workspace | Path | Purpose |
|-----------|------|---------|
| frontend  | `/` (root `package.json`) | React 19 + TypeScript PWA built with Vite. UI, planning, sync hook, store. |
| backend   | `backend/`               | Express 5 + TypeScript sync server. Single endpoint group (`/api/sync/*`). Stores state in `backend/data/sync-state.json`. |

The two are not declared as npm workspaces — they each have their own `package.json` and `node_modules/`. The root `npm start` script orchestrates both via `concurrently`.

## Key dependencies

### Frontend (`/package.json`)
- **react ^19.2**, **react-dom ^19.2**, **react-router-dom ^7**
- **zustand ^5** — state with `persist` middleware (localStorage)
- **date-fns ^4**, **nanoid ^5**, **recharts ^3**
- Build/dev: **vite ^8**, **@vitejs/plugin-react ^6**, **vite-plugin-pwa ^1**, **@tailwindcss/vite ^4**, **typescript ~5.9**
- Lint: **eslint ^9** (flat config), **typescript-eslint ^8**, **eslint-plugin-react-hooks ^7**, **eslint-plugin-react-refresh**

### Backend (`backend/package.json`)
- **express ^5**, **cors ^2**
- Dev: **tsx ^4** (TypeScript runner, watch mode), **typescript ^5.8**

## Build commands cheat sheet

Run from repo root unless noted.

| Command | What it does |
|---------|--------------|
| `npm install` | Installs frontend deps. Run `cd backend && npm install` separately for the backend. |
| `npm run dev` | Vite dev server, `--host` exposes on LAN. No backend. |
| `npm run build` | `tsc -b && vite build` — type-checks all referenced tsconfigs and produces `dist/`. |
| `npm run lint` | ESLint over `**/*.{ts,tsx}`. |
| `npm run preview` | Serves the built frontend with `vite preview --host`. |
| `npm start` | Builds frontend with `VITE_SYNC_URL=http://localhost:3001`, then runs `vite preview --port 4173` AND `cd backend && npm run start` concurrently. |
| `npm run start:frontend` | Frontend only — `npm run build && vite preview --host --port 4173`. |
| `cd backend && npm run dev` | Express via `tsx watch src/index.ts` (port 3001 default). |
| `cd backend && npm run start` | Express via `tsx src/index.ts` (no watch). |
| `cd backend && npm run build` | `tsc` to backend `dist/`. |
| `cd backend && npm run typecheck` | `tsc --noEmit`. |

## Configuration

| File | Role |
|------|------|
| `tsconfig.json` | Root project references — points to `tsconfig.app.json` and `tsconfig.node.json`. |
| `tsconfig.app.json` | App TypeScript config (browser). |
| `tsconfig.node.json` | Vite/build tooling TypeScript config. |
| `backend/tsconfig.json` | Backend TypeScript config (Node ESM). |
| `vite.config.ts` | Plugins: `@vitejs/plugin-react`, `tailwindcss`, `VitePWA`. PWA `devOptions.enabled: false` (deliberate — see lessons). Preview proxies `/api` → `localhost:4174`. Allowed hosts: `.ngrok-free.dev`, `.ngrok.io`. Path alias `@` → `/src`. |
| `eslint.config.js` | Flat config with TS + React Hooks + React Refresh recommended. `dist/` ignored globally. |

## Code generation / proto

None.

## Database / migrations

None. State persists as a single JSON file at `backend/data/sync-state.json`. The file is created on demand by `backend/src/routes/sync.ts`.

## CI pipeline

None detected — there is no `.github/workflows/` or `Jenkinsfile`. Builds and deploys are manual.

## Environment variables

| Variable | Where | Purpose |
|----------|-------|---------|
| `VITE_SYNC_URL` | Frontend (build-time, exposed via `import.meta.env`) | Base URL for the sync backend. **When unset, `useSync` is a no-op.** Set to `http://localhost:3001` by `npm start`. |
| `PORT` | Backend | Express listen port. Defaults to `3001`. |

## PWA notes

`vite-plugin-pwa` is configured with `registerType: 'prompt'` and `devOptions.enabled: false`. The service worker is registered only on non-localhost origins (`src/main.tsx`); on `localhost`/`127.0.0.1` any existing registration is unregistered to avoid stale-cache traps. See `.github/copilot-instructions.md` for the SW rules carried over from the FocusFlow era.
