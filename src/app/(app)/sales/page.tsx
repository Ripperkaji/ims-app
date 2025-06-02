
"use client";

import SalesEntryForm from "@/components/sales/SalesEntryForm";
import { useAuth } from "@/contexts/AuthContext";
import { mockSales } from "@/lib/data"; 
import type { Sale } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Eye, Trash2 } from "lucide-react";
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


export default function SalesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Ensure salesData is sorted for admin view
  const [salesData, setSalesData] = useState<Sale[]>(
    [...mockSales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  );

  useEffect(() => {
    // If mockSales itself could be updated by other components and this component needs to reflect it,
    // you might need a more robust state management or a way to listen to changes in mockSales.
    // For now, we sort on init and when a new sale is added via the form on this page.
    setSalesData([...mockSales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  }, []);


  const handleAdjustSale = (saleId: string) => {
    toast({ title: "Action Required", description: `Adjusting sale ${saleId} - (Not Implemented)` });
  };
  
  const handleDeleteSale = (saleId: string) => {
    // setSalesData(salesData.filter(sale => sale.id !== saleId)); // Placeholder for actual deletion
    toast({ title: "Action Required", description: `Deleting sale ${saleId} - (Not Implemented)` });
  };

  const handleSaleAddedByAdmin = (newSale: Sale) => {
    setSalesData(prevSales => 
      [newSale, ...prevSales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    );
    // mockSales is already updated by SalesEntryForm
  };

  if (!user) return null;

  if (user.role === 'staff') {
    return (
      <div>
        <SalesEntryForm /> {/* Staff does not need onSaleAdded as they don't see the table here */}
      </div>
    );
  }

  // Admin View
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold font-headline">Sales Management</h1>
      
      {/* Sales Entry Form for Admin */}
      <div>
        <SalesEntryForm onSaleAdded={handleSaleAddedByAdmin} />
      </div>
      
      {/* All Sales Records Table */}
      <Card className="shadow-lg">
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
                <TableHead>Total Amount</TableHead>
                <TableHead>Payment</TableHead>
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
                  <TableCell>NRP {sale.totalAmount.toFixed(2)}</TableCell>
                  <TableCell>{sale.paymentMethod}</TableCell>
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

