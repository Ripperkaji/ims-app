
"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { UserPlus, ShieldAlert, UserCheck } from 'lucide-react';
import type { UserRole } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface AddUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUserAdded: (name: string, role: UserRole) => void;
}

export default function AddUserDialog({ isOpen, onClose, onUserAdded }: AddUserDialogProps) {
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole | ''>('');
  const { toast } = useToast();

  const handleConfirmAddUser = () => {
    if (!name.trim()) {
      toast({ title: "Name Required", description: "Please enter a name for the user.", variant: "destructive" });
      return;
    }
    if (!role) {
      toast({ title: "Role Required", description: "Please select a role for the user.", variant: "destructive" });
      return;
    }
    onUserAdded(name, role);
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setRole('');
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
            <UserPlus className="h-5 w-5 text-primary" /> Add New User
          </DialogTitle>
          <DialogDescription>
            Enter the details for the new user. This is a mock interface.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-1.5">
            <Label htmlFor="userName">User Name</Label>
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
            <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
              <SelectTrigger id="userRole">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="staff">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4" /> Staff
                  </div>
                </SelectItem>
                <SelectItem value="admin">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4" /> Admin
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={handleDialogClose}>Cancel</Button>
          </DialogClose>
          <Button type="button" onClick={handleConfirmAddUser}>
            <UserPlus className="mr-2 h-4 w-4" /> Add User
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
