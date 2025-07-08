
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn } from 'lucide-react';
import Image from "next/image";
import { mockManagedUsers } from '@/lib/data';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function LoginPage() {
  const hasStaffUsers = mockManagedUsers.some(user => user.role === 'staff');

  const StaffButtonContent = () => (
    <>
      <LogIn className="mr-2 h-5 w-5"/> Staff Login
    </>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
           <div className="mx-auto mb-4">
             <Image src="/SHLOGO.png" alt="Logo" height={70} width={150} />
           </div>
          <CardTitle className="text-3xl font-headline">SH IMS Portal</CardTitle>
          <CardDescription className="text-lg">
            Inventory & Sales Management
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col space-y-4">
          <Button asChild className="text-lg py-6">
            <Link href="/login/admin">
              <LogIn className="mr-2 h-5 w-5"/> Admin Login
            </Link>
          </Button>
          
          {hasStaffUsers ? (
            <Button asChild variant="secondary" className="text-lg py-6">
              <Link href="/login/staff">
                <StaffButtonContent />
              </Link>
            </Button>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  {/* Wrapper div for disabled button */}
                  <div className="w-full">
                    <Button variant="outline" className="text-lg py-6 w-full" disabled>
                      <StaffButtonContent />
                    </Button>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>No staff accounts exist. Please log in as an Admin to create one.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

        </CardContent>
      </Card>
      <p className="mt-8 text-sm text-muted-foreground">
        &copy; 2025 SH IMS. Your trusted sales partner.
      </p>
    </div>
  );
}
