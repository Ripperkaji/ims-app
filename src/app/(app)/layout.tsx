
"use client";

import React, { useEffect } from 'react';
import AppSidebar from '@/components/layout/AppSidebar';
import AppHeader from '@/components/layout/AppHeader';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation'; // Keep for potential direct usage if needed
import { Loader2 } from 'lucide-react';
import TawkToChat from '@/components/chat/TawkToChat';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuthStore();
  const router = useRouter(); // Keep router instance for clarity or future direct use

  // The primary redirection logic is now in ClientAuthInitializer.
  // This useEffect is a safeguard for the app layout itself.
  useEffect(() => {
    if (!isLoading && !user) {
      // This should ideally not be hit if ClientAuthInitializer works correctly,
      // but acts as a failsafe for direct navigation to protected layout.
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading && !user) { // Show loader if actively loading and no user yet
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    // If still no user after loading (e.g. auth failed or cleared),
    // and redirection hasn't happened, show loader or minimal content
    // to prevent flashing protected UI. ClientAuthInitializer should handle redirection.
     return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
         <p className="ml-2">Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <AppSidebar />
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-64">
        <AppHeader />
        <main className="flex-1 p-4 sm:px-6 sm:py-0">{children}</main>
      </div>
      <TawkToChat />
    </div>
  );
}
