
"use client";

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Default theme colors (matches globals.css for light mode)
const defaultLightColors = {
  background: '200 17% 96%',
  primary: '220 85% 55%',
  accent: '220 85% 95%',
};

export interface ThemeState {
  theme: 'light' | 'dark';
  lightColors: {
    background: string; // HSL value string 'H S% L%'
    primary: string;
    accent: string;
  };
  actions: {
    setTheme: (theme: 'light' | 'dark') => void;
    setLightColor: (colorName: keyof ThemeState['lightColors'], hslValue: string) => void;
    resetToDefaults: () => void;
  };
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'light',
      lightColors: defaultLightColors,
      actions: {
        setTheme: (theme) => set({ theme }),
        setLightColor: (colorName, hslValue) =>
          set((state) => ({
            lightColors: { ...state.lightColors, [colorName]: hslValue },
          })),
        resetToDefaults: () =>
          set({
            lightColors: defaultLightColors,
          }),
      },
    }),
    {
      name: 'sh-ims-theme-storage',
      storage: createJSONStorage(() => localStorage),
      // Only persist theme and lightColors, not actions
      partialize: (state) => ({
        theme: state.theme,
        lightColors: state.lightColors,
      }),
    }
  )
);
