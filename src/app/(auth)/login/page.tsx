"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Zap } from "lucide-react";

export default function LoginSelectionPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Zap size={32} />
          </div>
          <CardTitle className="text-3xl font-headline">Welcome to SH IMS</CardTitle>
          <CardDescription className="text-lg">Please select your role to login.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Link href="/login/admin" passHref legacyBehavior>
            <Button variant="default" size="lg" className="w-full text-lg py-6">
              Admin Login
            </Button>
          </Link>
          <Link href="/login/staff" passHref legacyBehavior>
            <Button variant="secondary" size="lg" className="w-full text-lg py-6">
              Staff Login
            </Button>
          </Link>
        </CardContent>
      </Card>
      <p className="mt-8 text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} SH IMS. All rights reserved.
      </p>
    </div>
  );
}
