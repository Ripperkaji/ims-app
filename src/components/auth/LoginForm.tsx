
"use client";

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, EyeOff, LogIn, KeyRound, User as UserIcon } from 'lucide-react';
import type { UserRole } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { mockManagedUsers } from '@/lib/data';
import Image from "next/image";

interface LoginFormProps {
  userType: 'admin' | 'staff';
}

export default function LoginForm({ userType }: LoginFormProps) {
  const { actions } = useAuthStore();
  const { toast } = useToast();
  const router = useRouter();

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const staffUsers = mockManagedUsers.filter(u => u.role === 'staff');
  const adminUsers = mockManagedUsers.filter(u => u.role === 'admin');
  const usersToList = userType === 'admin' ? adminUsers : staffUsers;

  useEffect(() => {
    // When user selection changes, reset password and auto-populate for convenience
    setPassword('');
    if (selectedUserId) {
      const selectedUser = usersToList.find(u => u.id === selectedUserId);
      if (selectedUser) {
        // Set password for convenience in mock environment
        setPassword(selectedUser.passwordHash);
      }
    }
  }, [selectedUserId, userType, usersToList]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let loginSuccess = false;

    if (!selectedUserId) {
      toast({ title: "Selection Required", description: `Please select a ${userType} user.`, variant: "destructive" });
      return;
    }
    if (!password) {
      toast({ title: "Password Required", description: "Please enter the password.", variant: "destructive" });
      return;
    }

    const userToLogin = mockManagedUsers.find(u => u.id === selectedUserId);

    if (userToLogin) {
      loginSuccess = actions.login(userToLogin.email, password, userToLogin.role, router.push);
    }
    
    if (loginSuccess) {
      toast({
        title: "Login Successful",
        description: `Welcome!`,
      });
    } else {
      toast({
        title: "Login Failed",
        description: "Invalid credentials or selection for this role.",
        variant: "destructive",
      });
    }
  };

  const selectedUser = mockManagedUsers.find(u => u.id === selectedUserId);
  const passwordPlaceholder = selectedUser ? `Password is "${selectedUser.passwordHash}"` : "Enter password";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
           <div className="mx-auto mb-4">
            <Image src="/SHLOGO.png" alt="Logo" height={70} width={150} data-ai-hint="logo" />
           </div>
          <CardTitle className="text-3xl font-headline capitalize">{userType} Login</CardTitle>
          <CardDescription className="text-lg">Access your SH IMS panel.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username-select" className="capitalize">Select {userType} User</Label>
               <Select value={selectedUserId || ''} onValueChange={setSelectedUserId}>
                  <SelectTrigger id="username-select" className="mt-1">
                      <SelectValue placeholder={`Select a ${userType}...`} />
                  </SelectTrigger>
                  <SelectContent>
                      {usersToList.map(u => (
                          <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                      ))}
                  </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={passwordPlaceholder}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="text-base pl-10"
                  disabled={!selectedUserId}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={!selectedUserId}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
             <Button 
                type="submit" 
                className="w-full text-lg py-6"
                disabled={!selectedUserId || !password}
              >
              <LogIn className="mr-2 h-5 w-5" /> Login
            </Button>
            <Button variant="link" size="sm" onClick={() => router.push('/login')}>
                Not a {userType}? Go back to role selection.
            </Button>
          </CardFooter>
        </form>
      </Card>
       <p className="mt-8 text-sm text-muted-foreground">
        &copy; 2025 SH IMS. Your trusted sales partner.
      </p>
    </div>
  );
}
