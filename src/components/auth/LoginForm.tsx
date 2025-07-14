
"use client";

import { useState } from 'react';
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
  // Common state
  const { actions } = useAuthStore();
  const { toast } = useToast();
  const router = useRouter();

  // State for forms
  const [selectedStaffName, setSelectedStaffName] = useState<string | null>(null);
  const [password, setPassword] = useState(''); // for staff AND admin
  const [showPassword, setShowPassword] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let loginSuccess = false;

    if (userType === 'admin') {
      if (!selectedAdmin) {
        toast({ title: "Selection Required", description: "Please select an admin user to login.", variant: "destructive" });
        return;
      }
      if (!password) {
        toast({ title: "Password Required", description: "Please enter your password.", variant: "destructive" });
        return;
      }
      const adminToLogin = mockManagedUsers.find(u => u.id === selectedAdmin && u.role === 'admin');
      if (adminToLogin) {
        loginSuccess = actions.login(adminToLogin.email, password, 'admin', router.push);
      }
    } else { // staff
       if (!selectedStaffName) {
        toast({ title: "Selection Required", description: "Please select a staff user to login.", variant: "destructive" });
        return;
      }
      loginSuccess = actions.login(selectedStaffName, password, 'staff', router.push);
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

  // Admin-specific Login Form
  if (userType === 'admin') {
    const adminUsers = mockManagedUsers.filter(u => u.role === 'admin');
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 flex items-center justify-center bg-primary/10 rounded-full">
              <UserIcon className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-3xl font-headline">Admin Login</CardTitle>
            <CardDescription className="text-lg">Access your SH IMS admin panel.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              <div className="space-y-2 text-left">
                <Label>Select Admin User</Label>
                <div className="grid grid-cols-2 gap-4 pt-1">
                  {adminUsers.map(admin => (
                    <Button
                      key={admin.id}
                      type="button"
                      variant={selectedAdmin === admin.id ? 'default' : 'outline'}
                      onClick={() => setSelectedAdmin(admin.id)}
                      className="py-6 text-base"
                    >
                      {admin.name}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="text-base pl-10"
                        disabled={!selectedAdmin}
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={!selectedAdmin}
                        tabIndex={-1}
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 pt-4">
              <Button type="submit" className="w-full text-lg py-6" disabled={!selectedAdmin || !password}>
                <LogIn className="mr-2 h-5 w-5" /> Login
              </Button>
              <Button variant="link" size="sm" onClick={() => router.push('/login')}>
                Back to role selection
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

  // Staff Login Form (the original design)
  const staffUsers = mockManagedUsers.filter(u => u.role === 'staff');
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
           <div className="mx-auto mb-4">
            <Image src="/SHLOGO.png" alt="Logo" height={70} width={150} />
           </div>
          <CardTitle className="text-3xl font-headline">Staff Login</CardTitle>
          <CardDescription className="text-lg">Access your Inventory Management System.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
               <Select value={selectedStaffName || ''} onValueChange={setSelectedStaffName}>
                  <SelectTrigger id="staff-user-select" className="mt-1">
                      <SelectValue placeholder="Select your username" />
                  </SelectTrigger>
                  <SelectContent>
                      {staffUsers.map(staff => (
                          <SelectItem key={staff.id} value={staff.name}>{staff.name}</SelectItem>
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
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="text-base pl-10"
                  disabled={!selectedStaffName}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={!selectedStaffName}
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
                disabled={!selectedStaffName || !password}
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
