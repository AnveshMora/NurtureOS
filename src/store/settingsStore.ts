import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  hasCompletedOnboarding: boolean;
  setOnboardingComplete: (value: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      hasCompletedOnboarding: false,
      setOnboardingComplete: (value) => set({ hasCompletedOnboarding: value }),
    }),
    {
      name: 'nurtureos-settings',
    }
  )
);
