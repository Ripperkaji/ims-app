"use client";

import { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Landmark, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
import type { SupplierDueItem, ExpenseDueItem } from '@/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type PayableItem = SupplierDueItem | ExpenseDueItem;
type PaymentMethod = 'Cash' | 'Digital' | 'Hybrid';

interface SettlePayableDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: PayableItem | null;
  payableType: 'supplier' | 'expense' | '';
  onConfirm: (itemId: string, batchId: string | undefined, paymentDetails: { cashPaid: number, digitalPaid: number }) => void;
}

export default function SettlePayableDialog({ isOpen, onClose, item, payableType, onConfirm }: SettlePayableDialogProps) {
  const { toast } = useToast();
  
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [hybridCashAmount, setHybridCashAmount] = useState('');
  const [hybridDigitalAmount, setHybridDigitalAmount] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  
  const dueAmount = useMemo(() => {
    if (!item) return 0;
    if (payableType === 'supplier' && 'dueAmount' in item) {
      return item.dueAmount ?? 0;
    }
    if (payableType === 'expense' && 'amountDue' in item) {
      return item.amountDue ?? 0;
    }
    return 0;
  }, [item, payableType]);

  useEffect(() => {
    if (isOpen && item) {
      setPaymentAmount(formatCurrency(dueAmount));
      setPaymentMethod('Cash');
      setHybridCashAmount('');
      setHybridDigitalAmount('');
      setValidationError(null);
    } else {
      setPaymentAmount('');
    }
  }, [isOpen, item, dueAmount]);
  
  const totalHybridPayment = useMemo(() => {
    const cash = parseFloat(hybridCashAmount) || 0;
    const digital = parseFloat(hybridDigitalAmount) || 0;
    return cash + digital;
  }, [hybridCashAmount, hybridDigitalAmount]);

  useEffect(() => {
      if (paymentMethod !== 'Hybrid') {
          setValidationError(null);
          return;
      }
      if (totalHybridPayment > (dueAmount ?? 0) + 0.001) { // Allow for float inaccuracies
        setValidationError(`Total payment (NRP ${formatCurrency(totalHybridPayment)}) cannot exceed due amount.`);
      } else {
        setValidationError(null);
      }
  }, [totalHybridPayment, dueAmount, paymentMethod]);


  const handleConfirmSettle = () => {
    if (!item) return;
    
    const itemId = payableType === 'supplier' ? (item as SupplierDueItem).productId : (item as ExpenseDueItem).id;
    const batchId = payableType === 'supplier' ? (item as SupplierDueItem).batchId : undefined;
    
    let cashPaid = 0;
    let digitalPaid = 0;

    if (paymentMethod === 'Cash' || paymentMethod === 'Digital') {
        const numericPaymentAmount = parseFloat(paymentAmount);
        if (isNaN(numericPaymentAmount) || numericPaymentAmount <= 0) {
            toast({ title: "Invalid Amount", description: "Please enter a valid positive payment amount.", variant: "destructive" });
            return;
        }
        if (numericPaymentAmount > (dueAmount ?? 0) + 0.001) { // Allow for float inaccuracies
            toast({ title: "Overpayment", description: `Payment amount (NRP ${formatCurrency(numericPaymentAmount)}) cannot exceed the due amount of NRP ${formatCurrency(dueAmount ?? 0)}.`, variant: "destructive" });
            return;
        }
        if (paymentMethod === 'Cash') cashPaid = numericPaymentAmount;
        if (paymentMethod === 'Digital') digitalPaid = numericPaymentAmount;

    } else { // Hybrid
        cashPaid = parseFloat(hybridCashAmount) || 0;
        digitalPaid = parseFloat(hybridDigitalAmount) || 0;
        const totalPaid = cashPaid + digitalPaid;

        if (totalPaid <= 0) {
            toast({ title: "Invalid Amount", description: "Total hybrid payment must be a positive amount.", variant: "destructive" });
            return;
        }
        if (totalPaid > (dueAmount ?? 0) + 0.001) {
            toast({ title: "Overpayment", description: `Total payment (NRP ${formatCurrency(totalPaid)}) cannot exceed the due amount of NRP ${formatCurrency(dueAmount ?? 0)}.`, variant: "destructive" });
            setValidationError(`Total payment (NRP ${formatCurrency(totalPaid)}) cannot exceed due amount.`);
            return;
        }
    }

    onConfirm(itemId, batchId, { cashPaid, digitalPaid });
    onClose();
  };

  if (!isOpen || !item) return null;

  const itemName = payableType === 'supplier' ? (item as SupplierDueItem).productName : (item as ExpenseDueItem).description;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settle Due for {payableType === 'supplier' ? 'Vendor/Supplier' : 'Expense'}</DialogTitle>
          <DialogDescription>
            Settling due for: <strong>{itemName}</strong>.
            <br />
            Outstanding Amount: <strong className="text-destructive">NRP {formatCurrency(dueAmount)}</strong>
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div>
            <Label htmlFor="paymentMethod">Payment Method</Label>
            <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
              <SelectTrigger id="paymentMethod"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="Digital">Digital</SelectItem>
                <SelectItem value="Hybrid">Hybrid</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {paymentMethod !== 'Hybrid' ? (
            <div>
              <Label htmlFor="paymentAmount">Payment Amount</Label>
              <Input id="paymentAmount" type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} max={dueAmount} />
            </div>
          ) : (
            <div className="space-y-3 p-3 border rounded-md bg-muted/50">
              <h4 className="text-sm font-medium">Hybrid Payment Breakdown</h4>
               <div>
                  <Label htmlFor="hybridCashAmount">Cash Amount</Label>
                  <Input id="hybridCashAmount" type="number" value={hybridCashAmount} onChange={(e) => setHybridCashAmount(e.target.value)} placeholder="0.00" min="0" />
               </div>
               <div>
                  <Label htmlFor="hybridDigitalAmount">Digital Amount</Label>
                  <Input id="hybridDigitalAmount" type="number" value={hybridDigitalAmount} onChange={(e) => setHybridDigitalAmount(e.target.value)} placeholder="0.00" min="0" />
               </div>
               <div className="text-right text-sm font-semibold">
                   Total: NRP {formatCurrency(totalHybridPayment)}
               </div>
               {validationError && (
                  <Alert variant="destructive" className="p-2 text-xs">
                     <Info className="h-4 w-4" />
                     <AlertTitle className="font-semibold">Error</AlertTitle>
                     <AlertDescription>{validationError}</AlertDescription>
                  </Alert>
               )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleConfirmSettle} disabled={!!validationError}>
            <Landmark className="mr-2 h-4 w-4" /> Settle Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
