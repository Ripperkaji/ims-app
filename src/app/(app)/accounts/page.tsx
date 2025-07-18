
"use client";

import { useEffect, useState, useMemo } from 'react';
import { useAuthStore } from "@/stores/authStore";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Banknote, Landmark, Edit, Wallet, DollarSign, Archive, Edit3, CheckCircle2, Phone, Flag, HandCoins, CreditCard, PieChart as PieChartIcon, CalendarClock, TrendingUp, TrendingDown, PackagePlus, FileText, Info, Save, PiggyBank } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { mockLogEntries, mockProducts, mockExpenses, mockSales, mockCapital } from "@/lib/data";
import type { SupplierDueItem, ExpenseDueItem, Expense, Sale, SaleItem, AcquisitionBatch } from "@/types";
import { format, parseISO, differenceInDays, isValid, parse } from 'date-fns';
import { cn, formatCurrency } from '@/lib/utils';
import SettlePayableDialog from '@/components/accounts/SettlePayableDialog';
import { calculateCurrentStock } from "@/lib/productUtils";
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
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


type PayableType = 'supplier' | 'expense' | '';
type PayableItem = SupplierDueItem | ExpenseDueItem;
type PaymentMethodSelection = 'Cash' | 'Digital' | 'Due' | 'Hybrid';
type ReportType = 'sales' | 'expenses' | 'acquisitions';

// --- Aging Calculation ---

type AgingData = {
  "1-15": number;
  "16-30": number;
  "31-45": number;
  "46-60": number;
  "60+": number;
  total: number;
};

const calculateAging = (items: { date: string; amount: number }[]): AgingData => {
  const today = new Date();
  const agingData: AgingData = {
    "1-15": 0,
    "16-30": 0,
    "31-45": 0,
    "46-60": 0,
    "60+": 0,
    total: 0,
  };

  items.forEach(item => {
    try {
        const itemDate = parseISO(item.date);
        if (!isValid(itemDate)) {
            console.warn("Invalid date found for aging calculation:", item.date);
            return; // Skip this item
        }
        const diffDays = differenceInDays(today, itemDate);

        if (diffDays <= 0) { // Not overdue yet
            return;
        }
        
        if (diffDays <= 15) {
          agingData["1-15"] += item.amount;
        } else if (diffDays <= 30) {
          agingData["16-30"] += item.amount;
        } else if (diffDays <= 45) {
          agingData["31-45"] += item.amount;
        } else if (diffDays <= 60) {
          agingData["46-60"] += item.amount;
        } else { // diffDays > 60
          agingData["60+"] += item.amount;
        }
        agingData.total += item.amount;
    } catch(e) {
        console.error("Error parsing date for aging:", item.date, e);
    }
  });
  return agingData;
};

