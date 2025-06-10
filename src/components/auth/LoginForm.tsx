
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Eye, EyeOff, LogIn, UserCircle, Zap, KeyRound } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

interface LoginFormProps {
  role: UserRole;
  adminUsernames?: string[];
}

export default function LoginForm({ role, adminUsernames }: LoginFormProps) {
  const [internalUsername, setInternalUsername] = useState(''); // For staff or general admin input
  const [selectedAdminUsername, setSelectedAdminUsername] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();

  const fixedAdminPasswords: Record<string, string> = {
    "NPS": "12345",
    "SKG": "12345",
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let finalUsername = '';
    let expectedPassword = '';

    if (role === 'admin') {
      if (!selectedAdminUsername) {
        toast({ title: "Error", description: "Please select an admin username.", variant: "destructive" });
        return;
      }
      finalUsername = selectedAdminUsername;
      expectedPassword = fixedAdminPasswords[selectedAdminUsername];
    } else { // staff
      finalUsername = internalUsername;
      // For staff, password validation would typically happen against a stored (hashed) password.
      // For this mock, we'll allow any password if the username is recognized by AuthContext's simulated login.
      // Or, if you want to enforce a mock staff password:
      // expectedPassword = "staffpassword"; // Example
    }

    if (!finalUsername) {
        toast({ title: "Error", description: "Username is required.", variant: "destructive"});
        return;
    }
    if (!password) {
      toast({ title: "Error", description: "Password is required.", variant: "destructive" });
      return;
    }

    // Simulated authentication
    if (role === 'admin' && password !== expectedPassword) {
      toast({ title: "Login Failed", description: "Incorrect password for admin.", variant: "destructive" });
      return;
    }
    // For staff, the AuthContext's login function might handle its own simple validation,
    // or you could add a check here if you had a list of staff and their (mock) passwords.

    login(role, finalUsername); // AuthContext's login now just takes role and name
    toast({ title: "Login Successful", description: `Welcome back, ${finalUsername}!`,});
  };

  const handleAdminUsernameSelect = (adminName: string) => {
    setSelectedAdminUsername(adminName);
    setPassword(''); // Clear password when admin changes
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
           <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
            {role === 'admin' ? <UserCircle size={32} /> : <Zap size={32} />}
          </div>
          <CardTitle className="text-3xl font-headline">
            {role === 'admin' ? 'Admin Login' : 'Staff Login'}
          </CardTitle>
          <CardDescription className="text-lg">
            Access your VapeTrack {role} panel.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {role === 'admin' && adminUsernames && adminUsernames.length > 0 && (
              <div className="space-y-2">
                <Label>Select Admin User</Label>
                <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                  {adminUsernames.map(adminName => (
                    <Button
                      key={adminName}
                      type="button"
                      variant={selectedAdminUsername === adminName ? "default" : "outline"}
                      onClick={() => handleAdminUsernameSelect(adminName)}
                      className="w-full justify-center"
                    >
                      {adminName}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {role === 'staff' && (
              <div className="space-y-2">
                <Label htmlFor="username">Staff Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your staff username"
                  value={internalUsername}
                  onChange={(e) => setInternalUsername(e.target.value)}
                  required
                  className="text-base"
                />
              </div>
            )}
            
            { (role === 'staff' || (role === 'admin' && selectedAdminUsername)) && (
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="********"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="text-base"
                    autoFocus={role === 'admin' && !!selectedAdminUsername}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
             <Button 
                type="submit" 
                className="w-full text-lg py-6"
                disabled={role === 'admin' && !selectedAdminUsername}
              >
              <LogIn className="mr-2 h-5 w-5" /> Login
            </Button>
            <Link href="/login" passHref legacyBehavior>
                <Button variant="link" className="text-sm">
                    Back to role selection
                </Button>
            </Link>
          </CardFooter>
        </form>
      </Card>
       <p className="mt-8 text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} VapeTrack. Your trusted sales partner.
      </p>
    </div>
  );
}
