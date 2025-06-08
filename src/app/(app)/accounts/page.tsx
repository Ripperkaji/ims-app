
"use client";

import { useEffect, useState } from 'react'; 
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Users, Landmark } from "lucide-react"; 
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockLogEntries } from "@/lib/data";
import type { LogEntry } from "@/types";
import { format } from 'date-fns';

type PayableType = 'supplier' | 'expense' | '';

interface SupplierDueItem {
  id: string;
  productName: string;
  supplierName?: string;
  dueAmount: number;
  date: string;
}

interface ExpenseDueItem {
  id: string;
  description: string;
  category: string;
  totalAmount: number;
  cashPaid?: number;
  digitalPaid?: number;
  dueAmount: number; 
  paymentMethod: string; 
  date: string;
}

export default function AccountsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [selectedPayableType, setSelectedPayableType] = useState<PayableType>('');

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

  // Recalculate supplierDueItems on every render
  const relevantSupplierLogActions = [
    "Product Added",
    "Restock (Same Supplier/Price)",
    "Restock (Same Supplier, New Price)",
    "Restock (New Supplier)"
  ];
  const supplierDueLogs = mockLogEntries.filter(log => relevantSupplierLogActions.includes(log.action));
  const calculatedSupplierDueItems: SupplierDueItem[] = [];

  supplierDueLogs.forEach(log => {
    let dueAmount = 0;
    const productNameMatch = log.details.match(/Product '([^']*)'|Item '([^']*)'/);
    const productActualName = productNameMatch ? (productNameMatch[1] || productNameMatch[2] || "Unknown Product") : "Unknown Product";

    const supplierNameMatch = log.details.match(/Supplier: ([^.]+)\.|New Supplier: ([^.]+)\./);
    const supplierActualName = supplierNameMatch ? (supplierNameMatch[1] || supplierNameMatch[2]) : undefined;

    const hybridEntryMatch = log.details.match(/via Hybrid\.\s*\(([^)]+)\)/i); // Matches "... via Hybrid. (details...)"
    if (hybridEntryMatch) {
        const detailsStr = hybridEntryMatch[1]; // e.g., "Cash: NRP C, Digital: NRP D, Due: NRP E"
        const duePartMatch = detailsStr.match(/Due: NRP ([\d.]+)/i);
        if (duePartMatch && duePartMatch[1]) {
            dueAmount = parseFloat(duePartMatch[1]);
        }
    } else {
        // Not a hybrid payment, or hybrid but not matching the specific pattern above.
        // Check for full 'Due' payments
        if (log.action === "Product Added" && log.details.includes("via Due.")) {
            const directDueInParenMatch = log.details.match(/\(Due: NRP ([\d.]+)\)/i);
            if (directDueInParenMatch && directDueInParenMatch[1]) {
                dueAmount = parseFloat(directDueInParenMatch[1]);
            } else {
                const productAddedFullDueMatch = log.details.match(/Acquired batch for NRP ([\d.]+) via Due\./i);
                if (productAddedFullDueMatch && productAddedFullDueMatch[1]) {
                    dueAmount = parseFloat(productAddedFullDueMatch[1]);
                }
            }
        } else if (relevantSupplierLogActions.slice(1).includes(log.action) && log.details.includes("Paid via Due.")) {
            const directDueInParenMatch = log.details.match(/\(Due: NRP ([\d.]+)\)/i);
            if (directDueInParenMatch && directDueInParenMatch[1]) {
                dueAmount = parseFloat(directDueInParenMatch[1]);
            } else {
                const restockTotalCostMatch = log.details.match(/Batch acquisition cost: NRP ([\d.]+)/i);
                if (restockTotalCostMatch && restockTotalCostMatch[1]) {
                    dueAmount = parseFloat(restockTotalCostMatch[1]);
                }
            }
        }
    }

    if (dueAmount > 0) {
      calculatedSupplierDueItems.push({
        id: log.id,
        productName: productActualName,
        supplierName: supplierActualName,
        dueAmount: dueAmount,
        date: format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm')
      });
    }
  });
  const supplierDueItems = calculatedSupplierDueItems.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());


  // Recalculate expenseDueItems on every render
  const expenseDueExpenseRecordedLogs = mockLogEntries.filter(log => log.action === "Expense Recorded");
  const calculatedExpenseDueItems: ExpenseDueItem[] = [];
  expenseDueExpenseRecordedLogs.forEach(log => {
    const mainDetailMatch = log.details.match(/Expense for '([^']*)' \(Category: ([^)]+)\), Amount: NRP ([\d.]+)/i);
    if (!mainDetailMatch) return;

    const description = mainDetailMatch[1];
    const category = mainDetailMatch[2];
    const totalAmount = parseFloat(mainDetailMatch[3]);
    
    let outstandingDue = 0;
    let cashPaid: number | undefined = undefined;
    let digitalPaid: number | undefined = undefined;
    let paymentMethod = "";

    const hybridPaymentMatch = log.details.match(/Paid via Hybrid \(([^)]+)\)\./i);
    const markedAsDueMatch = log.details.match(/Marked as Due \(NRP ([\d.]+)\)\./i); // For full due
    const paidViaDueMatch = log.details.includes("Paid via Due."); // Alternative for full due logging

    if (hybridPaymentMatch) {
      const partsStr = hybridPaymentMatch[1];
      const cashMatch = partsStr.match(/Cash: NRP ([\d.]+)/i);
      const digitalMatch = partsStr.match(/Digital: NRP ([\d.]+)/i);
      const dueMatch = partsStr.match(/Due: NRP ([\d.]+)/i);

      if (dueMatch) {
        outstandingDue = parseFloat(dueMatch[1]);
        paymentMethod = "Hybrid";
        if (cashMatch) cashPaid = parseFloat(cashMatch[1]);
        if (digitalMatch) digitalPaid = parseFloat(digitalMatch[1]);
      }
    } else if (markedAsDueMatch) {
      outstandingDue = parseFloat(markedAsDueMatch[1]);
      paymentMethod = "Due";
    } else if (paidViaDueMatch && log.details.includes("Amount: NRP")) { // Handle older "Paid via Due." for expenses
        // If "Paid via Due." is present, the due amount is the total amount of the expense.
        outstandingDue = totalAmount;
        paymentMethod = "Due";
    }
    
    if (outstandingDue > 0) {
      calculatedExpenseDueItems.push({
        id: log.id,
        description,
        category,
        totalAmount,
        cashPaid,
        digitalPaid,
        dueAmount: outstandingDue,
        paymentMethod,
        date: format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm')
      });
    }
  });
  const expenseDueItems = calculatedExpenseDueItems.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());


  if (!user || user.role !== 'admin') {
    return null;
  }

  const totalSupplierDue = supplierDueItems.reduce((sum, item) => sum + item.dueAmount, 0);
  const totalExpenseDue = expenseDueItems.reduce((sum, item) => sum + item.dueAmount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
          <Users className="h-7 w-7 text-primary" /> Accounts Management
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
              {selectedPayableType === 'supplier' && ` Total Supplier Due: NRP ${totalSupplierDue.toFixed(2)}.`}
              {selectedPayableType === 'expense' && ` Total Outstanding Expense Due: NRP ${totalExpenseDue.toFixed(2)}.`}
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
                    <TableHead className="text-right">Amount Due</TableHead>
                    <TableHead>Acquisition Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {supplierDueItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.productName}</TableCell>
                      <TableCell>{item.supplierName || 'N/A'}</TableCell>
                      <TableCell className="text-right font-semibold text-destructive">NRP {item.dueAmount.toFixed(2)}</TableCell>
                      <TableCell>{item.date}</TableCell>
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenseDueItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.description}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell className="text-right">NRP {item.totalAmount.toFixed(2)}</TableCell>
                      <TableCell>
                        {item.paymentMethod === "Hybrid" ? (
                          <span className="text-xs">
                            Hybrid (
                            {item.cashPaid !== undefined && item.cashPaid > 0 && `Cash: NRP ${item.cashPaid.toFixed(2)}, `}
                            {item.digitalPaid !== undefined && item.digitalPaid > 0 && `Digital: NRP ${item.digitalPaid.toFixed(2)}, `}
                            Due: NRP {item.dueAmount.toFixed(2)}
                            )
                          </span>
                        ) : (
                          "Fully Due"
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-destructive">NRP {item.dueAmount.toFixed(2)}</TableCell>
                      <TableCell>{item.date}</TableCell>
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

       <div className="p-4 border rounded-lg shadow-sm bg-card mt-6">
        <p className="text-muted-foreground">
          Further user account management functionalities (e.g., adding, editing users) can be implemented here.
        </p>
      </div>
    </div>
  );
}

