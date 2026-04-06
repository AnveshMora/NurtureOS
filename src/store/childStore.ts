import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChildProfile } from '../types';

interface ChildState {
  children: ChildProfile[];
  activeChildId: string | null;
  addChild: (child: ChildProfile) => void;
  updateChild: (id: string, updates: Partial<ChildProfile>) => void;
  removeChild: (id: string) => void;
  setActiveChild: (id: string) => void;
}

export const useChildStore = create<ChildState>()(
  persist(
    (set) => ({
      children: [],
      activeChildId: null,

      addChild: (child) =>
        set((state) => {
          const newChildren = [...state.children, child];
          return {
            children: newChildren,
            // Auto-set first child as active
            activeChildId: state.activeChildId ?? child.id,
          };
        }),

      updateChild: (id, updates) =>
        set((state) => ({
          children: state.children.map((c) =>
            c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
          ),
        })),

      removeChild: (id) =>
        set((state) => {
          const newChildren = state.children.filter((c) => c.id !== id);
          const newActiveId =
            state.activeChildId === id
              ? newChildren[0]?.id ?? null
              : state.activeChildId;
          return { children: newChildren, activeChildId: newActiveId };
        }),

      setActiveChild: (id) => set({ activeChildId: id }),
    }),
    {
      name: 'nurtureos-children',
    }
  )
);
