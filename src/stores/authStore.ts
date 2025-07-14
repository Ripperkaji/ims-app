
"use client";

import type { User, UserRole } from '@/types';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mockManagedUsers } from '@/lib/data';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  actions: {
    login: (identifier: string, password_plaintext: string, role: UserRole, routerPush: (path: string) => void) => boolean;
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
        login: (identifier, password_plaintext, role, routerPush) => {
          // Both admin and staff now log in with email (identifier) and password.
          const userToLogin = mockManagedUsers.find(
            u => u.email.toLowerCase() === identifier.toLowerCase() && u.passwordHash === password_plaintext && u.role === role
          );

          if (userToLogin) {
            set({ user: { id: userToLogin.id, name: userToLogin.name, email: userToLogin.email, role: userToLogin.role }, isLoading: false });
            routerPush('/dashboard');
            return true;
          }
          // Do not update state on failed login
          return false;
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
