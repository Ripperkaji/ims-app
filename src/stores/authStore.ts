
"use client";

import type { User } from '@/types';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  actions: {
    login: (userData: User, routerPush: (path: string) => void) => void;
    logout: (routerPush: (path: string) => void) => void;
    setLoading: (loading: boolean) => void;
  };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: true, // Start as true
      actions: {
        login: (userData, routerPush) => {
          set({ user: userData, isLoading: false });
          routerPush('/dashboard');
        },
        logout: (routerPush) => {
          set({ user: null, isLoading: false });
          routerPush('/login');
        },
        setLoading: (loading) => set({ isLoading: loading }),
      },
    }),
    {
      name: 'vapeTrackUser-auth-storage', 
      storage: createJSONStorage(() => localStorage), 
      partialize: (state) => ({ user: state.user }), 
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.actions.setLoading(false);
        }
      },
      skipHydration: typeof window === 'undefined',
    }
  )
);
