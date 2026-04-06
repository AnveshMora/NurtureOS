import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WeekPlan, WeekActivity, ActivityStatus } from '../types';

interface WeekPlanState {
  weekPlans: WeekPlan[];
  addWeekPlan: (plan: WeekPlan) => void;
  updateWeekPlan: (id: string, updates: Partial<WeekPlan>) => void;
  removeWeekPlan: (id: string) => void;
  addActivityToWeek: (weekPlanId: string, activity: WeekActivity) => void;
  updateWeekActivity: (weekPlanId: string, activityId: string, updates: Partial<WeekActivity>) => void;
  removeActivityFromWeek: (weekPlanId: string, activityId: string) => void;
  setActivityStatus: (weekPlanId: string, activityId: string, status: ActivityStatus) => void;
  getPlansForChild: (childId: string) => WeekPlan[];
  getPlanByWeek: (childId: string, weekNumber: number, year: number) => WeekPlan | undefined;
}

export const useWeekPlanStore = create<WeekPlanState>()(
  persist(
    (set, get) => ({
      weekPlans: [],

      addWeekPlan: (plan) =>
        set((state) => ({ weekPlans: [...state.weekPlans, plan] })),

      updateWeekPlan: (id, updates) =>
        set((state) => ({
          weekPlans: state.weekPlans.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
          ),
        })),

      removeWeekPlan: (id) =>
        set((state) => ({
          weekPlans: state.weekPlans.filter((p) => p.id !== id),
        })),

      addActivityToWeek: (weekPlanId, activity) =>
        set((state) => ({
          weekPlans: state.weekPlans.map((p) =>
            p.id === weekPlanId
              ? { ...p, activities: [...p.activities, activity], updatedAt: new Date().toISOString() }
              : p
          ),
        })),

      updateWeekActivity: (weekPlanId, activityId, updates) =>
        set((state) => ({
          weekPlans: state.weekPlans.map((p) =>
            p.id === weekPlanId
              ? {
                  ...p,
                  activities: p.activities.map((a) =>
                    a.id === activityId ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : p
          ),
        })),

      removeActivityFromWeek: (weekPlanId, activityId) =>
        set((state) => ({
          weekPlans: state.weekPlans.map((p) =>
            p.id === weekPlanId
              ? {
                  ...p,
                  activities: p.activities.filter((a) => a.id !== activityId),
                  updatedAt: new Date().toISOString(),
                }
              : p
          ),
        })),

      setActivityStatus: (weekPlanId, activityId, status) =>
        set((state) => ({
          weekPlans: state.weekPlans.map((p) =>
            p.id === weekPlanId
              ? {
                  ...p,
                  activities: p.activities.map((a) =>
                    a.id === activityId ? { ...a, status, updatedAt: new Date().toISOString() } : a
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : p
          ),
        })),

      getPlansForChild: (childId) =>
        get().weekPlans.filter((p) => p.childId === childId),

      getPlanByWeek: (childId, weekNumber, year) =>
        get().weekPlans.find(
          (p) => p.childId === childId && p.weekNumber === weekNumber && p.year === year
        ),
    }),
    {
      name: 'nurtureos-weekplans',
    }
  )
);
