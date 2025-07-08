
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
import { UserPlus, KeyRound } from 'lucide-react';
import type { UserRole } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface AddUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUserAdded: (name: string, contact: string, role: UserRole, password_plaintext: string) => void;
}

export default function AddUserDialog({ isOpen, onClose, onUserAdded }: AddUserDialogProps) {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');
  const { toast } = useToast();

  const handleConfirmAddUser = () => {
    if (!name.trim()) { toast({ title: "Name Required", variant: "destructive" }); return; }
    if (!contact.trim()) { toast({ title: "Contact Required", variant: "destructive" }); return; }
    if (!password.trim()) { toast({ title: "Password Required", variant: "destructive"}); return; }
    
    // Role is always 'staff' when adding via this dialog
    onUserAdded(name, contact, 'staff', password);
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setContact('');
    setPassword('');
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
            Enter the details for the new staff account.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-1.5">
            <Label htmlFor="userName">Username</Label>
            <Input id="userName" value={name} onChange={(e) => setName(e.target.value)} placeholder="E.g., jane.doe" autoFocus />
          </div>
           <div className="space-y-1.5">
            <Label htmlFor="userContact">Contact Number</Label>
            <Input id="userContact" type="tel" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="98XXXXXXXX" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="defaultPassword">Set Initial Password</Label>
            <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="defaultPassword" type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter initial password" className="pl-10"/>
            </div>
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