const AgingTable = ({ data, title }: { data: AgingData; title: string }) => {
  if (data.total <= 0) {
    return null;
  }

  const buckets = [
    { label: "1-15 Days", value: data["1-15"] },
    { label: "16-30 Days", value: data["16-30"] },
    { label: "31-45 Days", value: data["31-45"] },
    { label: "46-60 Days", value: data["46-60"] },
    { label: "60+ Days", value: data["60+"] },
  ];

  return (
    <div className="mt-2 mb-8 p-4 border rounded-lg bg-muted/30">
      <h3 className="text-lg font-semibold mb-3">{title}</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Aging Bucket</TableHead>
            <TableHead className="text-right">Amount (NRP)</TableHead>
            <TableHead className="text-right">% of Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {buckets.map(bucket => (
            <TableRow key={bucket.label}>
              <TableCell className="font-medium">{bucket.label}</TableCell>
              <TableCell className="text-right">{formatCurrency(bucket.value)}</TableCell>
              <TableCell className="text-right text-muted-foreground">
                {data.total > 0 ? ((bucket.value / data.total) * 100).toFixed(1) : '0.0'}%
              </TableCell>
            </TableRow>
          ))}
          <TableRow className="font-bold bg-muted/50 border-t-2">
            <TableCell>Total Due</TableCell>
            <TableCell className="text-right">{formatCurrency(data.total)}</TableCell>
            <TableCell className="text-right">100.0%</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
};

// --- P&L Calculation Data Structure ---
interface PnlData {
  productId: string;
  productName: string;
  unitsSold: number;
  totalRevenue: number;
  totalCostOfGoodsSold: number;
  totalProfit: number;
  profitMargin: number;
}


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
  const [initialCapital, setInitialCapital] = useState(mockCapital.cashInHand);
  const [capitalInput, setCapitalInput] = useState(mockCapital.cashInHand.toString());
  const [lastUpdated, setLastUpdated] = useState(mockCapital.lastUpdated);
  const [initialDigitalBalance, setInitialDigitalBalance] = useState(mockCapital.digitalBalance);
  const [digitalBalanceInput, setDigitalBalanceInput] = useState(mockCapital.digitalBalance.toString());
  const [lastDigitalUpdated, setLastDigitalUpdated] = useState(mockCapital.lastDigitalUpdated);
  
  // State for Receivables
  const [dueSales, setDueSales] = useState<Sale[]>([]);
  const [saleToAdjust, setSaleToAdjust] = useState<Sale | null>(null);
  const [saleToMarkAsPaid, setSaleToMarkAsPaid] = useState<Sale | null>(null);
  const [markAsPaidConfirmationInput, setMarkAsPaidConfirmationInput] = useState('');
  
  // State for Monthly Reports
  const [selectedReportType, setSelectedReportType] = useState<ReportType>('sales');


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
          isoAcquisitionDate: batch.date,
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
  supplierDueItems.sort((a, b) => new Date(b.isoAcquisitionDate).getTime() - new Date(a.isoAcquisitionDate).getTime());

  const expenseDueItems: ExpenseDueItem[] = mockExpenses
    .filter(e => e.amountDue && e.amountDue > 0)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalSupplierDue = supplierDueItems.reduce((sum, item) => sum + item.dueAmount, 0);
  const totalExpenseDue = expenseDueItems.reduce((sum, item) => sum + (item.amountDue || 0), 0);

  const supplierDuesForAging = useMemo(() => {
    return supplierDueItems.map(item => ({ date: item.isoAcquisitionDate, amount: item.dueAmount }));
  }, [supplierDueItems]);
  const supplierPayableAging = useMemo(() => calculateAging(supplierDuesForAging), [supplierDuesForAging]);

  const expenseDuesForAging = useMemo(() => {
    return expenseDueItems.map(item => ({ date: item.date, amount: item.amountDue || 0 }));
  }, [expenseDueItems]);
  const expensePayableAging = useMemo(() => calculateAging(expenseDuesForAging), [expenseDuesForAging]);

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
      mockLogEntries.unshift({
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: user.name,
        action: "Vendor/Supplier Due Settled",
        details: `Settled NRP ${formatCurrency(totalPayment)} for '${product.name}' (Batch: ${batchId?.substring(0,8)}...) via ${paymentMethodLog}. New Due: NRP ${formatCurrency(batch.dueToSupplier)}.`
      });
      toast({title: "Success", description: "Vendor/Supplier due updated."});
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
        mockLogEntries.unshift({
            id: `log-${Date.now()}`,
            timestamp: new Date().toISOString(),
            user: user.name,
            action: "Expense Due Settled",
            details: `Settled NRP ${formatCurrency(totalPayment)} for expense '${expense.description}' via ${paymentMethodLog}. New Due: NRP ${formatCurrency(expense.amountDue)}.`
        });
        toast({title: "Success", description: "Expense due updated."});
    }
    setRefreshTrigger(prev => prev + 1);
    setIsSettleDialogOpen(false);
    setItemToSettle(null);
    setSettlePayableType('');
  };

  // --- Logic for Current Assets ---
  const cashInHand = useMemo(() => {
    const cashInflowsFromSales = mockSales.reduce((sum, sale) => sum + (sale.cashPaid || 0), 0);
    const cashOutflowsForSuppliers = mockProducts.flatMap(p => p.acquisitionHistory).reduce((sum, batch) => sum + (batch.cashPaid || 0), 0);
    const cashOutflowsForExpenses = mockExpenses.reduce((sum, expense) => sum + (expense.cashPaid || 0), 0);
    return initialCapital + cashInflowsFromSales - cashOutflowsForSuppliers - cashOutflowsForExpenses;
  }, [mockSales, mockProducts, mockExpenses, refreshTrigger, initialCapital]);

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
    return initialDigitalBalance + digitalInflows - digitalOutflowsFromSuppliers - digitalOutflowsFromExpenses;
  }, [mockSales, mockProducts, mockExpenses, refreshTrigger, initialDigitalBalance]);
  
  const totalReceivables = useMemo(() => {
    return mockSales.reduce((sum, sale) => sum + (sale.amountDue || 0), 0);
  }, [mockSales, refreshTrigger]);

  const availableWorkingCapital = useMemo(() => cashInHand + currentDigitalBalance, [cashInHand, currentDigitalBalance]);

  const totalCurrentAssets = useMemo(() => {
    return cashInHand + currentDigitalBalance + currentInventoryValue + totalReceivables;
  }, [cashInHand, currentDigitalBalance, currentInventoryValue, totalReceivables]);


  // --- Logic for Receivables (Due Sales) ---
  const receivablesForAging = useMemo(() => {
    return dueSales.map(sale => ({ date: sale.date, amount: sale.amountDue }));
  }, [dueSales]);

  const receivableAging = useMemo(() => calculateAging(receivablesForAging), [dueSales]);

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
      mockLogEntries.unshift({
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: user.name,
        action: "Sale Marked as Paid",
        details: `Sale ID ${saleToMarkAsPaid.id} for ${mockSales[saleIndex].customerName} marked as fully paid by ${user.name}. Amount cleared: NRP ${formatCurrency(paidAmount)}.`
      });
      setRefreshTrigger(p => p + 1);
      toast({ title: "Sale Updated", description: `Sale ${saleToMarkAsPaid.id} marked as Paid.` });
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
    mockLogEntries.unshift({
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: user.name,
        action: "Sale Adjusted",
        details: `Sale ID ${originalSaleId} updated by ${user.name}. New Total: NRP ${formatCurrency(updatedSaleDataFromDialog.totalAmount)}. Comment: ${adjustmentComment}`
    });
    setRefreshTrigger(p => p + 1);
    toast({ title: "Sale Adjusted", description: `Sale ${originalSaleId} has been updated.` });
    setSaleToAdjust(null);
  };
  
  // --- Logic for P&L ---
  const { pnlData, pnlTotals, overallProfitMargin } = useMemo(() => {
    const pnlMap = new Map<string, Omit<PnlData, 'profitMargin' | 'productName'>>();

    mockSales.forEach(sale => {
      sale.items.forEach(item => {
        const product = mockProducts.find(p => p.id === item.productId);
        // If product not found, we can't calculate profit, so skip.
        if (!product) return;

        const costOfGoods = product.currentCostPrice * item.quantity;
        const profit = item.totalPrice - costOfGoods;

        const existingEntry = pnlMap.get(item.productId);

        if (existingEntry) {
          existingEntry.unitsSold += item.quantity;
          existingEntry.totalRevenue += item.totalPrice;
          existingEntry.totalCostOfGoodsSold += costOfGoods;
          existingEntry.totalProfit += profit;
        } else {
          pnlMap.set(item.productId, {
            productId: item.productId,
            unitsSold: item.quantity,
            totalRevenue: item.totalPrice,
            totalCostOfGoodsSold: costOfGoods,
            totalProfit: profit,
          });
        }
      });
    });

    const pnlArray: PnlData[] = Array.from(pnlMap.values()).map(data => {
      const product = mockProducts.find(p => p.id === data.productId)!;
      const profitMargin = data.totalRevenue > 0 ? (data.totalProfit / data.totalRevenue) * 100 : 0;
      return {
        ...data,
        productName: `${product.name}${product.modelName ? ` (${product.modelName})` : ''}${product.flavorName ? ` - ${product.flavorName}` : ''}`,
        profitMargin,
      };
    }).sort((a,b) => b.totalProfit - a.totalProfit);

    const totals = {
        totalRevenue: pnlArray.reduce((sum, item) => sum + item.totalRevenue, 0),
        totalCostOfGoodsSold: pnlArray.reduce((sum, item) => sum + item.totalCostOfGoodsSold, 0),
        totalProfit: pnlArray.reduce((sum, item) => sum + item.totalProfit, 0),
    }
    const overallProfitMargin = totals.totalRevenue > 0 ? (totals.totalProfit / totals.totalRevenue) * 100 : 0;

    return { pnlData: pnlArray, pnlTotals: totals, overallProfitMargin };
  }, [mockSales, mockProducts, refreshTrigger]);

  // --- Logic for Monthly Reports ---
  const salesByMonth = useMemo(() => {
    const grouped: { [key: string]: { sales: Sale[]; total: number } } = {};
    mockSales.forEach(sale => {
      const monthYearKey = format(new Date(sale.date), 'yyyy-MM');
      if (!grouped[monthYearKey]) {
        grouped[monthYearKey] = { sales: [], total: 0 };
      }
      grouped[monthYearKey].sales.push(sale);
      grouped[monthYearKey].total += sale.totalAmount;
    });
    return grouped;
  }, [refreshTrigger, mockSales]);

  const expensesByMonth = useMemo(() => {
    const grouped: { [key: string]: { expenses: Expense[]; total: number } } = {};
    mockExpenses.forEach(expense => {
      const monthYearKey = format(parseISO(expense.date), 'yyyy-MM');
      if (!grouped[monthYearKey]) {
        grouped[monthYearKey] = { expenses: [], total: 0 };
      }
      grouped[monthYearKey].expenses.push(expense);
      grouped[monthYearKey].total += expense.amount;
    });
    return grouped;
  }, [refreshTrigger, mockExpenses]);

  const acquisitionsByMonth = useMemo(() => {
    const grouped: { [key: string]: { acquisitions: (AcquisitionBatch & { productName: string })[]; total: number } } = {};
    mockProducts.forEach(product => {
      product.acquisitionHistory.forEach(batch => {
        const monthYearKey = format(parseISO(batch.date), 'yyyy-MM');
        if (!grouped[monthYearKey]) {
          grouped[monthYearKey] = { acquisitions: [], total: 0 };
        }
        grouped[monthYearKey].acquisitions.push({
          productName: `${product.name}${product.modelName ? ` (${product.modelName})` : ''}${product.flavorName ? ` - ${product.flavorName}` : ''}`,
          ...batch,
        });
        grouped[monthYearKey].total += batch.totalBatchCost;
      });
    });
    Object.values(grouped).forEach(monthData => {
      monthData.acquisitions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });
    return grouped;
  }, [refreshTrigger, mockProducts]);

  const allMonths = useMemo(() => {
    const months = new Set([
        ...Object.keys(salesByMonth),
        ...Object.keys(expensesByMonth),
        ...Object.keys(acquisitionsByMonth),
    ]);
    return Array.from(months).sort((a,b) => b.localeCompare(a));
  }, [salesByMonth, expensesByMonth, acquisitionsByMonth]);

  // --- Logic for Capital Management ---
  const handleUpdateCapital = async () => {
    if (!user) return;
    const numericCapital = parseFloat(capitalInput);
    if (isNaN(numericCapital) || numericCapital < 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid positive number for capital.", variant: "destructive" });
      return;
    }
    
    try {
        const response = await fetch('/api/capital', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: numericCapital, actorName: user.name }),
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || 'Failed to update capital');
        }
        setInitialCapital(result.newAmount);
        setCapitalInput(result.newAmount.toString());
        setLastUpdated(result.lastUpdated);
        toast({ title: "Success", description: "Initial Cash in Hand (Capital) has been updated." });
        setRefreshTrigger(p => p + 1);
    } catch(error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        toast({ title: "Update Failed", description: errorMessage, variant: "destructive" });
    }
  };

  const handleUpdateDigitalBalance = async () => {
    if (!user) return;
    const numericBalance = parseFloat(digitalBalanceInput);
    if (isNaN(numericBalance) || numericBalance < 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid positive number for the balance.", variant: "destructive" });
      return;
    }

    try {
      const response = await fetch('/api/capital/digital', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: numericBalance, actorName: user.name }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update balance');
      }
      setInitialDigitalBalance(result.newAmount);
      setDigitalBalanceInput(result.newAmount.toString());
      setLastDigitalUpdated(result.lastUpdated);
      toast({ title: "Success", description: "Initial Bank/Digital Balance has been updated." });
      setRefreshTrigger(p => p + 1);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({ title: "Update Failed", description: errorMessage, variant: "destructive" });
    }
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
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="payables">Accounts Payable</TabsTrigger>
          <TabsTrigger value="receivables">Accounts Receivable</TabsTrigger>
          <TabsTrigger value="pnl">Profit & Loss</TabsTrigger>
          <TabsTrigger value="monthly-reports">Monthly Reports</TabsTrigger>
          <TabsTrigger value="current-assets">Current Assets</TabsTrigger>
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
                  View outstanding amounts owed to vendors/suppliers or for expenses.
                </CardDescription>
              </div>
              <Select value={selectedPayableType} onValueChange={(value) => setSelectedPayableType(value as PayableType)}>
                <SelectTrigger className="w-[200px]"><SelectValue placeholder="Select Payable Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="supplier">Vendor/Supplier Due</SelectItem>
                  <SelectItem value="expense">Expenses Due</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              {selectedPayableType === 'supplier' && (
                <>
                  <AgingTable data={supplierPayableAging} title="Vendor/Supplier Payables Aging Summary" />
                  {supplierDueItems.length > 0 ? (
                    <>
                    <p className="text-sm text-muted-foreground mb-3">Total Vendor/Supplier Due: <span className="font-semibold text-destructive">NRP {formatCurrency(totalSupplierDue)}</span></p>
                    <Table>
                      <TableHeader><TableRow><TableHead>Product Name</TableHead><TableHead>Vendor/Supplier</TableHead><TableHead className="text-right">Due Amount</TableHead><TableHead>Batch Pmt. Details</TableHead><TableHead>Acq. Date</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
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
                  ) : <p className="text-center py-4 text-muted-foreground">No vendor/supplier dues found.</p>}
                </>
              )}

              {selectedPayableType === 'expense' && (
                 <>
                  <AgingTable data={expensePayableAging} title="Expense Payables Aging Summary" />
                  {expenseDueItems.length > 0 ? (
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
                            <TableCell className="text-right font-semibold text-destructive">NRP {formatCurrency(item.amountDue || 0)}</TableCell>
                            <TableCell>{format(new Date(item.date), 'MMM dd, yyyy HH:mm')}</TableCell>
                            <TableCell className="text-right"><Button variant="outline" size="sm" onClick={() => handleOpenSettleDialog(item, 'expense')}><Edit className="mr-2 h-3 w-3" /> Settle</Button></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    </>
                  ) : <p className="text-center py-4 text-muted-foreground">No expense dues found.</p>}
                 </>
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
              <AgingTable data={receivableAging} title="Receivables Aging Summary" />
              {dueSales.length > 0 ? (
              <Table>
                <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Customer</TableHead><TableHead>Contact</TableHead><TableHead>Total</TableHead><TableHead>Due</TableHead><TableHead>Flagged</TableHead><TableHead>Date</TableHead><TableHead>Recorded By</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {dueSales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium">{sale.id}</TableCell><TableCell>{sale.customerName}</TableCell>
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
        <TabsContent value="pnl" className="mt-4">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><PieChartIcon className="h-5 w-5 text-primary"/> Product Profit & Loss</CardTitle>
                <CardDescription>Profitability analysis for each product based on all-time sales and current cost price.</CardDescription>
              </CardHeader>
              <CardContent>
                {pnlData.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product Name</TableHead>
                        <TableHead className="text-center">Units Sold</TableHead>
                        <TableHead className="text-right">Total Revenue</TableHead>
                        <TableHead className="text-right">Total COGS</TableHead>
                        <TableHead className="text-right">Total Profit</TableHead>
                        <TableHead className="text-right">Profit Margin</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pnlData.map((pnl) => (
                        <TableRow key={pnl.productId}>
                          <TableCell className="font-medium max-w-xs truncate">{pnl.productName}</TableCell>
                          <TableCell className="text-center">{pnl.unitsSold}</TableCell>
                          <TableCell className="text-right">NRP {formatCurrency(pnl.totalRevenue)}</TableCell>
                          <TableCell className="text-right text-muted-foreground">NRP {formatCurrency(pnl.totalCostOfGoodsSold)}</TableCell>
                          <TableCell className={cn("text-right font-semibold", pnl.totalProfit >= 0 ? 'text-green-600' : 'text-destructive')}>
                            NRP {formatCurrency(pnl.totalProfit)}
                          </TableCell>
                          <TableCell className={cn("text-right font-semibold", pnl.profitMargin >= 0 ? 'text-green-600' : 'text-destructive')}>
                            {pnl.profitMargin.toFixed(1)}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter>
                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                            <TableHead colSpan={2} className="font-bold text-lg">Grand Totals</TableHead>
                            <TableHead className="text-right font-bold text-lg">NRP {formatCurrency(pnlTotals.totalRevenue)}</TableHead>
                            <TableHead className="text-right font-bold text-lg text-muted-foreground">NRP {formatCurrency(pnlTotals.totalCostOfGoodsSold)}</TableHead>
                            <TableHead className={cn("text-right font-bold text-lg", pnlTotals.totalProfit >= 0 ? 'text-green-700' : 'text-destructive')}>
                                NRP {formatCurrency(pnlTotals.totalProfit)}
                            </TableHead>
                            <TableHead className={cn("text-right font-bold text-lg", overallProfitMargin >= 0 ? 'text-green-700' : 'text-destructive')}>
                                {overallProfitMargin.toFixed(1)}%
                            </TableHead>
                        </TableRow>
                    </TableFooter>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">No sales data available to generate a P&L statement.</div>
                )}
              </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="monthly-reports" className="mt-4">
          <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><CalendarClock className="h-5 w-5 text-primary" /> Monthly Reports</CardTitle>
                <CardDescription>Select a report type and expand a month to view detailed records.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Button variant={selectedReportType === 'sales' ? 'default' : 'outline'} onClick={() => setSelectedReportType('sales')}>
                      <TrendingUp className="mr-2 h-4 w-4 text-green-600"/> Monthly Sales
                  </Button>
                  <Button variant={selectedReportType === 'expenses' ? 'default' : 'outline'} onClick={() => setSelectedReportType('expenses')}>
                      <TrendingDown className="mr-2 h-4 w-4 text-red-600"/> Monthly Expenses
                  </Button>
                  <Button variant={selectedReportType === 'acquisitions' ? 'default' : 'outline'} onClick={() => setSelectedReportType('acquisitions')}>
                      <PackagePlus className="mr-2 h-4 w-4 text-blue-600"/> Monthly Acquisitions
                  </Button>
                </div>
                
                <Accordion type="multiple" className="w-full space-y-2">
                    {allMonths.length > 0 ? allMonths.map(monthKey => {
                        const monthDisplay = format(parse(monthKey, 'yyyy-MM', new Date()), 'MMMM yyyy');
                        
                        let totalDisplay = 0;
                        let totalLabel = '';
                        let hasDataForSelectedType = false;
                        let dataForMonth: any;

                        if (selectedReportType === 'sales' && salesByMonth[monthKey]) {
                            dataForMonth = salesByMonth[monthKey];
                            totalDisplay = dataForMonth.total;
                            totalLabel = 'Total Sales';
                            hasDataForSelectedType = true;
                        } else if (selectedReportType === 'expenses' && expensesByMonth[monthKey]) {
                            dataForMonth = expensesByMonth[monthKey];
                            totalDisplay = dataForMonth.total;
                            totalLabel = 'Total Expenses';
                            hasDataForSelectedType = true;
                        } else if (selectedReportType === 'acquisitions' && acquisitionsByMonth[monthKey]) {
                            dataForMonth = acquisitionsByMonth[monthKey];
                            totalDisplay = dataForMonth.total;
                            totalLabel = 'Total Acq. Cost';
                            hasDataForSelectedType = true;
                        }
                        
                        return (
                            <AccordionItem value={monthKey} key={monthKey} className="border rounded-lg">
                                <AccordionTrigger className="px-4 py-3 font-semibold hover:bg-muted/30 rounded-t-lg">
                                    {monthDisplay}
                                    {hasDataForSelectedType ? (
                                        <span className="ml-auto mr-4 text-sm font-normal text-muted-foreground">
                                            {totalLabel}: <span className="font-semibold text-foreground">NRP {formatCurrency(totalDisplay)}</span>
                                        </span>
                                    ) : (
                                        <span className="ml-auto mr-4 text-sm font-normal text-muted-foreground">No {selectedReportType} data</span>
                                    )}
                                </AccordionTrigger>
                                <AccordionContent className="p-4">
                                    {selectedReportType === 'sales' && hasDataForSelectedType && (
                                        <Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Customer</TableHead><TableHead>Items</TableHead><TableHead className="text-right">Amount</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{dataForMonth.sales.map((s: Sale)=>(<TableRow key={s.id}><TableCell>{format(parseISO(s.date), 'dd')}</TableCell><TableCell>{s.customerName}</TableCell><TableCell className="text-xs max-w-xs truncate">{s.items.map(i=>`${i.productName}(${i.quantity})`).join(', ')}</TableCell><TableCell className="text-right">{formatCurrency(s.totalAmount)}</TableCell><TableCell><Badge variant={s.status==='Paid'?'default':'destructive'}>{s.status}</Badge></TableCell></TableRow>))}</TableBody></Table>
                                    )}
                                    {selectedReportType === 'expenses' && hasDataForSelectedType && (
                                        <Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Category</TableHead><TableHead>Description</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader><TableBody>{dataForMonth.expenses.map((e: Expense)=>(<TableRow key={e.id}><TableCell>{format(parseISO(e.date), 'dd')}</TableCell><TableCell>{e.category}</TableCell><TableCell>{e.description}</TableCell><TableCell className="text-right">{formatCurrency(e.amount)}</TableCell></TableRow>))}</TableBody></Table>
                                    )}
                                    {selectedReportType === 'acquisitions' && hasDataForSelectedType && (
                                        <Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Product</TableHead><TableHead>Vendor</TableHead><TableHead className="text-center">Qty</TableHead><TableHead className="text-right">Cost/Unit</TableHead><TableHead className="text-right">Total Cost</TableHead></TableRow></TableHeader><TableBody>{dataForMonth.acquisitions.map((b: any)=>(<TableRow key={b.batchId}><TableCell>{format(parseISO(b.date), 'dd')}</TableCell><TableCell>{b.productName}</TableCell><TableCell>{b.supplierName}</TableCell><TableCell className="text-center">{b.quantityAdded}</TableCell><TableCell className="text-right">{formatCurrency(b.costPricePerUnit)}</TableCell><TableCell className="text-right">{formatCurrency(b.totalBatchCost)}</TableCell></TableRow>))}</TableBody></Table>
                                    )}
                                    {!hasDataForSelectedType && (
                                        <p className="text-center text-muted-foreground py-4">No {selectedReportType} data available for this month.</p>
                                    )}
                                </AccordionContent>
                            </AccordionItem>
                        )
                    }) : <p className="text-center text-muted-foreground py-4">No monthly data available.</p>}
                </Accordion>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="current-assets" className="mt-4">
          <div className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Current Assets Overview</CardTitle>
                <CardDescription>A real-time snapshot of your business's liquid and inventory assets.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <div className="p-4 border rounded-lg"><h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2"><DollarSign/> Cash in Hand</h3><p className="text-2xl font-bold">NRP {formatCurrency(cashInHand)}</p></div>
                  <div className="p-4 border rounded-lg"><h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2"><CreditCard/> Current Digital Balance</h3><p className="text-2xl font-bold">NRP {formatCurrency(currentDigitalBalance)}</p></div>
                  <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20"><h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2"><PiggyBank/> Available Working Capital</h3><p className="text-2xl font-bold text-blue-600 dark:text-blue-400">NRP {formatCurrency(availableWorkingCapital)}</p></div>
                  <div className="p-4 border rounded-lg"><h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Archive/> Inventory Value (Cost)</h3><p className="text-2xl font-bold">NRP {formatCurrency(currentInventoryValue)}</p></div>
                  <div className="p-4 border rounded-lg"><h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2"><FileText/> Accounts Receivable</h3><p className="text-2xl font-bold">NRP {formatCurrency(totalReceivables)}</p></div>
                  <div className="p-4 border rounded-lg bg-muted/50"><h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Wallet/> Total Current Assets</h3><p className="text-2xl font-bold text-primary">NRP {formatCurrency(totalCurrentAssets)}</p></div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
         <TabsContent value="capital" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Cash Capital Management</CardTitle>
                <CardDescription>
                  Set the initial cash-in-hand for the business. This value is the starting point for calculating real-time cash flow.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Important Note</AlertTitle>
                  <AlertDescription>
                    This value should only represent your initial business capital or a manually adjusted amount after a physical cash count. It is not affected by daily sales or expenses.
                  </AlertDescription>
                </Alert>
                <div>
                  <Label htmlFor="initial-capital" className="text-base">Initial Cash in Hand (NRP)</Label>
                  <Input
                    id="initial-capital"
                    type="number"
                    value={capitalInput}
                    onChange={(e) => setCapitalInput(e.target.value)}
                    placeholder="e.g., 50000"
                    className="mt-1 text-lg h-12"
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">Last Updated: {format(parseISO(lastUpdated), "PPP 'at' h:mm a")}</p>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleUpdateCapital} disabled={parseFloat(capitalInput) === initialCapital}>
                  <Save className="mr-2 h-4 w-4" /> Save Cash Capital
                </Button>
              </CardFooter>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Bank/Digital Capital Management</CardTitle>
                <CardDescription>
                  Set the initial bank or digital balance. This value is the starting point for calculating real-time digital balance.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                 <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Important Note</AlertTitle>
                  <AlertDescription>
                    This value should represent your initial digital capital. It is not affected by daily sales or expenses.
                  </AlertDescription>
                </Alert>
                <div>
                  <Label htmlFor="initial-digital-balance" className="text-base">Initial Bank/Digital Balance (NRP)</Label>
                  <Input
                    id="initial-digital-balance"
                    type="number"
                    value={digitalBalanceInput}
                    onChange={(e) => setDigitalBalanceInput(e.target.value)}
                    placeholder="e.g., 100000"
                    className="mt-1 text-lg h-12"
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">Last Updated: {format(parseISO(lastDigitalUpdated), "PPP 'at' h:mm a")}</p>
                </div>
              </CardContent>
              <CardFooter>
                 <Button onClick={handleUpdateDigitalBalance} disabled={parseFloat(digitalBalanceInput) === initialDigitalBalance}>
                    <Save className="mr-2 h-4 w-4" /> Save Digital Balance
                </Button>
              </CardFooter>
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
                You are about to mark sale <strong>{saleToMarkAsPaid.id}</strong> for customer <strong>{saleToMarkAsPaid.customerName}</strong> (Due: NRP {formatCurrency(saleToMarkAsPaid.amountDue)}) as fully paid. This action assumes the full due amount has been received.<br/><br/>To confirm, please type "<strong>YES</strong>" in the box below.
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
