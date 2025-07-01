
"use client";

import { useEffect, useState, useMemo } from 'react';
import { useAuthStore } from "@/stores/authStore";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Banknote, Landmark, Edit, Wallet, DollarSign, Archive } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mockLogEntries, mockProducts, mockExpenses, mockSales, mockCapital, updateCashInHand, addLogEntry } from "@/lib/data";
import type { SupplierDueItem, ExpenseDueItem, Expense } from "@/types";
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import SettlePayableDialog from '@/components/accounts/SettlePayableDialog';
import { calculateCurrentStock } from '@/lib/productUtils';

type PayableType = 'supplier' | 'expense' | '';
type PayableItem = SupplierDueItem | ExpenseDueItem;

export default function AccountsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { toast } = useToast();
  
  // State for Payables
  const [selectedPayableType, setSelectedPayableType] = useState<PayableType>('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [itemToSettle, setItemToSettle] = useState<PayableItem | null>(null);
  const [settlePayableType, setSettlePayableType] = useState<PayableType>('');
  const [isSettleDialogOpen, setIsSettleDialogOpen] = useState(false);

  // State for Capital
  const [currentCashInHand, setCurrentCashInHand] = useState(mockCapital.cashInHand);
  const [lastUpdated, setLastUpdated] = useState(mockCapital.lastUpdated);
  const [newCashAmount, setNewCashAmount] = useState<string>('');

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

  // Logic for Payables
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
    } else if (paymentDetails.cashPaid > 0) { paymentMethodLog = 'Cash'; } else { paymentMethodLog = 'Digital'; }

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

  // Logic for Capital
  const currentInventoryValue = useMemo(() => {
    return mockProducts.reduce((sum, product) => {
      const stock = calculateCurrentStock(product, mockSales);
      return sum + (stock * product.currentCostPrice);
    }, 0);
  }, [mockProducts, mockSales, refreshTrigger]);

  const totalCapital = useMemo(() => {
    return currentCashInHand + currentInventoryValue;
  }, [currentCashInHand, currentInventoryValue]);

  const handleUpdateCash = () => {
    if (!user) return;
    const amount = parseFloat(newCashAmount);
    if (isNaN(amount) || amount < 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid non-negative number for cash in hand.", variant: "destructive" });
      return;
    }
    const { newAmount, lastUpdated: updatedTimestamp } = updateCashInHand(amount, user.name);
    setCurrentCashInHand(newAmount);
    setLastUpdated(updatedTimestamp);
    setNewCashAmount('');
    toast({ title: "Success", description: `Cash in hand has been updated to NRP ${formatCurrency(amount)}.` });
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <>
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
          <Wallet className="h-7 w-7 text-primary" /> Accounts & Capital
        </h1>
      </div>

      <Tabs defaultValue="payables" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="payables">Accounts Payable</TabsTrigger>
          <TabsTrigger value="capital">Capital Management</TabsTrigger>
        </TabsList>
        <TabsContent value="payables" className="mt-4">
          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Landmark className="h-5 w-5 text-primary" /> Payable Details
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
        </TabsContent>
        <TabsContent value="capital" className="mt-4">
          <div className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Capital Overview</CardTitle>
                <CardDescription>
                  A snapshot of your business's current capital. Last updated: {format(new Date(lastUpdated), "MMM dd, yyyy 'at' p")}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                  <div className="p-4 border rounded-lg">
                      <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2"><DollarSign/> Cash in Hand</h3>
                      <p className="text-2xl font-bold">NRP {formatCurrency(currentCashInHand)}</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                      <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Archive/> Inventory Value (Cost)</h3>
                      <p className="text-2xl font-bold">NRP {formatCurrency(currentInventoryValue)}</p>
                  </div>
                  <div className="p-4 border rounded-lg bg-muted/50">
                      <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Wallet/> Total Capital</h3>
                      <p className="text-2xl font-bold text-primary">NRP {formatCurrency(totalCapital)}</p>
                  </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Update Cash in Hand</CardTitle>
                <CardDescription>
                  Use this form to set or adjust the current amount of cash available to the business. This action will be logged.
                </CardDescription>
              </CardHeader>
              <CardContent>
                  <div className="space-y-2 max-w-sm">
                      <Label htmlFor="cashAmount">New Cash Amount (NRP)</Label>
                      <Input
                          id="cashAmount"
                          type="number"
                          value={newCashAmount}
                          onChange={(e) => setNewCashAmount(e.target.value)}
                          placeholder="Enter total cash amount"
                          min="0"
                          step="0.01"
                      />
                  </div>
              </CardContent>
              <CardFooter>
                  <Button onClick={handleUpdateCash}>
                      <Landmark className="mr-2 h-4 w-4" /> Update Cash Amount
                  </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
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
