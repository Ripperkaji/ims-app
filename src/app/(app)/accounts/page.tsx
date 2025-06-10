
"use client";

import { useEffect, useState } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Banknote, Landmark } from "lucide-react"; // Changed Users to Banknote
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockLogEntries, mockProducts } from "@/lib/data";
import type { LogEntry, AcquisitionPaymentMethod, ManagedUser, UserRole } from "@/types";
import { format } from 'date-fns';

type PayableType = 'supplier' | 'expense' | '';

interface SupplierDueItem {
  productId: string;
  productName: string;
  batchId: string;
  acquisitionDate: string;
  dueAmount: number;
  supplierName?: string;
  paymentMethod: AcquisitionPaymentMethod;
  totalBatchCost: number;
  cashPaidForBatch: number;
  digitalPaidForBatch: number;
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

  const supplierDueItems: SupplierDueItem[] = [];
  mockProducts.forEach(product => {
    product.acquisitionHistory.forEach(batch => {
      if (batch.dueToSupplier > 0) {
        supplierDueItems.push({
          productId: product.id,
          productName: product.name,
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

    const hybridEntryMatch = log.details.match(/via Hybrid\s*\(([^)]+)\)/i);
    const directDueMatch = log.details.match(/Marked as Due \(NRP ([\d.]+)\)\./i);

    if (hybridEntryMatch && hybridEntryMatch[1]) {
        const detailsStr = hybridEntryMatch[1];
        const cashMatch = detailsStr.match(/Cash:\s*NRP\s*([\d.]+)/i);
        const digitalMatch = detailsStr.match(/Digital:\s*NRP\s*([\d.]+)/i);
        const duePartMatch = detailsStr.match(/Due:\s*NRP\s*([\d.]+)/i);

        if (duePartMatch && duePartMatch[1]) {
            outstandingDue = parseFloat(duePartMatch[1]);
            paymentMethod = "Hybrid";
            if (cashMatch && cashMatch[1]) cashPaid = parseFloat(cashMatch[1]);
            if (digitalMatch && digitalMatch[1]) digitalPaid = parseFloat(digitalMatch[1]);
        }
    } else if (directDueMatch && directDueMatch[1]) {
        outstandingDue = parseFloat(directDueMatch[1]);
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

  const getSupplierPaymentDetails = (item: SupplierDueItem): string => {
    if (!item.paymentMethod) return 'N/A';

    let details = `Method: ${item.paymentMethod}. Batch Cost: NRP ${(item.totalBatchCost).toFixed(2)}. `;
    if (item.paymentMethod === 'Hybrid') {
      details += `(Paid Cash: NRP ${(item.cashPaidForBatch).toFixed(2)}, Paid Digital: NRP ${(item.digitalPaidForBatch).toFixed(2)}, Due: NRP ${(item.dueAmount).toFixed(2)})`;
    } else if (item.paymentMethod === 'Due') {
      details += `(Outstanding Due: NRP ${(item.dueAmount).toFixed(2)})`;
    } else {
      details += `(Batch Fully Paid via ${item.paymentMethod})`;
    }
    return details;
  };


  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
          <Banknote className="h-7 w-7 text-primary" /> Accounts Payable
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
                    <TableHead className="text-right">Due Amount</TableHead>
                    <TableHead>Batch Pmt. Details</TableHead>
                    <TableHead>Acq. Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {supplierDueItems.map((item) => (
                    <TableRow key={item.batchId}
                      ><TableCell className="font-medium">{item.productName}</TableCell
                      ><TableCell>{item.supplierName || "N/A"}</TableCell
                      ><TableCell className="text-right font-semibold text-destructive">NRP {item.dueAmount.toFixed(2)}</TableCell
                      ><TableCell className="text-xs">{getSupplierPaymentDetails(item)}</TableCell
                      ><TableCell>{item.acquisitionDate}</TableCell
                    ></TableRow>
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
                    <TableRow key={item.id}
                      ><TableCell className="font-medium">{item.description}</TableCell
                      ><TableCell>{item.category}</TableCell
                      ><TableCell className="text-right">NRP {item.totalAmount.toFixed(2)}</TableCell
                      ><TableCell>
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
                      </TableCell
                      ><TableCell className="text-right font-semibold text-destructive">NRP {item.dueAmount.toFixed(2)}</TableCell
                      ><TableCell>{item.date}</TableCell
                    ></TableRow>
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
  );
}
