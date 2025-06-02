
"use client";

import SalesEntryForm from "@/components/sales/SalesEntryForm";
import { useAuth } from "@/contexts/AuthContext";
import { mockSales } from "@/lib/data"; 
import type { Sale } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Eye, Trash2, Phone, Flag } from "lucide-react";
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
import { useState, useEffect, useMemo }  from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const getPaymentSummary = (sale: Sale): string => {
  if (sale.formPaymentMethod === 'Hybrid') {
    const parts = [];
    if (sale.cashPaid > 0) parts.push(`Cash: ${sale.cashPaid.toFixed(2)}`);
    if (sale.digitalPaid > 0) parts.push(`Digital: ${sale.digitalPaid.toFixed(2)}`);
    if (sale.amountDue > 0) parts.push(`Due: ${sale.amountDue.toFixed(2)}`);
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
    setSalesData([...mockSales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  }, []);


  const handleAdjustSale = (saleId: string) => {
    toast({ title: "Action Required", description: `Adjusting sale ${saleId} - (Not Implemented)` });
  };
  
  const handleDeleteSale = (saleId: string) => {
    toast({ title: "Action Required", description: `Deleting sale ${saleId} - (Not Implemented)` });
  };

  const handleSaleAdded = () => {
    setSalesData(prevSales => 
      [...mockSales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    );
  };

  const salesByMonth = useMemo(() => {
    if (user?.role !== 'admin') return {};
    const grouped: { [key: string]: Sale[] } = {};
    salesData.forEach(sale => {
      const monthYearKey = format(new Date(sale.date), 'yyyy-MM'); 
      if (!grouped[monthYearKey]) {
        grouped[monthYearKey] = [];
      }
      grouped[monthYearKey].push(sale);
    });
    return grouped;
  }, [salesData, user]);

  const sortedMonthYearKeys = useMemo(() => {
    if (user?.role !== 'admin') return [];
    return Object.keys(salesByMonth).sort((a, b) => b.localeCompare(a));
  }, [salesByMonth, user]);


  if (!user) return null;

  if (user.role === 'staff') {
    return (
      <div>
        <SalesEntryForm onSaleAdded={handleSaleAdded} /> 
      </div>
    );
  }

  // Admin View
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold font-headline">Sales Management</h1>
      <CardDescription>View and manage all recorded sales transactions, grouped by month.</CardDescription>
      
      <div>
        <SalesEntryForm onSaleAdded={handleSaleAdded} />
      </div>
      
      {salesData.length === 0 && (
         <Card className="shadow-lg mt-8">
            <CardHeader>
              <CardTitle>Sales Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                No sales records found.
              </div>
            </CardContent>
          </Card>
      )}

      {salesData.length > 0 && sortedMonthYearKeys.map(monthYearKey => {
        const monthDisplay = format(new Date(monthYearKey + '-01T00:00:00'), 'MMMM yyyy'); // Add T00:00:00 to ensure correct date parsing
        const monthlySales = salesByMonth[monthYearKey];
        
        return (
          <Card key={monthYearKey} className="shadow-lg mt-8">
            <CardHeader>
              <CardTitle>{monthDisplay}</CardTitle>
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
                  {monthlySales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium">{sale.id.substring(0, 8)}...</TableCell>
                      <TableCell>{sale.customerName}</TableCell>
                      <TableCell>
                        {sale.customerContact ? (
                          <a href={`tel:${sale.customerContact}`} className="flex items-center gap-1 text-xs hover:underline text-primary">
                            <Phone className="h-3 w-3" /> {sale.customerContact}
                          </a>
                        ) : <span className="text-xs">N/A</span>}
                      </TableCell>
                      <TableCell>NRP {sale.totalAmount.toFixed(2)}</TableCell>
                      <TableCell>{getPaymentSummary(sale)}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Badge variant={sale.status === 'Paid' ? 'default' : 'destructive'} className={sale.status === 'Paid' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}>
                            {sale.status}
                          </Badge>
                          {sale.isFlagged && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Flag className="h-4 w-4 text-destructive ml-2 cursor-pointer" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{sale.flaggedComment || "Flagged for review"}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
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
            </CardContent>
          </Card>
        )
      })}
    </div>
  );
}

