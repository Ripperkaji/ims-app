
"use client";

import { useAuth } from "@/contexts/AuthContext";
import { mockSales } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, CheckCircle2, Phone } from "lucide-react";
import { format } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useMemo } from 'react';
import type { Sale } from '@/types';
import { useRouter } from "next/navigation";

export default function DueSalesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  // Filter sales that have an amountDue > 0
  const dueSalesList = useMemo(() => mockSales.filter(sale => sale.amountDue > 0)
    .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()), 
    [mockSales] // Assuming mockSales itself might be reactive or re-fetched in a real app
  );
  
  // This local state holds the sales to be displayed. It's initialized from dueSalesList.
  // If mockSales could change from outside, this setup might need adjustments
  // or rely on dueSalesList directly if its re-computation is efficient enough.
  const [currentDueSales, setCurrentDueSales] = useState<Sale[]>(dueSalesList);

  useEffect(() => {
    // Update currentDueSales if the underlying mockSales data changes that affects dueSalesList
     setCurrentDueSales(mockSales.filter(sale => sale.amountDue > 0)
    .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  }, []); // Re-calculate on mount, and if mockSales was a prop, it would be a dependency


  useEffect(() => {
    if (user && user.role !== 'admin') {
      toast({ title: "Access Denied", description: "You do not have permission to view this page.", variant: "destructive"});
      router.push('/dashboard');
    }
  }, [user, router, toast]);

  const handleMarkAsPaid = (saleId: string) => {
    // This would involve finding the sale in mockSales, updating its amountDue to 0,
    // cashPaid or digitalPaid accordingly, and then re-setting currentDueSales or relying on reactivity.
    // For now, just a toast.
    const sale = mockSales.find(s => s.id === saleId);
    if (sale) {
        // Simulate payment: assume remaining due is paid by cash for simplicity
        sale.cashPaid += sale.amountDue;
        sale.amountDue = 0;
        sale.status = 'Paid'; // Update status
        
        // Update the state to reflect the change
        setCurrentDueSales(prevSales => prevSales.filter(s => s.id !== saleId));
        
        toast({ title: "Sale Updated", description: `Sale ${saleId.substring(0,8)}... marked as Paid. Remaining NRP ${sale.totalAmount - sale.cashPaid - sale.digitalPaid} was assumed paid by cash.` });

        // Potentially add to log:
        // addLog("Due Sale Cleared", `Sale ID ${sale.id.substring(0,8)}... for ${sale.customerName} marked as fully paid.`);
    } else {
      toast({ title: "Error", description: "Sale not found.", variant: "destructive" });
    }
  };

  const handleAdjustSale = (saleId: string) => {
    toast({ title: "Action Required", description: `Adjusting sale ${saleId} - (Not Implemented)` });
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">Due Sales Tracking</h1>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Outstanding Payments</CardTitle>
          <CardDescription>List of all sales transactions with an outstanding due amount.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Amount Due</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Recorded By</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentDueSales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell className="font-medium">{sale.id.substring(0,8)}...</TableCell>
                  <TableCell>{sale.customerName}</TableCell>
                  <TableCell>
                    {sale.customerContact ? (
                      <a href={`tel:${sale.customerContact}`} className="flex items-center gap-1 hover:underline text-primary">
                        <Phone className="h-3 w-3" /> {sale.customerContact}
                      </a>
                    ) : 'N/A'}
                  </TableCell>
                  <TableCell>NRP {sale.totalAmount.toFixed(2)}</TableCell>
                  <TableCell className="font-semibold text-destructive">NRP {sale.amountDue.toFixed(2)}</TableCell>
                  <TableCell>{format(new Date(sale.date), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>{sale.createdBy}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleMarkAsPaid(sale.id)}>
                      <CheckCircle2 className="mr-2 h-4 w-4" /> Mark as Paid
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => handleAdjustSale(sale.id)}>
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Adjust Sale</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {currentDueSales.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No due sales records found. Well done!
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
