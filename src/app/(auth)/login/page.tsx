
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn } from 'lucide-react';
import Image from "next/image";

export default function LoginPage() {
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
          <Button asChild variant="secondary" className="text-lg py-6">
            <Link href="/login/staff">
               <LogIn className="mr-2 h-5 w-5"/> Staff Login
            </Link>
          </Button>
        </CardContent>
      </Card>
      <p className="mt-8 text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} SH IMS. All rights reserved.
      </p>
    </div>
  );
}
