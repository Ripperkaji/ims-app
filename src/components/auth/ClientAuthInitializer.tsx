"use client";

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { appSettings } from '@/lib/data';

export default function ClientAuthInitializer({ children }: { children: React.ReactNode }) {
  const { user, isLoading, actions } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // This effect runs once on mount to ensure loading state is handled
    // if hydration didn't immediately set it or if there's no persisted state.
    actions.initializeSession();
  }, [actions]);

  useEffect(() => {
    // This is the core routing logic for the entire app.
    
    // 1. If not initialized, force user to setup page
    if (!appSettings.isInitialized && pathname !== '/initialize') {
        router.push('/initialize');
        return;
    }
    
    // 2. If initialized, handle auth state
    if (appSettings.isInitialized && !isLoading) {
      const isAuthPage = pathname.startsWith('/login');
      const isSetupPage = pathname.startsWith('/initialize');
      
      if (isSetupPage) {
        // App is set up, user should not be on this page. Redirect to login.
        router.push('/login');
        return;
      }
      
      if (!user && !isAuthPage && !isSetupPage) {
        // Not logged in, not on login, not on setup -> go to login
        router.push('/login');
      } else if (user && (isAuthPage || isSetupPage)) {
        // Logged in, but on login or setup page -> go to dashboard
        router.push('/dashboard');
      }
    }
  }, [user, isLoading, pathname, router]);

  // Show a global loader during initial auth check or redirects.
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // Prevent flash of content during redirects
  if (!appSettings.isInitialized && pathname !== '/initialize') {
      return (
          <div className="flex h-screen items-center justify-center bg-background">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="ml-2">Redirecting to setup...</p>
          </div>
      );
  }

  return <>{children}</>;
}
