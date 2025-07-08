
"use client";

import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Eye, EyeOff, LogIn, Mail, KeyRound } from 'lucide-react';
import type { UserRole } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Image from "next/image";


interface LoginFormProps {
  userType: 'admin' | 'staff';
}

export default function LoginForm({ userType }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { actions } = useAuthStore();
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    actions.login({
      id: `${userType}-${Math.random()}`,
      name: email, 
      email: email,
      role: userType as UserRole,
    }, router.push);
    toast({
      title: "Login Successful",
      description: `Welcome, ${userType}!`,
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
           <div className="mx-auto mb-4">
            <Image src="/SHLOGO.png" alt="Logo" height={70} width={150} />
           </div>
          <CardTitle className="text-3xl font-headline">
            {userType === 'admin' ? 'Admin Login' : 'Staff Login'}
          </CardTitle>
          <CardDescription className="text-lg">
            Access your Inventory Management System.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
               <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="text-base pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="text-base pl-10"
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
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
             <Button 
                type="submit" 
                className="w-full text-lg py-6"
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
        &copy; {new Date().getFullYear()} SH IMS. All rights reserved.
      </p>
    </div>
  );
}
