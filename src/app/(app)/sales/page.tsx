
"use client";

import SalesEntryForm from "@/components/sales/SalesEntryForm";
import { useAuth } from "@/contexts/AuthContext";
import { mockSales } from "@/lib/data"; 
import type { Sale } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Eye, Trash2, Phone } from "lucide-react";
import { format } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState, useEffect }  from 'react';

const getPaymentSummary = (sale: Sale): string => {
  if (sale.formPaymentMethod === 'Hybrid') {
    const parts = [];
    if (sale.cashPaid > 0) parts.push(`Cash: ${sale.cashPaid.toFixed(2)}`);
    if (sale.digitalPaid > 0) parts.push(`Digital: ${sale.digitalPaid.toFixed(2)}`);
    // amountDue is already covered by status, but can be included if needed for more detail
    // if (sale.amountDue > 0) parts.push(`Due: ${sale.amountDue.toFixed(2)}`);
    return parts.length > 0 ? `Hybrid (${parts.join(', ')})` : 'Hybrid (N/A)';
  }
  return sale.formPaymentMethod;
};


export default function SalesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [salesData, setSalesData] = useState<Sale[]>(
    [...mockSales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  );

  useEffect(() => {
    // This effect ensures that if mockSales is updated elsewhere (e.g. by SalesEntryForm),
    // this component re-renders with the latest sorted data.
    setSalesData([...mockSales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  }, []); // Re-run if mockSales reference changes (it won't if mutated directly, so onSaleAdded is key)


  const handleAdjustSale = (saleId: string) => {
    toast({ title: "Action Required", description: `Adjusting sale ${saleId} - (Not Implemented)` });
  };
  
  const handleDeleteSale = (saleId: string) => {
    toast({ title: "Action Required", description: `Deleting sale ${saleId} - (Not Implemented)` });
  };

  const handleSaleAddedByAdmin = (newSale: Sale) => {
    setSalesData(prevSales => 
      // Add newSale and re-sort. Note: SalesEntryForm now directly updates mockSales
      // so this primarily re-triggers render with the sorted list.
      [...mockSales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    );
  };

  if (!user) return null;

  if (user.role === 'staff') {
    // Staff will also need onSaleAdded if they have a sales list on their view,
    // but currently they only see the form.
    return (
      <div>
        <SalesEntryForm /> 
      </div>
    );
  }

  // Admin View
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold font-headline">Sales Management</h1>
      
      <div>
        <SalesEntryForm onSaleAdded={handleSaleAddedByAdmin} />
      </div>
      
      <Card className="shadow-lg mt-8">
        <CardHeader>
          <CardTitle>All Sales Records</CardTitle>
          <CardDescription>View and manage all recorded sales transactions.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Payment Details</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Recorded By</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {salesData.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell className="font-medium">{sale.id.substring(0, 8)}...</TableCell>
                  <TableCell>{sale.customerName}</TableCell>
                  <TableCell>{sale.customerContact || 'N/A'}</TableCell>
                  <TableCell>NRP {sale.totalAmount.toFixed(2)}</TableCell>
                  <TableCell>{getPaymentSummary(sale)}</TableCell>
                  <TableCell>
                    <Badge variant={sale.status === 'Paid' ? 'default' : 'destructive'} className={sale.status === 'Paid' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}>
                      {sale.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{format(new Date(sale.date), 'MMM dd, yyyy HH:mm')}</TableCell>
                  <TableCell>{sale.createdBy}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="icon" onClick={() => handleAdjustSale(sale.id)}>
                      <Edit className="h-4 w-4" />
                       <span className="sr-only">Adjust Sale</span>
                    </Button>
                     <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon">
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete Sale</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the sale record. (This is a placeholder, no actual deletion will occur).
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteSale(sale.id)}>
                            Continue
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {salesData.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No sales records found.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
