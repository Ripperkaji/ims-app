
"use client";

import { useEffect, useState } from 'react';
import { useAuthStore } from "@/stores/authStore";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Banknote, Landmark, Edit } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { mockLogEntries, mockProducts, mockExpenses } from "@/lib/data";
import type { SupplierDueItem, ExpenseDueItem, AcquisitionPaymentMethod, Expense } from "@/types";
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import SettlePayableDialog from '@/components/accounts/SettlePayableDialog';
import { addLogEntry } from '@/lib/data';

type PayableType = 'supplier' | 'expense' | '';
type PayableItem = SupplierDueItem | ExpenseDueItem;

export default function AccountsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { toast } = useToast();
  const [selectedPayableType, setSelectedPayableType] = useState<PayableType>('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [itemToSettle, setItemToSettle] = useState<PayableItem | null>(null);
  const [settlePayableType, setSettlePayableType] = useState<PayableType>('');
  const [isSettleDialogOpen, setIsSettleDialogOpen] = useState(false);

  useEffect(() => {
    if (user && user.role !== 'admin') {
      toast({
        title: "Access Denied",
        description: "You do not have permission to view this page.",
        variant: "destructive"
      });
      router.push('/dashboard');
    }
  }, [user, router, toast]);

  const supplierDueItems: SupplierDueItem[] = [];
  mockProducts.forEach(product => {
    product.acquisitionHistory.forEach(batch => {
      if (batch.dueToSupplier > 0) {
        supplierDueItems.push({
          productId: product.id,
          productName: `${product.name}${product.modelName ? ` (${product.modelName})` : ''}${product.flavorName ? ` - ${product.flavorName}` : ''}`,
          batchId: batch.batchId,
          acquisitionDate: format(new Date(batch.date), 'MMM dd, yyyy HH:mm'),
          dueAmount: batch.dueToSupplier,
          supplierName: batch.supplierName,
          paymentMethod: batch.paymentMethod,
          totalBatchCost: batch.totalBatchCost,
          cashPaidForBatch: batch.cashPaid,
          digitalPaidForBatch: batch.digitalPaid,
        });
      }
    });
  });
  supplierDueItems.sort((a, b) => new Date(b.acquisitionDate).getTime() - new Date(a.acquisitionDate).getTime());

  const expenseDueItems: ExpenseDueItem[] = mockExpenses
    .filter(e => e.amountDue && e.amountDue > 0)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());


  if (!user || user.role !== 'admin') {
    return null;
  }

  const totalSupplierDue = supplierDueItems.reduce((sum, item) => sum + item.dueAmount, 0);
  const totalExpenseDue = expenseDueItems.reduce((sum, item) => sum + item.dueAmount, 0);

  const getSupplierPaymentDetails = (item: SupplierDueItem): string => {
    if (!item.paymentMethod) return 'N/A';

    let details = `Method: ${item.paymentMethod}. Batch Cost: NRP ${formatCurrency(item.totalBatchCost)}. `;
    if (item.paymentMethod === 'Hybrid') {
      details += `(Paid Cash: NRP ${formatCurrency(item.cashPaidForBatch)}, Paid Digital: NRP ${formatCurrency(item.digitalPaidForBatch)}, Due: NRP ${formatCurrency(item.dueAmount)})`;
    } else if (item.paymentMethod === 'Due') {
      details += `(Outstanding Due: NRP ${formatCurrency(item.dueAmount)})`;
    } else {
      details += `(Batch Fully Paid via ${item.paymentMethod})`;
    }
    return details;
  };
  
  const handleOpenSettleDialog = (item: PayableItem, type: PayableType) => {
    setItemToSettle(item);
    setSettlePayableType(type);
    setIsSettleDialogOpen(true);
  };
  
  const handleConfirmSettle = (itemId: string, batchId: string | undefined, paymentDetails: { cashPaid: number, digitalPaid: number }) => {
    if (!user) return;
    
    const totalPayment = paymentDetails.cashPaid + paymentDetails.digitalPaid;
    let paymentMethodLog = '';
    if (paymentDetails.cashPaid > 0 && paymentDetails.digitalPaid > 0) {
      paymentMethodLog = `Hybrid (Cash: ${formatCurrency(paymentDetails.cashPaid)}, Digital: ${formatCurrency(paymentDetails.digitalPaid)})`;
    } else if (paymentDetails.cashPaid > 0) {
      paymentMethodLog = 'Cash';
    } else {
      paymentMethodLog = 'Digital';
    }

    if (settlePayableType === 'supplier') {
      const productIndex = mockProducts.findIndex(p => p.id === itemId);
      if (productIndex === -1) { toast({ title: "Error", description: "Product not found.", variant: "destructive"}); return; }
      const product = mockProducts[productIndex];
      const batchIndex = product.acquisitionHistory.findIndex(b => b.batchId === batchId);
      if (batchIndex === -1) { toast({ title: "Error", description: "Acquisition batch not found.", variant: "destructive"}); return; }
      
      const batch = product.acquisitionHistory[batchIndex];
      batch.dueToSupplier -= totalPayment;
      batch.cashPaid += paymentDetails.cashPaid;
      batch.digitalPaid += paymentDetails.digitalPaid;

      addLogEntry(user.name, "Supplier Due Settled", `Settled NRP ${formatCurrency(totalPayment)} for '${product.name}' (Batch: ${batchId?.substring(0,8)}...) via ${paymentMethodLog}. New Due: NRP ${formatCurrency(batch.dueToSupplier)}.`);
      toast({title: "Success", description: "Supplier due updated."});

    } else if (settlePayableType === 'expense') {
        const expenseIndex = mockExpenses.findIndex(e => e.id === itemId);
        if (expenseIndex === -1) { toast({ title: "Error", description: "Expense not found.", variant: "destructive"}); return; }
        
        const expense = mockExpenses[expenseIndex];
        if (expense.amountDue === undefined) expense.amountDue = 0;
        if (expense.cashPaid === undefined) expense.cashPaid = 0;
        if (expense.digitalPaid === undefined) expense.digitalPaid = 0;

        expense.amountDue -= totalPayment;
        expense.cashPaid += paymentDetails.cashPaid;
        expense.digitalPaid += paymentDetails.digitalPaid;

        addLogEntry(user.name, "Expense Due Settled", `Settled NRP ${formatCurrency(totalPayment)} for expense '${expense.description}' via ${paymentMethodLog}. New Due: NRP ${formatCurrency(expense.amountDue)}.`);
        toast({title: "Success", description: "Expense due updated."});
    }

    setRefreshTrigger(prev => prev + 1);
    setIsSettleDialogOpen(false);
    setItemToSettle(null);
    setSettlePayableType('');
  };


  return (
    <>
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
          <Banknote className="h-7 w-7 text-primary" /> Accounts
        </h1>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Landmark className="h-5 w-5 text-primary" /> Account Payable Details
            </CardTitle>
            <CardDescription>
              View outstanding amounts.
              {selectedPayableType === 'supplier' && ` Total Supplier Due: NRP ${formatCurrency(totalSupplierDue)}.`}
              {selectedPayableType === 'expense' && ` Total Outstanding Expense Due: NRP ${formatCurrency(totalExpenseDue)}.`}
              {selectedPayableType === '' && ' Select a type to see due details.'}
            </CardDescription>
          </div>
          <Select value={selectedPayableType} onValueChange={(value) => setSelectedPayableType(value as PayableType)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select Payable Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="supplier">Supplier Due</SelectItem>
              <SelectItem value="expense">Expenses Due</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {selectedPayableType === 'supplier' && (
            supplierDueItems.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead className="text-right">Due Amount</TableHead>
                    <TableHead>Batch Pmt. Details</TableHead>
                    <TableHead>Acq. Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {supplierDueItems.map((item) => (
                    <TableRow key={item.batchId}>
                      <TableCell className="font-medium">{item.productName}</TableCell>
                      <TableCell>{item.supplierName || "N/A"}</TableCell>
                      <TableCell className="text-right font-semibold text-destructive">NRP {formatCurrency(item.dueAmount)}</TableCell>
                      <TableCell className="text-xs">{getSupplierPaymentDetails(item)}</TableCell>
                      <TableCell>{item.acquisitionDate}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => handleOpenSettleDialog(item, 'supplier')}>
                           <Edit className="mr-2 h-3 w-3" /> Settle
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center py-4 text-muted-foreground">No supplier dues found.</p>
            )
          )}

          {selectedPayableType === 'expense' && (
            expenseDueItems.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Total Expense</TableHead>
                    <TableHead>Payment Breakdown</TableHead>
                    <TableHead className="text-right">Outstanding Due</TableHead>
                    <TableHead>Recorded Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenseDueItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.description}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell className="text-right">NRP {formatCurrency(item.amount)}</TableCell>
                      <TableCell>
                        {item.paymentMethod === "Hybrid" ? (
                          <span className="text-xs">
                            Hybrid (
                            {item.cashPaid !== undefined && item.cashPaid > 0 && `Cash: NRP ${formatCurrency(item.cashPaid)}, `}
                            {item.digitalPaid !== undefined && item.digitalPaid > 0 && `Digital: NRP ${formatCurrency(item.digitalPaid)}, `}
                            Due: NRP {formatCurrency(item.amountDue)}
                            )
                          </span>
                        ) : (
                          "Fully Due"
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-destructive">NRP {formatCurrency(item.amountDue)}</TableCell>
                      <TableCell>{format(new Date(item.date), 'MMM dd, yyyy HH:mm')}</TableCell>
                       <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => handleOpenSettleDialog(item, 'expense')}>
                           <Edit className="mr-2 h-3 w-3" /> Settle
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center py-4 text-muted-foreground">No expense dues found.</p>
            )
          )}
          {selectedPayableType === '' && (
             <p className="text-center py-4 text-muted-foreground">Please select a payable type from the dropdown to view details.</p>
          )}
        </CardContent>
      </Card>
    </div>
    <SettlePayableDialog
        isOpen={isSettleDialogOpen}
        onClose={() => setIsSettleDialogOpen(false)}
        item={itemToSettle}
        payableType={settlePayableType}
        onConfirm={handleConfirmSettle}
    />
    </>
  );
}
