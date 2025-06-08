
"use client";

import { useEffect, useState, useMemo } from 'react';
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

type PayableType = 'supplier' | 'expense';

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
  dueAmount: number;
  date: string;
}

export default function AccountsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [selectedPayableType, setSelectedPayableType] = useState<PayableType>('supplier');

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

  const supplierDueItems = useMemo((): SupplierDueItem[] => {
    const dues: SupplierDueItem[] = [];
    const productAddedLogs = mockLogEntries.filter(log => log.action === "Product Added");

    productAddedLogs.forEach(log => {
      const dueMatchHybrid = log.details.match(/Due: NRP (\d+\.\d+)/);
      const viaDueMatch = log.details.match(/Acquired batch for NRP \d+\.\d+ via Due\./);
      const totalAcquisitionCostMatch = log.details.match(/Acquired batch for NRP (\d+\.\d+) via Due\./);


      let dueAmount = 0;
      if (dueMatchHybrid) {
        dueAmount = parseFloat(dueMatchHybrid[1]);
      } else if (viaDueMatch && totalAcquisitionCostMatch) {
        dueAmount = parseFloat(totalAcquisitionCostMatch[1]);
      }

      if (dueAmount > 0) {
        const productNameMatch = log.details.match(/Product '([^']*)'/);
        const supplierNameMatch = log.details.match(/Supplier: ([^.]+)\./);
        
        dues.push({
          id: log.id,
          productName: productNameMatch ? productNameMatch[1] : "Unknown Product",
          supplierName: supplierNameMatch ? supplierNameMatch[1] : undefined,
          dueAmount: dueAmount,
          date: format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm')
        });
      }
    });
    return dues.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, []);

  const expenseDueItems = useMemo((): ExpenseDueItem[] => {
    const dues: ExpenseDueItem[] = [];
    const expenseRecordedLogs = mockLogEntries.filter(log => log.action === "Expense Recorded");

    expenseRecordedLogs.forEach(log => {
      const dueMatchHybrid = log.details.match(/Due: NRP (\d+\.\d+)/);
      const paidViaDueMatch = log.details.match(/Paid via Due \(NRP (\d+\.\d+)\)\./);

      let dueAmount = 0;
      if (dueMatchHybrid) {
        dueAmount = parseFloat(dueMatchHybrid[1]);
      } else if (paidViaDueMatch) {
        dueAmount = parseFloat(paidViaDueMatch[1]);
      }
      
      if (dueAmount > 0) {
        const descriptionMatch = log.details.match(/Expense for '([^']*)'/);
        const categoryMatch = log.details.match(/\(Category: ([^)]+)\)/);
        
        dues.push({
          id: log.id,
          description: descriptionMatch ? descriptionMatch[1] : "Unknown Expense",
          category: categoryMatch ? categoryMatch[1] : "Unknown Category",
          dueAmount: dueAmount,
          date: format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm')
        });
      }
    });
    return dues.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, []);


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
              View outstanding amounts due to suppliers or for expenses.
              {selectedPayableType === 'supplier' && ` Total Supplier Due: NRP ${totalSupplierDue.toFixed(2)}.`}
              {selectedPayableType === 'expense' && ` Total Expense Due: NRP ${totalExpenseDue.toFixed(2)}.`}
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
                    <TableHead className="text-right">Amount Due</TableHead>
                    <TableHead>Recorded Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenseDueItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.description}</TableCell>
                      <TableCell>{item.category}</TableCell>
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

