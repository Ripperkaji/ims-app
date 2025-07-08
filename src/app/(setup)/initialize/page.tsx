
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

// This page is part of a deprecated setup flow.
// It now redirects to the main login page to prevent errors.
export default function DeprecatedInitializePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login');
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
       <p className="ml-2">Redirecting...</p>
    </div>
  );
}
