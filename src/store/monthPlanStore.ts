import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MonthPlan, MonthNumber } from '../types';

interface MonthPlanState {
  monthPlans: MonthPlan[];
  addMonthPlan: (plan: MonthPlan) => void;
  updateMonthPlan: (id: string, updates: Partial<MonthPlan>) => void;
  removeMonthPlan: (id: string) => void;
  getPlansForChild: (childId: string) => MonthPlan[];
  getPlanByMonth: (childId: string, month: MonthNumber, year: number) => MonthPlan | undefined;
}

export const useMonthPlanStore = create<MonthPlanState>()(
  persist(
    (set, get) => ({
      monthPlans: [],

      addMonthPlan: (plan) =>
        set((state) => ({ monthPlans: [...state.monthPlans, plan] })),

      updateMonthPlan: (id, updates) =>
        set((state) => ({
          monthPlans: state.monthPlans.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
          ),
        })),

      removeMonthPlan: (id) =>
        set((state) => ({
          monthPlans: state.monthPlans.filter((p) => p.id !== id),
        })),

      getPlansForChild: (childId) =>
        get().monthPlans.filter((p) => p.childId === childId),

      getPlanByMonth: (childId, month, year) =>
        get().monthPlans.find(
          (p) => p.childId === childId && p.month === month && p.year === year
        ),
    }),
    {
      name: 'nurtureos-monthplans',
    }
  )
);
