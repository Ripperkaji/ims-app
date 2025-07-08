
"use client";

import { useEffect, useState, useMemo } from 'react';
import { useAuthStore } from "@/stores/authStore";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Banknote, Landmark, Edit, Wallet, DollarSign, Archive, Edit3, CheckCircle2, Phone, Flag, HandCoins, CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mockLogEntries, mockProducts, mockExpenses, mockSales, mockCapital, updateCashInHand, addLogEntry as globalAddLog } from "@/lib/data";
import type { SupplierDueItem, ExpenseDueItem, Expense, Sale, SaleItem } from "@/types";
import { format } from 'date-fns';
import { cn, formatCurrency } from '@/lib/utils';
import SettlePayableDialog from '@/components/accounts/SettlePayableDialog';
import { calculateCurrentStock } from '@/lib/productUtils';
import AdjustSaleDialog from "@/components/sales/AdjustSaleDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


type PayableType = 'supplier' | 'expense' | '';
type PayableItem = SupplierDueItem | ExpenseDueItem;
type PaymentMethodSelection = 'Cash' | 'Digital' | 'Due' | 'Hybrid';

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
  
  // State for Receivables
  const [dueSales, setDueSales] = useState<Sale[]>([]);
  const [saleToAdjust, setSaleToAdjust] = useState<Sale | null>(null);
  const [saleToMarkAsPaid, setSaleToMarkAsPaid] = useState<Sale | null>(null);
  const [markAsPaidConfirmationInput, setMarkAsPaidConfirmationInput] = useState('');

  useEffect(() => {
    if (user && user.role !== 'admin') {
      toast({ title: "Access Denied", description: "You do not have permission to view this page.", variant: "destructive" });
      router.push('/dashboard');
    }
     const updatedDueSales = mockSales.filter(sale => sale.amountDue > 0)
        .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
     setDueSales(updatedDueSales);
  }, [user, router, toast, refreshTrigger, mockSales]);

  // --- Logic for Payables ---
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
      globalAddLog(user.name, "Supplier Due Settled", `Settled NRP ${formatCurrency(totalPayment)} for '${product.name}' (Batch: ${batchId?.substring(0,8)}...) via ${paymentMethodLog}. New Due: NRP ${formatCurrency(batch.dueToSupplier)}.`);
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
        globalAddLog(user.name, "Expense Due Settled", `Settled NRP ${formatCurrency(totalPayment)} for expense '${expense.description}' via ${paymentMethodLog}. New Due: NRP ${formatCurrency(expense.amountDue)}.`);
        toast({title: "Success", description: "Expense due updated."});
    }
    setRefreshTrigger(prev => prev + 1);
    setIsSettleDialogOpen(false);
    setItemToSettle(null);
    setSettlePayableType('');
  };

  // --- Logic for Capital ---
  const currentInventoryValue = useMemo(() => {
    return mockProducts.reduce((sum, product) => {
      const stock = calculateCurrentStock(product, mockSales);
      return sum + (stock * product.currentCostPrice);
    }, 0);
  }, [mockProducts, mockSales, refreshTrigger]);

  const currentDigitalBalance = useMemo(() => {
    const digitalInflows = mockSales.reduce((sum, sale) => sum + (sale.digitalPaid || 0), 0);
    const digitalOutflowsFromSuppliers = mockProducts.flatMap(p => p.acquisitionHistory).reduce((sum, batch) => sum + (batch.digitalPaid || 0), 0);
    const digitalOutflowsFromExpenses = mockExpenses.reduce((sum, expense) => sum + (expense.digitalPaid || 0), 0);
    return digitalInflows - digitalOutflowsFromSuppliers - digitalOutflowsFromExpenses;
  }, [mockSales, mockProducts, mockExpenses, refreshTrigger]);

  const totalCapital = useMemo(() => {
    return currentCashInHand + currentDigitalBalance + currentInventoryValue;
  }, [currentCashInHand, currentDigitalBalance, currentInventoryValue]);

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
  
  // --- Logic for Receivables (Due Sales) ---
  const openMarkAsPaidDialog = (sale: Sale) => {
    setSaleToMarkAsPaid(sale);
    setMarkAsPaidConfirmationInput('');
  };

  const confirmMarkAsPaid = () => {
    if (!user || !saleToMarkAsPaid) return;
    if (markAsPaidConfirmationInput.trim().toUpperCase() !== 'YES') {
      toast({ title: "Confirmation Error", description: "Please type YES to confirm.", variant: "destructive" });
      return;
    }
    const saleIndex = mockSales.findIndex(s => s.id === saleToMarkAsPaid.id);
    if (saleIndex !== -1) {
      const paidAmount = mockSales[saleIndex].amountDue;
      mockSales[saleIndex].cashPaid += mockSales[saleIndex].amountDue; 
      mockSales[saleIndex].amountDue = 0;
      mockSales[saleIndex].status = 'Paid'; 
      globalAddLog(user.name, "Sale Marked as Paid", `Sale ID ${saleToMarkAsPaid.id.substring(0,8)} for ${mockSales[saleIndex].customerName} marked as fully paid by ${user.name}. Amount cleared: NRP ${formatCurrency(paidAmount)}.`);
      setRefreshTrigger(p => p + 1);
      toast({ title: "Sale Updated", description: `Sale ${saleToMarkAsPaid.id.substring(0,8)}... marked as Paid.` });
    } else {
      toast({ title: "Error", description: "Sale not found.", variant: "destructive" });
    }
    setSaleToMarkAsPaid(null);
    setMarkAsPaidConfirmationInput('');
  };

  const handleOpenAdjustDialog = (sale: Sale) => setSaleToAdjust(sale);

  const handleSaleAdjusted = (originalSaleId: string, updatedSaleDataFromDialog: any, adjustmentComment: string) => {
     if (!user) return;
    const originalSaleIndex = mockSales.findIndex(s => s.id === originalSaleId);
    if (originalSaleIndex === -1) { toast({ title: "Error", description: "Original sale not found.", variant: "destructive" }); return; }
    
    const originalSale = mockSales[originalSaleIndex];
    let stockSufficient = true;
    for (const newItem of updatedSaleDataFromDialog.items) {
      const product = mockProducts.find(p => p.id === newItem.productId);
      if (product) {
        const originalItem = originalSale.items.find(oi => oi.productId === newItem.productId);
        const originalQuantityInThisSale = originalItem ? originalItem.quantity : 0;
        const currentStockWithOriginalSale = calculateCurrentStock(product, mockSales);
        const availableStockForAdjustment = currentStockWithOriginalSale + originalQuantityInThisSale;
        if (newItem.quantity > availableStockForAdjustment) {
          toast({ title: "Stock Error", description: `Not enough stock for ${newItem.productName}. Only ${availableStockForAdjustment} available.`, variant: "destructive" });
          stockSufficient = false; break;
        }
      } else { toast({ title: "Product Error", description: `Product ${newItem.productName} not found.`, variant: "destructive" }); stockSufficient = false; break; }
    }
    if (!stockSufficient) { setSaleToAdjust(null); return; }

    let finalFlaggedComment = originalSale.flaggedComment || "";
    if (adjustmentComment.trim()) { finalFlaggedComment = (finalFlaggedComment ? finalFlaggedComment + "\n" : "") + `Adjusted by ${user.name} on ${format(new Date(), 'MMM dd, yyyy HH:mm')}: ${adjustmentComment}`; }
    
    mockSales[originalSaleIndex] = { ...originalSale, ...updatedSaleDataFromDialog, flaggedComment: finalFlaggedComment, status: updatedSaleDataFromDialog.amountDue > 0 ? 'Due' : 'Paid' };
    globalAddLog(user.name, "Sale Adjusted", `Sale ID ${originalSaleId.substring(0,8)} updated by ${user.name}. New Total: NRP ${formatCurrency(updatedSaleDataFromDialog.totalAmount)}. Comment: ${adjustmentComment}`);
    setRefreshTrigger(p => p + 1);
    toast({ title: "Sale Adjusted", description: `Sale ${originalSaleId.substring(0,8)}... has been updated.` });
    setSaleToAdjust(null);
  };


  if (!user || user.role !== 'admin') { return null; }

  return (
    <>
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
          <Wallet className="h-7 w-7 text-primary" /> Finance
        </h1>
      </div>

      <Tabs defaultValue="payables" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="payables">Accounts Payable</TabsTrigger>
          <TabsTrigger value="receivables">Accounts Receivable</TabsTrigger>
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
                  View outstanding amounts owed to suppliers or for expenses.
                </CardDescription>
              </div>
              <Select value={selectedPayableType} onValueChange={(value) => setSelectedPayableType(value as PayableType)}>
                <SelectTrigger className="w-[200px]"><SelectValue placeholder="Select Payable Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="supplier">Supplier Due</SelectItem>
                  <SelectItem value="expense">Expenses Due</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              {selectedPayableType === 'supplier' && (
                supplierDueItems.length > 0 ? (
                  <>
                  <p className="text-sm text-muted-foreground mb-3">Total Supplier Due: <span className="font-semibold text-destructive">NRP {formatCurrency(totalSupplierDue)}</span></p>
                  <Table>
                    <TableHeader><TableRow><TableHead>Product Name</TableHead><TableHead>Supplier</TableHead><TableHead className="text-right">Due Amount</TableHead><TableHead>Batch Pmt. Details</TableHead><TableHead>Acq. Date</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {supplierDueItems.map((item) => (
                        <TableRow key={item.batchId}>
                          <TableCell className="font-medium">{item.productName}</TableCell>
                          <TableCell>{item.supplierName || "N/A"}</TableCell>
                          <TableCell className="text-right font-semibold text-destructive">NRP {formatCurrency(item.dueAmount)}</TableCell>
                          <TableCell className="text-xs">{getSupplierPaymentDetails(item)}</TableCell>
                          <TableCell>{item.acquisitionDate}</TableCell>
                          <TableCell className="text-right"><Button variant="outline" size="sm" onClick={() => handleOpenSettleDialog(item, 'supplier')}><Edit className="mr-2 h-3 w-3" /> Settle</Button></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  </>
                ) : <p className="text-center py-4 text-muted-foreground">No supplier dues found.</p>
              )}

              {selectedPayableType === 'expense' && (
                expenseDueItems.length > 0 ? (
                  <>
                  <p className="text-sm text-muted-foreground mb-3">Total Outstanding Expense Due: <span className="font-semibold text-destructive">NRP {formatCurrency(totalExpenseDue)}</span></p>
                  <Table>
                    <TableHeader><TableRow><TableHead>Description</TableHead><TableHead>Category</TableHead><TableHead className="text-right">Total Expense</TableHead><TableHead>Payment Breakdown</TableHead><TableHead className="text-right">Outstanding Due</TableHead><TableHead>Recorded Date</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {expenseDueItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.description}</TableCell><TableCell>{item.category}</TableCell>
                          <TableCell className="text-right">NRP {formatCurrency(item.amount)}</TableCell>
                          <TableCell><span className="text-xs">{item.paymentMethod === "Hybrid" ? `Hybrid (Cash: NRP ${formatCurrency(item.cashPaid)}, Digital: NRP ${formatCurrency(item.digitalPaid)}, Due: NRP ${formatCurrency(item.amountDue)})` : "Fully Due"}</span></TableCell>
                          <TableCell className="text-right font-semibold text-destructive">NRP {formatCurrency(item.amountDue)}</TableCell>
                          <TableCell>{format(new Date(item.date), 'MMM dd, yyyy HH:mm')}</TableCell>
                          <TableCell className="text-right"><Button variant="outline" size="sm" onClick={() => handleOpenSettleDialog(item, 'expense')}><Edit className="mr-2 h-3 w-3" /> Settle</Button></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  </>
                ) : <p className="text-center py-4 text-muted-foreground">No expense dues found.</p>
              )}
              {selectedPayableType === '' && <p className="text-center py-4 text-muted-foreground">Please select a payable type from the dropdown to view details.</p>}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="receivables" className="mt-4">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><HandCoins className="h-5 w-5 text-primary"/> Accounts Receivable</CardTitle>
              <CardDescription>List of all sales with an outstanding due amount from customers.</CardDescription>
            </CardHeader>
            <CardContent>
              {dueSales.length > 0 ? (
              <Table>
                <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Customer</TableHead><TableHead>Contact</TableHead><TableHead>Total</TableHead><TableHead>Due</TableHead><TableHead>Flagged</TableHead><TableHead>Date</TableHead><TableHead>Recorded By</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {dueSales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium">{sale.id.substring(0,8)}...</TableCell><TableCell>{sale.customerName}</TableCell>
                      <TableCell>{sale.customerContact ? (<a href={`tel:${sale.customerContact}`} className="flex items-center gap-1 hover:underline text-primary"><Phone className="h-3 w-3" /> {sale.customerContact}</a>) : <span className="text-xs">N/A</span>}</TableCell>
                      <TableCell>NRP {formatCurrency(sale.totalAmount)}</TableCell><TableCell className="font-semibold text-destructive">NRP {formatCurrency(sale.amountDue)}</TableCell>
                      <TableCell>
                        {sale.isFlagged ? (<TooltipProvider><Tooltip><TooltipTrigger asChild><Flag className="h-4 w-4 text-destructive cursor-pointer" /></TooltipTrigger><TooltipContent><p className="max-w-xs whitespace-pre-wrap">{sale.flaggedComment || "Flagged for review"}</p></TooltipContent></Tooltip></TooltipProvider>) : (<span>No</span>)}
                      </TableCell>
                      <TableCell>{format(new Date(sale.date), 'MMM dd, yyyy')}</TableCell><TableCell>{sale.createdBy}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => openMarkAsPaidDialog(sale)}><CheckCircle2 className="mr-2 h-4 w-4" /> Mark as Paid</Button>
                        <Button variant="outline" size="icon" onClick={() => handleOpenAdjustDialog(sale)} title="Adjust Sale"><Edit3 className="h-4 w-4" /><span className="sr-only">Adjust Sale</span></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              ) : (
                 <div className="text-center py-8 text-muted-foreground">No due sales records found. Well done!</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="capital" className="mt-4">
          <div className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Capital Overview</CardTitle>
                <CardDescription>A snapshot of your business's current capital. Last updated: {format(new Date(lastUpdated), "MMM dd, yyyy 'at' p")}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-4">
                  <div className="p-4 border rounded-lg"><h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2"><DollarSign/> Cash in Hand</h3><p className="text-2xl font-bold">NRP {formatCurrency(currentCashInHand)}</p></div>
                  <div className="p-4 border rounded-lg"><h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2"><CreditCard/> Current Digital Balance</h3><p className="text-2xl font-bold">NRP {formatCurrency(currentDigitalBalance)}</p></div>
                  <div className="p-4 border rounded-lg"><h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Archive/> Inventory Value (Cost)</h3><p className="text-2xl font-bold">NRP {formatCurrency(currentInventoryValue)}</p></div>
                  <div className="p-4 border rounded-lg bg-muted/50"><h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Wallet/> Total Capital</h3><p className="text-2xl font-bold text-primary">NRP {formatCurrency(totalCapital)}</p></div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Update Cash in Hand</CardTitle>
                <CardDescription>Use this form to set or adjust the current amount of cash available to the business. This action will be logged.</CardDescription>
              </CardHeader>
              <CardContent>
                  <div className="space-y-2 max-w-sm">
                      <Label htmlFor="cashAmount">New Cash Amount (NRP)</Label>
                      <Input id="cashAmount" type="number" value={newCashAmount} onChange={(e) => setNewCashAmount(e.target.value)} placeholder="Enter total cash amount" min="0" step="0.01" />
                  </div>
              </CardContent>
              <CardFooter><Button onClick={handleUpdateCash}><Landmark className="mr-2 h-4 w-4" /> Update Cash Amount</Button></CardFooter>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
    <SettlePayableDialog isOpen={isSettleDialogOpen} onClose={() => setIsSettleDialogOpen(false)} item={itemToSettle} payableType={settlePayableType} onConfirm={handleConfirmSettle} />

    {saleToMarkAsPaid && (
        <AlertDialog open={!!saleToMarkAsPaid} onOpenChange={(isOpen) => { if (!isOpen) { setSaleToMarkAsPaid(null); setMarkAsPaidConfirmationInput('');} }}>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Confirm Mark as Paid</AlertDialogTitle>
              <AlertDialogDescription>
                You are about to mark sale <strong>{saleToMarkAsPaid.id.substring(0,8)}...</strong> for customer <strong>{saleToMarkAsPaid.customerName}</strong> (Due: NRP {formatCurrency(saleToMarkAsPaid.amountDue)}) as fully paid. This action assumes the full due amount has been received.<br/><br/>To confirm, please type "<strong>YES</strong>" in the box below.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <Label htmlFor="confirmMarkAsPaidInput" className="sr-only">Type YES to confirm</Label>
              <Input id="confirmMarkAsPaidInput" value={markAsPaidConfirmationInput} onChange={(e) => setMarkAsPaidConfirmationInput(e.target.value)} placeholder='Type YES here' autoFocus />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => { setSaleToMarkAsPaid(null); setMarkAsPaidConfirmationInput(''); }}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmMarkAsPaid} disabled={markAsPaidConfirmationInput.trim().toUpperCase() !== 'YES'} className={markAsPaidConfirmationInput.trim().toUpperCase() !== 'YES' ? "bg-primary/50" : ""}>Confirm Payment</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {saleToAdjust && (
        <AdjustSaleDialog sale={saleToAdjust} isOpen={!!saleToAdjust} onClose={() => setSaleToAdjust(null)} onSaleAdjusted={handleSaleAdjusted} allGlobalProducts={mockProducts} isInitiallyFlagged={saleToAdjust.isFlagged || false} mockSales={mockSales} />
      )}
    </>
  );
}
