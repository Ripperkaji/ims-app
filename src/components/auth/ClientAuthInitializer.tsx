
"use client";

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';

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
    if (!isLoading) {
      const isAuthPage = pathname.startsWith('/login') || pathname === '/';
      if (!user && !isAuthPage) {
        router.push('/login');
      } else if (user && isAuthPage) {
        router.push('/dashboard');
      }
    }
  }, [user, isLoading, pathname, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // If user is null and we are on a protected route, the effect above will redirect.
  // However, to prevent a flash of protected content, we can also check here.
  // But the AppLayout already has a similar check. Let's rely on the AppLayout's check
  // for rendering children to avoid duplicate loading screens.
  // This component primarily handles the initial loading and redirection logic.
  return <>{children}</>;
}
