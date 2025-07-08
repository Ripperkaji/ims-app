
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
import { UserPlus, KeyRound } from 'lucide-react';
import type { UserRole } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface AddUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUserAdded: (name: string, email: string, contact: string, role: UserRole, password_plaintext: string) => void;
  currentUserRole: UserRole;
}

export default function AddUserDialog({ isOpen, onClose, onUserAdded, currentUserRole }: AddUserDialogProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole | ''>(currentUserRole === 'admin' ? 'staff' : '');
  const { toast } = useToast();

  const handleConfirmAddUser = () => {
    if (!name.trim()) { toast({ title: "Name Required", variant: "destructive" }); return; }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast({ title: "Valid Email Required", variant: "destructive" }); return; }
    if (!contact.trim()) { toast({ title: "Contact Required", variant: "destructive" }); return; }
    if (!role) { toast({ title: "Role Required", variant: "destructive" }); return; }
    if (!password.trim()) { toast({ title: "Password Required", variant: "destructive"}); return; }
    
    onUserAdded(name, email, contact, role, password);
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setContact('');
    setPassword('');
    setRole(currentUserRole === 'admin' ? 'staff' : '');
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
            Enter the details for the new user. They will be sent a (simulated) verification email.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-1.5">
            <Label htmlFor="userName">Full Name</Label>
            <Input id="userName" value={name} onChange={(e) => setName(e.target.value)} placeholder="E.g., Jane Doe" autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="userEmail">Email</Label>
            <Input id="userEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane.doe@example.com" />
          </div>
           <div className="space-y-1.5">
            <Label htmlFor="userContact">Contact Number</Label>
            <Input id="userContact" type="tel" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="98XXXXXXXX" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="userRole">Role</Label>
             <Select 
                value={role} 
                onValueChange={(value) => setRole(value as UserRole)}
                disabled={currentUserRole === 'admin'}
            >
              <SelectTrigger id="userRole">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {currentUserRole === 'super-admin' && <SelectItem value="admin">Admin</SelectItem>}
                <SelectItem value="staff">Staff</SelectItem>
              </SelectContent>
            </Select>
            {currentUserRole === 'admin' && <p className="text-xs text-muted-foreground">Admins can only add Staff users.</p>}
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
