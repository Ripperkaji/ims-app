
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { initializeAppWithSuperAdmin } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Eye, EyeOff, Building, User, Mail, Phone, KeyRound } from 'lucide-react';
import Image from "next/image";

const setupSchema = z.object({
  companyName: z.string().min(2, "Company name is required"),
  superAdminName: z.string().min(2, "Your name is required"),
  superAdminEmail: z.string().email("Please enter a valid email address"),
  superAdminContact: z.string().min(10, "Please enter a valid contact number"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

type SetupFormValues = z.infer<typeof setupSchema>;

export default function InitializePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<SetupFormValues>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      companyName: '',
      superAdminName: '',
      superAdminEmail: '',
      superAdminContact: '',
      password: '',
    },
  });

  const onSubmit = (data: SetupFormValues) => {
    const result = initializeAppWithSuperAdmin({
      companyName: data.companyName,
      superAdminName: data.superAdminName,
      superAdminEmail: data.superAdminEmail,
      superAdminContact: data.superAdminContact,
      superAdminPassword_plaintext: data.password,
    });

    if (result) {
      toast({
        title: "Setup Complete!",
        description: "Your application is ready. Please log in as Super Admin.",
      });
      router.push('/login');
    } else {
      toast({
        title: "Setup Failed",
        description: "The application might already be initialized.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <Card className="w-full max-w-lg shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <Image src="/SHLOGO.png" alt="Logo" height={70} width={150} />
          </div>
          <CardTitle className="text-3xl font-headline">Welcome to SH IMS Setup</CardTitle>
          <CardDescription className="text-lg">Let's get your business set up.</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Your Company Inc." {...field} className="pl-10" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="superAdminName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Name (Super Admin)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="E.g., John Doe" {...field} className="pl-10" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="superAdminEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Login Email</FormLabel>
                    <FormControl>
                       <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input type="email" placeholder="you@company.com" {...field} className="pl-10" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="superAdminContact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Number</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input type="tel" placeholder="98XXXXXXXX" {...field} className="pl-10" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Set Password</FormLabel>
                    <FormControl>
                       <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input type={showPassword ? "text" : "password"} placeholder="********" {...field} className="pl-10" />
                         <Button
                            type="button" variant="ghost" size="icon"
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7"
                            onClick={() => setShowPassword(!showPassword)}
                         >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full text-lg py-6" disabled={form.formState.isSubmitting}>
                Complete Setup
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
      <p className="mt-8 text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} SH IMS. All rights reserved.
      </p>
    </div>
  );
}
