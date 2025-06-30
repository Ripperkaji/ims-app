
"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarDays, FilePenLine, ReceiptText, Edit } from 'lucide-react';
import { format, parseISO } from "date-fns";
import type { Expense, ExpenseCategory } from '@/types';
import { EXPENSE_CATEGORIES } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';

interface EditExpenseDialogProps {
  expense: Expense | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmEditExpense: (updatedExpense: Expense) => void;
}

export default function EditExpenseDialog({ expense, isOpen, onClose, onConfirmEditExpense }: EditExpenseDialogProps) {
  const { toast } = useToast();
  const [editDate, setEditDate] = useState<Date | undefined>(new Date());
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editTotalAmount, setEditTotalAmount] = useState('');

  useEffect(() => {
    if (expense && isOpen) {
      setEditDate(expense.date ? parseISO(expense.date) : new Date());
      setEditDescription(expense.description);
      setEditCategory(expense.category);
      setEditTotalAmount(expense.amount.toString());
    }
  }, [expense, isOpen]);

  const handleConfirm = () => {
    if (!expense) return;
    if (!editDate || !editDescription.trim() || !editCategory.trim() || !editTotalAmount) {
      toast({ title: "Missing Information", description: "Please fill all fields.", variant: "destructive" });
      return;
    }
    const numericAmount = parseFloat(editTotalAmount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid positive amount.", variant: "destructive" });
      return;
    }
     if (["Product Damage", "Tester Allocation"].includes(editCategory.trim()) && expense.category !== editCategory.trim()) {
        toast({ title: "Invalid Category", description: `Category '${editCategory.trim()}' is reserved for system entries and cannot be manually assigned during edit.`, variant: "destructive" });
        return;
    }


    const updatedExpenseData: Expense = {
      ...expense,
      date: editDate.toISOString(),
      description: editDescription.trim(),
      category: editCategory.trim(),
      amount: numericAmount,
    };
    
    onConfirmEditExpense(updatedExpenseData);
    onClose();
  };

  const handleDialogClose = () => {
    onClose();
  };

  if (!isOpen || !expense) return null;
  
  const isSystemCategory = ["Product Damage", "Tester Allocation"].includes(expense.category);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleDialogClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-primary" /> Edit Expense
          </DialogTitle>
          <DialogDescription>
            Modify the details for the expense: "{expense.description.substring(0,30)}...".
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
          <div className="space-y-1.5">
            <Label htmlFor="editExpenseDate">Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className="w-full justify-start text-left font-normal h-9"
                >
                  <CalendarDays className="mr-2 h-4 w-4" />
                  {editDate ? format(editDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={editDate} onSelect={setEditDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="space-y-1.5">
            <Label htmlFor="editExpenseCategory">Category</Label>
            {isSystemCategory ? (
                <Input
                    id="editExpenseCategory"
                    value={editCategory}
                    className="h-9 bg-muted/50"
                    disabled
                />
            ) : (
                <Select 
                    value={editCategory} 
                    onValueChange={(value) => setEditCategory(value)}
                >
                    <SelectTrigger id="editExpenseCategory" className="h-9">
                        <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                        {EXPENSE_CATEGORIES.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}
            {isSystemCategory && (
                <p className="text-xs text-muted-foreground">System-generated categories cannot be changed.</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="editExpenseDescription">Description</Label>
            <Textarea
              id="editExpenseDescription"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Detailed description..."
              rows={3}
              required
            />
          </div>
          
          <div className="space-y-1.5">
            <Label htmlFor="editExpenseTotalAmount">Total Amount (NRP)</Label>
            <div className="relative">
              <ReceiptText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="editExpenseTotalAmount"
                type="number"
                value={editTotalAmount}
                onChange={(e) => setEditTotalAmount(e.target.value)}
                placeholder="E.g., 50.00"
                step="0.01"
                min="0.01"
                className="pl-10 h-9"
                required
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button type="button" variant="outline" onClick={handleDialogClose}>Cancel</Button></DialogClose>
          <Button type="button" onClick={handleConfirm}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
