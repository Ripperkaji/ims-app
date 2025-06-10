
"use client";

import { useEffect, useState } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { UserCog, UserPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { mockManagedUsers, addManagedUser } from "@/lib/data";
import type { ManagedUser, UserRole } from "@/types";
import { format } from 'date-fns';
import AddUserDialog from '@/components/accounts/AddUserDialog';

export default function UserManagementPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [managedUsersList, setManagedUsersList] = useState<ManagedUser[]>(mockManagedUsers);

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

  const handleUserAdded = (name: string, role: UserRole) => {
    if (!user) return;
    const newUser = addManagedUser(name, role, user.name);
    if (newUser) {
      setManagedUsersList([...mockManagedUsers]); // Refresh list from source
      toast({
        title: "User Added",
        description: `User '${newUser.name}' with role '${newUser.role}' has been added.`,
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to add user. Please check inputs.",
        variant: "destructive",
      });
    }
    setIsAddUserDialogOpen(false);
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
          <UserCog className="h-7 w-7 text-primary" /> User Management
        </h1>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5 text-primary" /> Manage Users
            </CardTitle>
            <CardDescription>
              View and add system users. Note: This is a mock interface for now.
            </CardDescription>
          </div>
          <Button onClick={() => setIsAddUserDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" /> Add New User
          </Button>
        </CardHeader>
        <CardContent>
          {managedUsersList.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Created At</TableHead>
                  {/* Add actions column later if needed */}
                </TableRow>
              </TableHeader>
              <TableBody>
                {managedUsersList.map((managedUser) => (
                  <TableRow key={managedUser.id}>
                    <TableCell className="font-medium">{managedUser.name}</TableCell>
                    <TableCell className="capitalize">{managedUser.role}</TableCell>
                    <TableCell>{format(new Date(managedUser.createdAt), 'MMM dd, yyyy HH:mm')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center py-4 text-muted-foreground">No managed users found.</p>
          )}
        </CardContent>
      </Card>

      {isAddUserDialogOpen && user && (
        <AddUserDialog
          isOpen={isAddUserDialogOpen}
          onClose={() => setIsAddUserDialogOpen(false)}
          onUserAdded={handleUserAdded}
        />
      )}
    </div>
  );
}
