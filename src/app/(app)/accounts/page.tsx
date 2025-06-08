
"use client";

import { useEffect, useState } from 'react'; 
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Users, Landmark } from "lucide-react"; 
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockLogEntries, mockProducts } from "@/lib/data"; // Added mockProducts
import type { LogEntry, Product, AcquisitionPaymentMethod } from "@/types"; // Added Product and AcquisitionPaymentMethod
import { format } from 'date-fns';

type PayableType = 'supplier' | 'expense' | '';

interface SupplierDueItem {
  id: string; // product.id
  productName: string;
  dueAmount: number;
  lastAcquisitionPaymentMethod?: AcquisitionPaymentMethod;
  lastAcquisitionTotalCost?: number;
  lastAcquisitionCashPaid?: number;
  lastAcquisitionDigitalPaid?: number;
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

  // Calculate supplierDueItems directly from mockProducts
  const supplierDueItems: SupplierDueItem[] = mockProducts
    .filter(product => (product.lastAcquisitionDueToSupplier ?? 0) > 0)
    .map(product => ({
      id: product.id,
      productName: product.name,
      dueAmount: product.lastAcquisitionDueToSupplier ?? 0,
      lastAcquisitionPaymentMethod: product.lastAcquisitionPaymentMethod,
      lastAcquisitionTotalCost: product.lastAcquisitionTotalCost,
      lastAcquisitionCashPaid: product.lastAcquisitionCashPaid,
      lastAcquisitionDigitalPaid: product.lastAcquisitionDigitalPaid,
    }))
    .sort((a, b) => a.productName.localeCompare(b.productName));


  // Calculate expenseDueItems directly without useMemo
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
    const markedAsDueMatch = log.details.match(/Marked as Due \(NRP ([\d.]+)\)\./i); 
    const paidViaDueMatch = log.details.includes("Paid via Due."); 

    if (hybridPaymentMatch && hybridPaymentMatch[1]) {
      const partsStr = hybridPaymentMatch[1];
      const cashMatch = partsStr.match(/Cash:\s*NRP\s*([\d.]+)/i);
      const digitalMatch = partsStr.match(/Digital:\s*NRP\s*([\d.]+)/i);
      const dueMatch = partsStr.match(/Due:\s*NRP\s*([\d.]+)/i);

      if (dueMatch && dueMatch[1]) {
        outstandingDue = parseFloat(dueMatch[1]);
        paymentMethod = "Hybrid";
        if (cashMatch && cashMatch[1]) cashPaid = parseFloat(cashMatch[1]);
        if (digitalMatch && digitalMatch[1]) digitalPaid = parseFloat(digitalMatch[1]);
      }
    } else if (markedAsDueMatch && markedAsDueMatch[1]) {
      outstandingDue = parseFloat(markedAsDueMatch[1]);
      paymentMethod = "Due";
    } else if (paidViaDueMatch && log.details.includes("Amount: NRP")) { 
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

  const getSupplierPaymentDetails = (item: SupplierDueItem): string => {
    if (!item.lastAcquisitionPaymentMethod) return 'N/A';
    
    let details = `Method: ${item.lastAcquisitionPaymentMethod}. Total Batch Cost: NRP ${(item.lastAcquisitionTotalCost ?? 0).toFixed(2)}. `;
    if (item.lastAcquisitionPaymentMethod === 'Hybrid') {
      details += `(Paid Cash: NRP ${(item.lastAcquisitionCashPaid ?? 0).toFixed(2)}, Paid Digital: NRP ${(item.lastAcquisitionDigitalPaid ?? 0).toFixed(2)}, Due: NRP ${(item.dueAmount).toFixed(2)})`;
    } else if (item.lastAcquisitionPaymentMethod === 'Due') {
      details += `(Outstanding Due: NRP ${(item.dueAmount).toFixed(2)})`;
    } else {
      details += `(Fully Paid via ${item.lastAcquisitionPaymentMethod})`;
    }
    return details;
  };


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
                    <TableHead className="text-right">Amount Due</TableHead>
                    <TableHead>Last Batch Payment Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {supplierDueItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.productName}</TableCell>
                      <TableCell className="text-right font-semibold text-destructive">NRP {item.dueAmount.toFixed(2)}</TableCell>
                      <TableCell className="text-xs">{getSupplierPaymentDetails(item)}</TableCell>
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
