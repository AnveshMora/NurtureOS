import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Activity } from '../types';
import { SEED_ACTIVITIES } from '../data/activities';

interface ActivityState {
  activities: Activity[];
  addActivity: (activity: Activity) => void;
  updateActivity: (id: string, updates: Partial<Activity>) => void;
  removeActivity: (id: string) => void;
  getActivity: (id: string) => Activity | undefined;
  resetToDefaults: () => void;
}

export const useActivityStore = create<ActivityState>()(
  persist(
    (set, get) => ({
      activities: SEED_ACTIVITIES,

      addActivity: (activity) =>
        set((state) => ({ activities: [...state.activities, activity] })),

      updateActivity: (id, updates) =>
        set((state) => ({
          activities: state.activities.map((a) =>
            a.id === id ? { ...a, ...updates } : a
          ),
        })),

      removeActivity: (id) =>
        set((state) => ({
          activities: state.activities.filter((a) => a.id !== id),
        })),

      getActivity: (id) => get().activities.find((a) => a.id === id),

      resetToDefaults: () => set({ activities: SEED_ACTIVITIES }),
    }),
    {
      name: 'nurtureos-activities',
    }
  )
);
