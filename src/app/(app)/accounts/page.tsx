
"use client";

import { useEffect } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Users } from "lucide-react"; // For the heading icon

export default function AccountsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (user && user.role !== 'admin') {
      toast({ 
        title: "Access Denied", 
        description: "You do not have permission to view this page.", 
        variant: "destructive" 
      });
      router.push('/dashboard');
    }
  }, [user, router, toast]);

  if (!user || user.role !== 'admin') {
    // Render nothing or a loading indicator while redirecting
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
          <Users className="h-7 w-7 text-primary" /> Accounts Management
        </h1>
      </div>
      <div className="p-4 border rounded-lg shadow-sm bg-card">
        <p className="text-muted-foreground">
          This is the placeholder page for Accounts Management. 
          Functionality to manage user accounts will be implemented here.
        </p>
      </div>
    </div>
  );
}
