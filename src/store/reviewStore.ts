import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WeekendReview } from '../types';

interface ReviewState {
  reviews: WeekendReview[];
  addReview: (review: WeekendReview) => void;
  updateReview: (id: string, updates: Partial<WeekendReview>) => void;
  removeReview: (id: string) => void;
  getReviewsForChild: (childId: string) => WeekendReview[];
  getReviewForWeek: (weekPlanId: string) => WeekendReview | undefined;
}

export const useReviewStore = create<ReviewState>()(
  persist(
    (set, get) => ({
      reviews: [],

      addReview: (review) =>
        set((state) => ({ reviews: [...state.reviews, review] })),

      updateReview: (id, updates) =>
        set((state) => ({
          reviews: state.reviews.map((r) =>
            r.id === id ? { ...r, ...updates } : r
          ),
        })),

      removeReview: (id) =>
        set((state) => ({
          reviews: state.reviews.filter((r) => r.id !== id),
        })),

      getReviewsForChild: (childId) =>
        get().reviews.filter((r) => r.childId === childId),

      getReviewForWeek: (weekPlanId) =>
        get().reviews.find((r) => r.weekPlanId === weekPlanId),
    }),
    {
      name: 'nurtureos-reviews',
    }
  )
);
