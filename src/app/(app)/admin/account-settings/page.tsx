
"use client";

import { useState, useEffect } from 'react';
import { useAuthStore } from "@/stores/authStore";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { KeyRound, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { mockLogEntries, mockManagedUsers } from '@/lib/data'; 
import ThemeSettings from '@/components/theme/ThemeSettings';
import type { LogEntry } from '@/types';

export default function AdminAccountSettingsPage() {
  const { user, actions } = useAuthStore();
  const router = useRouter();
  const { toast } = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

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

  const addLog = (action: string, details: string) => {
    if (!user) return;
    const newLog: LogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      user: user.name,
      action,
      details,
    };
    mockLogEntries.unshift(newLog);
    mockLogEntries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    // This is a mock implementation. In a real app, you'd call an API.
    const currentUserData = user.role === 'admin' 
        ? mockManagedUsers.find(u => u.email === user.email && u.role === 'admin')
        : mockManagedUsers.find(u => u.email === user.email && u.role === 'staff');
    
    if (!currentUserData) {
        toast({ title: "Error", description: "Could not find your user data.", variant: "destructive" });
        return;
    }

    if (currentPassword !== currentUserData.passwordHash) {
      toast({ title: "Error", description: "Current password incorrect.", variant: "destructive" });
      return;
    }

    if (!newPassword) {
      toast({ title: "Error", description: "New password cannot be empty.", variant: "destructive" });
      return;
    }
    
    if (newPassword.length < 6) {
      toast({ title: "Error", description: "New password must be at least 6 characters.", variant: "destructive" });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast({ title: "Error", description: "New passwords do not match.", variant: "destructive" });
      return;
    }

    if (newPassword === currentUserData.passwordHash) {
      toast({ title: "Error", description: "New password cannot be the same as the old password.", variant: "destructive" });
      return;
    }

    // Update password in mock data
    currentUserData.passwordHash = newPassword;

    addLog(`Password Changed`, `${user.name} updated their password.`);
    toast({ title: "Success", description: "Password changed successfully." });

    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
  };

  if (!user || user.role !== 'admin') {
    return (
        <div className="flex h-screen items-center justify-center">
            <p>Redirecting...</p>
        </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <h1 className="text-3xl font-bold font-headline mb-6 flex items-center gap-2">
        <KeyRound className="h-7 w-7 text-primary" /> Account & Theme Settings
      </h1>

      <div className="space-y-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Change Your Password</CardTitle>
            <CardDescription>Update the password for your account ({user.name}).</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmNewPassword"
                    type={showConfirmNewPassword ? "text" : "password"}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                  >
                    {showConfirmNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full sm:w-auto">
                <ShieldCheck className="mr-2 h-4 w-4" /> Change Password
              </Button>
            </CardFooter>
          </form>
        </Card>

        <ThemeSettings />
      </div>
    </div>
  );
}
