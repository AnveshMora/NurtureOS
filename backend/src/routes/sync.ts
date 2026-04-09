import { Router } from 'express';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', '..', 'data');
const STATE_FILE = join(DATA_DIR, 'sync-state.json');

// Mutex lock to prevent concurrent read-modify-write corruption
let lock: Promise<void> = Promise.resolve();

function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const prev = lock;
  let resolve: () => void;
  lock = new Promise<void>((r) => { resolve = r; });
  return prev.then(fn).finally(() => resolve!());
}

interface SyncState {
  children: unknown[];
  weekPlans: unknown[];
  reviews: unknown[];
  activities: unknown[];
  monthPlans: unknown[];
  yearPlans: unknown[];
  settings: Record<string, unknown>;
  updatedAt: string;
}

async function readState(): Promise<SyncState> {
  try {
    if (!existsSync(STATE_FILE)) {
      return {
        children: [],
        weekPlans: [],
        reviews: [],
        activities: [],
        monthPlans: [],
        yearPlans: [],
        settings: {},
        updatedAt: new Date().toISOString(),
      };
    }
    const data = await readFile(STATE_FILE, 'utf-8');
    return JSON.parse(data) as SyncState;
  } catch {
    return {
      children: [],
      weekPlans: [],
      reviews: [],
      activities: [],
      monthPlans: [],
      yearPlans: [],
      settings: {},
      updatedAt: new Date().toISOString(),
    };
  }
}

async function writeState(state: SyncState): Promise<void> {
  if (!existsSync(DATA_DIR)) {
    await mkdir(DATA_DIR, { recursive: true });
  }
  await writeFile(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
}

// Timestamp-based merge: newer wins for each entity by ID
function mergeArrays(client: unknown[], server: unknown[]): unknown[] {
  const map = new Map<string, unknown>();

  for (const item of server) {
    const id = (item as Record<string, unknown>).id as string;
    if (id) map.set(id, item);
  }

  for (const item of client) {
    const record = item as Record<string, unknown>;
    const id = record.id as string;
    if (!id) continue;

    const existing = map.get(id) as Record<string, unknown> | undefined;
    if (!existing) {
      map.set(id, item);
    } else {
      // Newer updatedAt wins
      const clientTime = record.updatedAt as string ?? record.createdAt as string ?? '';
      const serverTime = existing.updatedAt as string ?? existing.createdAt as string ?? '';
      if (clientTime >= serverTime) {
        map.set(id, item);
      }
    }
  }

  return Array.from(map.values());
}

export const syncRouter = Router();

// GET current server state
syncRouter.get('/state', async (_req, res) => {
  try {
    const state = await readState();
    res.json(state);
  } catch {
    res.status(500).json({ error: 'Failed to read state' });
  }
});

// POST merge client state with server state (mutex-locked)
syncRouter.post('/merge', async (req, res) => {
  try {
    const merged = await withLock(async () => {
      const server = await readState();
      const client = req.body as SyncState;

      const result: SyncState = {
        children: mergeArrays(client.children ?? [], server.children),
        weekPlans: mergeArrays(client.weekPlans ?? [], server.weekPlans),
        reviews: mergeArrays(client.reviews ?? [], server.reviews),
        activities: mergeArrays(client.activities ?? [], server.activities),
        monthPlans: mergeArrays(client.monthPlans ?? [], server.monthPlans),
        yearPlans: mergeArrays(client.yearPlans ?? [], server.yearPlans),
        settings: {
          ...server.settings,
          ...Object.fromEntries(
            Object.entries(client.settings ?? {}).filter(
              ([key, val]) => {
                const clientTime = (val as Record<string, unknown>)?.updatedAt as string ?? '';
                const serverTime = (server.settings[key] as Record<string, unknown>)?.updatedAt as string ?? '';
                return clientTime >= serverTime;
              }
            )
          ),
        },
        updatedAt: new Date().toISOString(),
      };

      await writeState(result);
      return result;
    });

    res.json(merged);
  } catch {
    res.status(500).json({ error: 'Merge failed' });
  }
});
