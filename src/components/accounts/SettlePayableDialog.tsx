
"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Landmark } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
import type { SupplierDueItem, ExpenseDueItem } from '@/types';

type PayableItem = SupplierDueItem | ExpenseDueItem;

interface SettlePayableDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: PayableItem | null;
  payableType: 'supplier' | 'expense' | '';
  onConfirm: (itemId: string, batchId: string | undefined, paymentDetails: { paymentAmount: number, method: 'Cash' | 'Digital' }) => void;
}

export default function SettlePayableDialog({ isOpen, onClose, item, payableType, onConfirm }: SettlePayableDialogProps) {
  const { toast } = useToast();
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Digital'>('Cash');
  
  const dueAmount = item?.dueAmount || 0;

  useEffect(() => {
    if (isOpen && item) {
      setPaymentAmount(formatCurrency(item.dueAmount));
    } else {
      setPaymentAmount('');
    }
  }, [isOpen, item]);

  const handleConfirmSettle = () => {
    const numericPaymentAmount = parseFloat(paymentAmount);
    if (!item || isNaN(numericPaymentAmount) || numericPaymentAmount <= 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid positive payment amount.", variant: "destructive" });
      return;
    }
    if (numericPaymentAmount > dueAmount + 0.001) { // Allow for small floating point inaccuracies
      toast({ title: "Overpayment", description: `Payment amount (NRP ${formatCurrency(numericPaymentAmount)}) cannot exceed the due amount of NRP ${formatCurrency(dueAmount)}.`, variant: "destructive" });
      return;
    }
    
    const itemId = payableType === 'supplier' ? (item as SupplierDueItem).productId : (item as ExpenseDueItem).id;
    const batchId = payableType === 'supplier' ? (item as SupplierDueItem).batchId : undefined;

    onConfirm(itemId, batchId, {
      paymentAmount: numericPaymentAmount,
      method: paymentMethod,
    });
    onClose();
  };

  if (!isOpen || !item) return null;

  const itemName = payableType === 'supplier' ? (item as SupplierDueItem).productName : (item as ExpenseDueItem).description;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settle Due for {payableType === 'supplier' ? 'Supplier' : 'Expense'}</DialogTitle>
          <DialogDescription>
            Settling due for: <strong>{itemName}</strong>.
            <br />
            Outstanding Amount: <strong className="text-destructive">NRP {formatCurrency(dueAmount)}</strong>
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div>
            <Label htmlFor="paymentAmount">Payment Amount</Label>
            <Input id="paymentAmount" type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} max={dueAmount} />
          </div>
          <div>
            <Label htmlFor="paymentMethod">Payment Method</Label>
            <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as 'Cash' | 'Digital')}>
              <SelectTrigger id="paymentMethod"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="Digital">Digital</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleConfirmSettle}>
            <Landmark className="mr-2 h-4 w-4" /> Settle Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
