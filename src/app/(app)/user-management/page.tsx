
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
import AddUserDialog from '@/components/accounts/AddUserDialog'; // Re-using for staff addition

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

  const handleUserAdded = (name: string, role: UserRole, defaultPassword: string) => {
    if (!user) return;
    // Role is forced to 'staff' by AddUserDialog and addManagedUser function
    const newUser = addManagedUser(name, 'staff', defaultPassword, user.name);
    if (newUser) {
      setManagedUsersList([...mockManagedUsers].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())); // Refresh list from source & sort
      toast({
        title: "Staff User Added",
        description: `Staff user '${newUser.name}' has been added.`,
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to add staff user. Admins cannot add other admins.",
        variant: "destructive",
      });
    }
    setIsAddUserDialogOpen(false);
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  // Filter out any potential admin users from the display list, as they are fixed.
  const displayableUsers = managedUsersList.filter(u => u.role === 'staff');

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
              <UserCog className="h-5 w-5 text-primary" /> Manage Staff Users
            </CardTitle>
            <CardDescription>
              View and add staff users. Admins are fixed and cannot be managed here.
            </CardDescription>
          </div>
          <Button onClick={() => setIsAddUserDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" /> Add New Staff
          </Button>
        </CardHeader>
        <CardContent>
          {displayableUsers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Created At</TableHead>
                  {/* Add actions column later if needed (e.g., edit staff, reset password) */}
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayableUsers.map((managedUser) => (
                  <TableRow key={managedUser.id}>
                    <TableCell className="font-medium">{managedUser.name}</TableCell>
                    <TableCell className="capitalize">{managedUser.role}</TableCell>
                    <TableCell>{format(new Date(managedUser.createdAt), 'MMM dd, yyyy HH:mm')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center py-4 text-muted-foreground">No staff users found. Add new staff using the button above.</p>
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
