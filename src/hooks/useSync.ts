import { useEffect, useRef, useCallback } from 'react';
import { useChildStore, useWeekPlanStore, useReviewStore, useActivityStore, useMonthPlanStore, useYearPlanStore } from '../store';

const SYNC_URL = import.meta.env.VITE_SYNC_URL ?? 'http://localhost:3001';
const SYNC_INTERVAL = 60_000; // 1 minute

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
 * Uses skipNextSubRef to prevent feedback loops (FocusFlow pattern).
 * Only active when VITE_SYNC_URL is set.
 */
export function useSync() {
  const skipNextSubRef = useRef(false);
  const syncingRef = useRef(false);

  const children = useChildStore((s) => s.children);
  const weekPlans = useWeekPlanStore((s) => s.weekPlans);
  const reviews = useReviewStore((s) => s.reviews);
  const activities = useActivityStore((s) => s.activities);
  const monthPlans = useMonthPlanStore((s) => s.monthPlans);
  const yearPlans = useYearPlanStore((s) => s.yearPlans);

  const getClientState = useCallback((): SyncState => ({
    children,
    weekPlans,
    reviews,
    activities,
    monthPlans,
    yearPlans,
    settings: {},
    updatedAt: new Date().toISOString(),
  }), [children, weekPlans, reviews, activities, monthPlans, yearPlans]);

  const applyServerState = useCallback((server: SyncState) => {
    skipNextSubRef.current = true;

    if (server.children?.length) {
      useChildStore.setState({ children: server.children as typeof children });
    }
    if (server.weekPlans?.length) {
      useWeekPlanStore.setState({ weekPlans: server.weekPlans as typeof weekPlans });
    }
    if (server.reviews?.length) {
      useReviewStore.setState({ reviews: server.reviews as typeof reviews });
    }
    if (server.activities?.length) {
      useActivityStore.setState({ activities: server.activities as typeof activities });
    }
    if (server.monthPlans?.length) {
      useMonthPlanStore.setState({ monthPlans: server.monthPlans as typeof monthPlans });
    }
    if (server.yearPlans?.length) {
      useYearPlanStore.setState({ yearPlans: server.yearPlans as typeof yearPlans });
    }

    // Reset after all synchronous subscription callbacks have fired
    queueMicrotask(() => { skipNextSubRef.current = false; });
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

  // Sync on interval
  useEffect(() => {
    if (!import.meta.env.VITE_SYNC_URL) return;

    // Initial sync
    sync();

    const interval = setInterval(sync, SYNC_INTERVAL);
    return () => clearInterval(interval);
  }, [sync]);

  // Sync on visibility change (app returns to foreground)
  useEffect(() => {
    if (!import.meta.env.VITE_SYNC_URL) return;

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        sync();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [sync]);

  // Subscribe to store changes and sync (with feedback loop prevention + debounce)
  useEffect(() => {
    if (!import.meta.env.VITE_SYNC_URL) return;

    let debounceTimer: ReturnType<typeof setTimeout>;
    const debouncedSync = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(sync, 500);
    };

    const guard = () => {
      if (skipNextSubRef.current) return;
      debouncedSync();
    };

    const unsubs = [
      useChildStore.subscribe(guard),
      useWeekPlanStore.subscribe(guard),
      useReviewStore.subscribe(guard),
      useMonthPlanStore.subscribe(guard),
      useYearPlanStore.subscribe(guard),
    ];

    return () => {
      clearTimeout(debounceTimer);
      unsubs.forEach((unsub) => unsub());
    };
  }, [sync]);

  return { sync };
}
