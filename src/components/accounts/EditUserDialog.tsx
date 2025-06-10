
"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { UserCog, Edit } from 'lucide-react';
import type { ManagedUser } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface EditUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userToEdit: ManagedUser | null;
  onUserEdited: (userId: string, newName: string) => void;
}

export default function EditUserDialog({ isOpen, onClose, userToEdit, onUserEdited }: EditUserDialogProps) {
  const [name, setName] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (userToEdit && isOpen) {
      setName(userToEdit.name);
    } else if (!isOpen) {
      setName(''); // Reset name when dialog is closed or no user
    }
  }, [userToEdit, isOpen]);

  const handleConfirmEditUser = () => {
    if (!userToEdit) {
      toast({ title: "Error", description: "No user selected for editing.", variant: "destructive" });
      return;
    }
    if (!name.trim()) {
      toast({ title: "Name Required", description: "Please enter a name for the staff user.", variant: "destructive" });
      return;
    }
    onUserEdited(userToEdit.id, name.trim());
    // Do not resetForm here, parent will close and useEffect will reset
  };

  const handleDialogClose = () => {
    // Parent handles resetting userToEdit, which triggers useEffect to clear name
    onClose();
  };

  if (!isOpen || !userToEdit) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleDialogClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-primary" /> Edit Staff User
          </DialogTitle>
          <DialogDescription>
            Modify the details for staff user: {userToEdit.name}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-1.5">
            <Label htmlFor="editUserName">Staff User Name</Label>
            <Input
              id="editUserName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="E.g., John Staff"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="editUserRole">Role</Label>
            <Input
              id="editUserRole"
              value="Staff" // Role is fixed to Staff
              disabled
              className="bg-muted/50"
            />
             <p className="text-xs text-muted-foreground">Role cannot be changed.</p>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={handleDialogClose}>Cancel</Button>
          </DialogClose>
          <Button type="button" onClick={handleConfirmEditUser}>
            <Edit className="mr-2 h-4 w-4" /> Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
