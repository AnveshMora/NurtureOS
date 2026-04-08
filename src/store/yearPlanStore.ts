import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { YearPlan } from '../types';

interface YearPlanState {
  yearPlans: YearPlan[];
  addYearPlan: (plan: YearPlan) => void;
  updateYearPlan: (id: string, updates: Partial<YearPlan>) => void;
  removeYearPlan: (id: string) => void;
  getPlansForChild: (childId: string) => YearPlan[];
  getPlanByYear: (childId: string, year: number) => YearPlan | undefined;
}

export const useYearPlanStore = create<YearPlanState>()(
  persist(
    (set, get) => ({
      yearPlans: [],

      addYearPlan: (plan) =>
        set((state) => ({ yearPlans: [...state.yearPlans, plan] })),

      updateYearPlan: (id, updates) =>
        set((state) => ({
          yearPlans: state.yearPlans.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
          ),
        })),

      removeYearPlan: (id) =>
        set((state) => ({
          yearPlans: state.yearPlans.filter((p) => p.id !== id),
        })),

      getPlansForChild: (childId) =>
        get().yearPlans.filter((p) => p.childId === childId),

      getPlanByYear: (childId, year) =>
        get().yearPlans.find((p) => p.childId === childId && p.year === year),
    }),
    {
      name: 'nurtureos-yearplans',
    }
  )
);
