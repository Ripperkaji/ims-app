
"use client";

import { useState } from 'react';
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
import { UserPlus, KeyRound, UserCheck } from 'lucide-react';
import type { UserRole } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface AddUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUserAdded: (name: string, role: UserRole, defaultPassword: string) => void;
}

export default function AddUserDialog({ isOpen, onClose, onUserAdded }: AddUserDialogProps) {
  const [name, setName] = useState('');
  const [defaultPassword, setDefaultPassword] = useState('');
  const { toast } = useToast();

  const handleConfirmAddUser = () => {
    if (!name.trim()) {
      toast({ title: "Name Required", description: "Please enter a name for the staff user.", variant: "destructive" });
      return;
    }
    if (!defaultPassword.trim()) {
        toast({ title: "Password Required", description: "Please enter a default password for the staff user.", variant: "destructive"});
        return;
    }
    // Role is fixed to 'staff' as per new requirements
    onUserAdded(name, 'staff', defaultPassword);
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setDefaultPassword('');
  };

  const handleDialogClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleDialogClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" /> Add New Staff User
          </DialogTitle>
          <DialogDescription>
            Enter the details for the new staff user.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-1.5">
            <Label htmlFor="userName">Staff User Name</Label>
            <Input
              id="userName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="E.g., John Staff"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="userRole">Role</Label>
             <Input
              id="userRole"
              value="Staff"
              disabled // Role is fixed to Staff
              className="bg-muted/50"
            />
            <p className="text-xs text-muted-foreground">Admins can only add Staff users.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="defaultPassword">Default Password</Label>
            <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                id="defaultPassword"
                type="text" // Show password for admin to set
                value={defaultPassword}
                onChange={(e) => setDefaultPassword(e.target.value)}
                placeholder="Enter initial password"
                className="pl-10"
                />
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={handleDialogClose}>Cancel</Button>
          </DialogClose>
          <Button type="button" onClick={handleConfirmAddUser}>
            <UserPlus className="mr-2 h-4 w-4" /> Add Staff User
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
