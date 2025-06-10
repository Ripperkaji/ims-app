
"use client";

import { useEffect, useState } from 'react';
import { useAuthStore } from "@/stores/authStore";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { UserCog, UserPlus, Edit, Trash2 } from "lucide-react"; 
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { mockManagedUsers, addManagedUser, editManagedUser, deleteManagedUser } from "@/lib/data"; 
import type { ManagedUser, UserRole } from "@/types";
import { format } from 'date-fns';
import AddUserDialog from '@/components/accounts/AddUserDialog';
import EditUserDialog from '@/components/accounts/EditUserDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"; 

export default function UserManagementPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<ManagedUser | null>(null);
  const [managedUsersList, setManagedUsersList] = useState<ManagedUser[]>([]);

  const [userToDelete, setUserToDelete] = useState<ManagedUser | null>(null); 
  const [isDeleteUserConfirmationDialogOpen, setIsDeleteUserConfirmationDialogOpen] = useState(false); 

  useEffect(() => {
    setManagedUsersList([...mockManagedUsers].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  }, []);


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
    const newUser = addManagedUser(name, 'staff', defaultPassword, user.name); // Role is fixed to staff here
    if (newUser) {
      setManagedUsersList(prevUsers => [...prevUsers, newUser].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      toast({
        title: "Staff User Added",
        description: `Staff user '${newUser.name}' has been added.`,
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to add staff user. Ensure name and password are provided.",
        variant: "destructive",
      });
    }
    setIsAddUserDialogOpen(false);
  };

  const handleOpenEditDialog = (staffUser: ManagedUser) => {
    setUserToEdit(staffUser);
    setIsEditUserDialogOpen(true);
  };

  const handleUserEdited = (userId: string, newName: string) => {
    if (!user) return;
    const updatedUser = editManagedUser(userId, newName, user.name);
    if (updatedUser) {
      setManagedUsersList(prevUsers => 
        prevUsers.map(u => u.id === userId ? updatedUser : u)
                 .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      );
      toast({
        title: "Staff User Updated",
        description: `Staff user '${updatedUser.name}' has been updated.`,
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to update staff user. Ensure the new name is valid.",
        variant: "destructive",
      });
    }
    setIsEditUserDialogOpen(false);
    setUserToEdit(null);
  };

  const handleOpenDeleteConfirmationDialog = (staffUser: ManagedUser) => {
    setUserToDelete(staffUser);
    setIsDeleteUserConfirmationDialogOpen(true);
  };

  const handleConfirmDeleteUser = () => {
    if (!userToDelete || !user) return;

    const deletedUser = deleteManagedUser(userToDelete.id, user.name);
    if (deletedUser) {
      setManagedUsersList(prevUsers => prevUsers.filter(u => u.id !== userToDelete.id));
      toast({
        title: "Staff User Deleted",
        description: `Staff user '${deletedUser.name}' has been successfully deleted.`,
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to delete staff user. The user might not exist or cannot be deleted.",
        variant: "destructive",
      });
    }
    setIsDeleteUserConfirmationDialogOpen(false);
    setUserToDelete(null);
  };


  if (!user || user.role !== 'admin') {
    return null;
  }

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
              View, add, edit, or delete staff users. Admins are fixed and cannot be managed here.
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
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayableUsers.map((managedStaffUser) => (
                  <TableRow key={managedStaffUser.id}>
                    <TableCell className="font-medium">{managedStaffUser.name}</TableCell>
                    <TableCell className="capitalize">{managedStaffUser.role}</TableCell>
                    <TableCell>{format(new Date(managedStaffUser.createdAt), 'MMM dd, yyyy HH:mm')}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleOpenEditDialog(managedStaffUser)}>
                        <Edit className="mr-2 h-3.5 w-3.5" /> Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleOpenDeleteConfirmationDialog(managedStaffUser)}>
                        <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                      </Button>
                    </TableCell>
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

      {isEditUserDialogOpen && userToEdit && (
        <EditUserDialog
          isOpen={isEditUserDialogOpen}
          onClose={() => { setIsEditUserDialogOpen(false); setUserToEdit(null); }}
          userToEdit={userToEdit}
          onUserEdited={handleUserEdited}
        />
      )}

      {isDeleteUserConfirmationDialogOpen && userToDelete && (
        <AlertDialog open={isDeleteUserConfirmationDialogOpen} onOpenChange={setIsDeleteUserConfirmationDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Staff User Deletion</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the staff user "<strong>{userToDelete.name}</strong>"? 
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {setIsDeleteUserConfirmationDialogOpen(false); setUserToDelete(null);}}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDeleteUser} className="bg-destructive hover:bg-destructive/90">
                Confirm Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
