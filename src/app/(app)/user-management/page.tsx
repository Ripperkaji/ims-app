
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
import type { ManagedUser, UserRole } from '@/types';
import { mockManagedUsers, addManagedUser, editManagedUser, deleteManagedUser } from '@/lib/data';
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format, parseISO } from 'date-fns';

export default function UserManagementPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { toast } = useToast();

  const [managedUsers, setManagedUsers] = useState<ManagedUser[]>([]);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<ManagedUser | null>(null);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<ManagedUser | null>(null);
  
  useEffect(() => {
    if (user && user.role !== 'admin') {
      toast({ title: "Access Denied", description: "You do not have permission to view this page.", variant: "destructive" });
      router.push('/dashboard');
      return;
    }
    // Filter to only show staff users that can be managed
    setManagedUsers(mockManagedUsers.filter(u => u.role === 'staff').sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  }, [user, router, toast]);

  const handleOpenAddUserDialog = () => setIsAddUserDialogOpen(true);
  const handleCloseAddUserDialog = () => setIsAddUserDialogOpen(false);

  const handleOpenEditUserDialog = (user: ManagedUser) => {
    setUserToEdit(user);
    setIsEditUserDialogOpen(true);
  };
  const handleCloseEditUserDialog = () => {
    setUserToEdit(null);
    setIsEditUserDialogOpen(false);
  };
  
  const handleOpenDeleteDialog = (user: ManagedUser) => setUserToDelete(user);
  const handleCloseDeleteDialog = () => setUserToDelete(null);


  const handleAddUser = (name: string, email: string, contact: string, role: UserRole, password_plaintext: string) => {
    if (!user) return;
    const newUser = addManagedUser(name, role, password_plaintext, user.name, contact);
    if (newUser) {
      setManagedUsers(prev => [newUser, ...prev].filter(u => u.role === 'staff'));
      toast({ title: "User Added", description: `User ${name} has been added successfully.` });
      handleCloseAddUserDialog();
    } else {
      toast({ title: "Error", description: "Failed to add user. Email might already exist.", variant: "destructive" });
    }
  };
  
  const handleEditUser = (userId: string, newName: string, newContact: string) => {
    if (!user) return;
    const updatedUser = editManagedUser(userId, newName, user.name, newContact);
    if (updatedUser) {
        setManagedUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
        toast({ title: "User Updated", description: `User ${newName}'s details have been updated.` });
        handleCloseEditUserDialog();
    } else {
        toast({ title: "Error", description: "Failed to update user.", variant: "destructive" });
    }
  };
  
  const handleDeleteUser = () => {
    if (!user || !userToDelete) return;
    const success = deleteManagedUser(userToDelete.id, user.name);
    if (success) {
      setManagedUsers(prev => prev.filter(u => u.id !== userToDelete.id));
      toast({ title: "User Deleted", description: `User ${userToDelete.name} has been deleted.` });
    } else {
      toast({ title: "Error", description: "Failed to delete user.", variant: "destructive" });
    }
    handleCloseDeleteDialog();
  };


  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <>
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
                Add, edit, or remove staff accounts.
              </CardDescription>
            </div>
            <Button onClick={handleOpenAddUserDialog}>
              <UserPlus className="mr-2 h-4 w-4" /> Add New Staff
            </Button>
          </CardHeader>
          <CardContent>
            {managedUsers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {managedUsers.map((managedUser) => (
                    <TableRow key={managedUser.id}>
                      <TableCell className="font-medium">{managedUser.name}</TableCell>
                      <TableCell>{managedUser.email}</TableCell>
                      <TableCell>{managedUser.contactNumber}</TableCell>
                      <TableCell><Badge variant={managedUser.status === 'active' ? 'default' : 'secondary'}>{managedUser.status}</Badge></TableCell>
                      <TableCell>{format(parseISO(managedUser.createdAt), 'MMM dd, yyyy')}</TableCell>
                      <TableCell className="text-right space-x-2">
                         <Button variant="outline" size="icon" onClick={() => handleOpenEditUserDialog(managedUser)}>
                           <Edit className="h-4 w-4" />
                         </Button>
                         <Button variant="destructive" size="icon" onClick={() => handleOpenDeleteDialog(managedUser)}>
                            <Trash2 className="h-4 w-4" />
                         </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center py-8 text-muted-foreground">No staff users have been added yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
      
      <AddUserDialog 
        isOpen={isAddUserDialogOpen}
        onClose={handleCloseAddUserDialog}
        onUserAdded={handleAddUser}
        currentUserRole={user.role}
      />
      
      {userToEdit && (
        <EditUserDialog 
          isOpen={isEditUserDialogOpen}
          onClose={handleCloseEditUserDialog}
          userToEdit={userToEdit}
          onUserEdited={handleEditUser}
        />
      )}
      
      {userToDelete && (
        <AlertDialog open={!!userToDelete} onOpenChange={(open) => { if (!open) handleCloseDeleteDialog(); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the user account for <strong>{userToDelete.name}</strong>. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleCloseDeleteDialog}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive hover:bg-destructive/90">
                Delete User
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
