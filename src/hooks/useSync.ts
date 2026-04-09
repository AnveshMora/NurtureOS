import { useEffect, useRef, useCallback } from 'react';
import { useChildStore, useWeekPlanStore, useReviewStore, useActivityStore, useMonthPlanStore, useYearPlanStore } from '../store';

const SYNC_URL = import.meta.env.VITE_SYNC_URL ?? 'http://localhost:3001';
const SYNC_INTERVAL = 30_000; // 30 seconds

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

/**
 * useSync — bidirectional sync with backend.
 *
 * Syncs on: mount, 30s interval, visibility change, and manual trigger.
 * No store subscriptions — avoids feedback loops entirely.
 * Only active when VITE_SYNC_URL is set.
 */
export function useSync() {
  const syncingRef = useRef(false);
  const lastHashRef = useRef('');

  const getClientState = useCallback((): SyncState => ({
    children: useChildStore.getState().children,
    weekPlans: useWeekPlanStore.getState().weekPlans,
    reviews: useReviewStore.getState().reviews,
    activities: useActivityStore.getState().activities,
    monthPlans: useMonthPlanStore.getState().monthPlans,
    yearPlans: useYearPlanStore.getState().yearPlans,
    settings: {},
    updatedAt: new Date().toISOString(),
  }), []);

  // Quick fingerprint to detect if server response has new data
  const fingerprint = (s: SyncState) =>
    `${s.children?.length ?? 0}-${s.weekPlans?.length ?? 0}-${s.activities?.length ?? 0}-${s.monthPlans?.length ?? 0}-${s.yearPlans?.length ?? 0}-${s.updatedAt}`;

  const applyServerState = useCallback((server: SyncState) => {
    // Only apply if server has data the client might not have
    const hash = fingerprint(server);
    if (hash === lastHashRef.current) return; // No change — skip
    lastHashRef.current = hash;

    if (server.children?.length) {
      useChildStore.setState({ children: server.children as ReturnType<typeof useChildStore.getState>['children'] });
    }
    if (server.weekPlans?.length) {
      useWeekPlanStore.setState({ weekPlans: server.weekPlans as ReturnType<typeof useWeekPlanStore.getState>['weekPlans'] });
    }
    if (server.reviews?.length) {
      useReviewStore.setState({ reviews: server.reviews as ReturnType<typeof useReviewStore.getState>['reviews'] });
    }
    if (server.activities?.length) {
      useActivityStore.setState({ activities: server.activities as ReturnType<typeof useActivityStore.getState>['activities'] });
    }
    if (server.monthPlans?.length) {
      useMonthPlanStore.setState({ monthPlans: server.monthPlans as ReturnType<typeof useMonthPlanStore.getState>['monthPlans'] });
    }
    if (server.yearPlans?.length) {
      useYearPlanStore.setState({ yearPlans: server.yearPlans as ReturnType<typeof useYearPlanStore.getState>['yearPlans'] });
    }
  }, []);

  const sync = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;

    try {
      const response = await fetch(`${SYNC_URL}/api/sync/merge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(getClientState()),
      });

      if (!response.ok) throw new Error(`Sync failed: ${response.status}`);

      const merged = await response.json() as SyncState;
      applyServerState(merged);
    } catch (err) {
      console.warn('[useSync] Sync failed:', err);
    } finally {
      syncingRef.current = false;
    }
  }, [getClientState, applyServerState]);

  // Sync on mount + interval
  useEffect(() => {
    if (!import.meta.env.VITE_SYNC_URL) return;

    sync();
    const interval = setInterval(sync, SYNC_INTERVAL);
    return () => clearInterval(interval);
  }, [sync]);

  // Sync on visibility change (app returns to foreground)
  useEffect(() => {
    if (!import.meta.env.VITE_SYNC_URL) return;

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') sync();
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [sync]);

  return { sync };
}
