
"use client";

import type { UserRole } from '@/types';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AuthState {
  user: { role: UserRole; name: string } | null;
  isLoading: boolean; // True until persisted state is loaded or first check is done
  actions: {
    login: (role: UserRole, name: string, routerPush: (path: string) => void) => void;
    logout: (routerPush: (path: string) => void) => void;
    setLoading: (loading: boolean) => void;
    initializeSession: () => void; // Action to call on initial mount if not hydrated
  };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: true, // Start as true
      actions: {
        login: (role, name, routerPush) => {
          const userData = { role, name };
          set({ user: userData, isLoading: false });
          routerPush('/dashboard');
        },
        logout: (routerPush) => {
          set({ user: null, isLoading: false });
          // Clear any other session-related non-Zustand state if necessary
          // For example, if other parts of the app rely on localStorage directly for other things
          // that should be cleared on logout.
          routerPush('/login');
        },
        setLoading: (loading) => set({ isLoading: loading }),
        initializeSession: () => {
          // This function is called by ClientAuthInitializer.
          // If persist middleware has already run and set user, isLoading might already be false.
          // This ensures isLoading becomes false even if there's no persisted state.
          if (get().isLoading) { // Only set if still true
            set({ isLoading: false });
          }
        }
      },
    }),
    {
      name: 'vapeTrackUser-auth-storage', // Key for localStorage
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ user: state.user }), // Only persist the user object
      onRehydrateStorage: () => {
        // This is called after the state has been rehydrated
        return (state) => {
          if (state) {
            state.actions.setLoading(false);
          }
        };
      },
      // Skip hydration server-side since localStorage is not available
      skipHydration: typeof window === 'undefined',
    }
  )
);

// This attempts to set isLoading to false once hydration is done.
// However, relying on ClientAuthInitializer might be more robust for initial app load.
const unsub = useAuthStore.persist.onFinishHydration(() => {
  useAuthStore.getState().actions.setLoading(false);
  unsub(); // Ensure it runs only once
});
