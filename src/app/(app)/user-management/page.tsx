
"use client";

import { useEffect, useState } from 'react';
import { useAuthStore } from "@/stores/authStore";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { UserCog, UserPlus, Edit, Trash2 } from "lucide-react"; 
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

  const refreshUsers = () => {
     setManagedUsersList([...mockManagedUsers].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  };

  useEffect(() => {
    refreshUsers();
  }, []);

  useEffect(() => {
    if (user && user.role !== 'admin' && user.role !== 'super-admin') {
      toast({
        title: "Access Denied",
        description: "You do not have permission to view this page.",
        variant: "destructive"
      });
      router.push('/dashboard');
    }
  }, [user, router, toast]);

  const handleUserAdded = (name: string, email: string, contact: string, role: UserRole, password_plaintext: string) => {
    if (!user) return;
    const newUser = addManagedUser(name, email, contact, role, password_plaintext, user.name);
    if (newUser) {
      refreshUsers();
      toast({
        title: "User Added",
        description: `User '${newUser.name}' has been added.`,
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to add user. The email might already be in use.",
        variant: "destructive",
      });
    }
    setIsAddUserDialogOpen(false);
  };

  const handleOpenEditDialog = (userToEdit: ManagedUser) => {
    setUserToEdit(userToEdit);
    setIsEditUserDialogOpen(true);
  };

  const handleUserEdited = (userId: string, newName: string, newContact: string) => {
    if (!user) return;
    const updatedUser = editManagedUser(userId, newName, newContact, user.name);
    if (updatedUser) {
      refreshUsers();
      toast({
        title: "User Updated",
        description: `User '${updatedUser.name}' has been updated.`,
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to update user.",
        variant: "destructive",
      });
    }
    setIsEditUserDialogOpen(false);
    setUserToEdit(null);
  };

  const handleOpenDeleteConfirmationDialog = (userToDelete: ManagedUser) => {
    setUserToDelete(userToDelete);
    setIsDeleteUserConfirmationDialogOpen(true);
  };

  const handleConfirmDeleteUser = () => {
    if (!userToDelete || !user) return;
    const deletedUser = deleteManagedUser(userToDelete.id, user.name);
    if (deletedUser) {
      refreshUsers();
      toast({
        title: "User Deleted",
        description: `User '${deletedUser.name}' has been successfully deleted.`,
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to delete user. The user might not exist or cannot be deleted (e.g. Super Admin).",
        variant: "destructive",
      });
    }
    setIsDeleteUserConfirmationDialogOpen(false);
    setUserToDelete(null);
  };

  if (!user || (user.role !== 'admin' && user.role !== 'super-admin')) {
    return null;
  }
  
  const displayableUsers = managedUsersList.filter(u => u.id !== user.id); // Don't show self in list
  const canAddUsers = user.role === 'super-admin' || user.role === 'admin';

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
              View, add, edit, or delete users based on your role.
            </CardDescription>
          </div>
          {canAddUsers && (
            <Button onClick={() => setIsAddUserDialogOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" /> Add New User
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {displayableUsers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayableUsers.map((managedUser) => {
                  const canEdit = user.role === 'super-admin' || (user.role === 'admin' && managedUser.role === 'staff');
                  const canDelete = (user.role === 'super-admin' && managedUser.role !== 'super-admin') || (user.role === 'admin' && managedUser.role === 'staff');
                  return (
                    <TableRow key={managedUser.id}>
                      <TableCell className="font-medium">{managedUser.name}</TableCell>
                      <TableCell>{managedUser.email}</TableCell>
                      <TableCell>{managedUser.contactNumber}</TableCell>
                      <TableCell className="capitalize">{managedUser.role.replace('-',' ')}</TableCell>
                       <TableCell>
                        <Badge variant={managedUser.status === 'active' ? 'default' : 'secondary'}>{managedUser.status}</Badge>
                       </TableCell>
                      <TableCell>{format(new Date(managedUser.createdAt), 'MMM dd, yyyy')}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleOpenEditDialog(managedUser)} disabled={!canEdit}>
                          <Edit className="mr-2 h-3.5 w-3.5" /> Edit
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleOpenDeleteConfirmationDialog(managedUser)} disabled={!canDelete}>
                          <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center py-4 text-muted-foreground">No other users found. Add new users using the button above.</p>
          )}
        </CardContent>
      </Card>

      {isAddUserDialogOpen && user && (
        <AddUserDialog
          isOpen={isAddUserDialogOpen}
          onClose={() => setIsAddUserDialogOpen(false)}
          onUserAdded={handleUserAdded}
          currentUserRole={user.role}
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
              <AlertDialogTitle>Confirm User Deletion</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the user "<strong>{userToDelete.name}</strong>"? 
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
