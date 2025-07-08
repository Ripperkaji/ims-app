
"use client";

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function ClientAuthInitializer({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // This is the core routing logic for the entire app.
    if (!isLoading) {
      const isAuthPage = pathname.startsWith('/login');
      
      if (!user && !isAuthPage) {
        // Not logged in, and not on a login page -> go to login
        router.push('/login');
      } else if (user && isAuthPage) {
        // Logged in, but on a login page -> go to dashboard
        router.push('/dashboard');
      }
    }
  }, [user, isLoading, pathname, router]);

  // Show a global loader during initial auth check.
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // Prevent flash of protected pages for unauthenticated users.
  const isProtectedRoute = !pathname.startsWith('/login');
  if (!isLoading && !user && isProtectedRoute) {
     return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
         <p className="ml-2">Redirecting...</p>
      </div>
    );
  }

  return <>{children}</>;
}
