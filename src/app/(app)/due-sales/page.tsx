
"use client";

import { useAuth } from "@/contexts/AuthContext";
import { mockSales, mockLogEntries, mockProducts } from "@/lib/data"; // Added mockProducts
import type { Sale, Product, LogEntry, SaleItem } from '@/types'; // Added Product, SaleItem
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit3, CheckCircle2, Phone, Flag } from "lucide-react"; // Using Edit3 for consistency
import { format } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from 'react';
import { useRouter } from "next/navigation";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"; // Added Tooltip
// Note: ResolveFlagDialog might be renamed or a new AdjustSaleDialog created if functionality differs significantly
// For now, assuming ResolveFlagDialog might be adapted or a similar dialog would be used for adjustments.
// If ResolveFlagDialog is specific to *flagged* sales, a new dialog for general adjustment would be needed.
// For this step, we'll treat "Adjust Sale" as a placeholder.

export default function DueSalesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [currentDueSales, setCurrentDueSales] = useState<Sale[]>([]);

  useEffect(() => {
     const updatedDueSales = mockSales.filter(sale => sale.amountDue > 0)
        .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Sort by date descending
     setCurrentDueSales(updatedDueSales);
  }, []); // Re-evaluate if mockSales changes externally


  useEffect(() => {
    if (user && user.role !== 'admin') {
      toast({ title: "Access Denied", description: "You do not have permission to view this page.", variant: "destructive"});
      router.push('/dashboard');
    }
  }, [user, router, toast]);
  
  const addLog = (action: string, details: string) => {
    if (!user) return;
    const newLog: LogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      user: user.name,
      action,
      details,
    };
    mockLogEntries.unshift(newLog);
    mockLogEntries.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const handleMarkAsPaid = (saleId: string) => {
    if (!user) return;
    const saleIndex = mockSales.findIndex(s => s.id === saleId);
    if (saleIndex !== -1) {
      // Assume the due amount is paid entirely in cash for simplicity here.
      // A more complex form could allow specifying how the due amount was paid.
      mockSales[saleIndex].cashPaid += mockSales[saleIndex].amountDue; 
      const paidAmount = mockSales[saleIndex].amountDue;
      mockSales[saleIndex].amountDue = 0;
      mockSales[saleIndex].status = 'Paid'; 
      
      addLog("Sale Marked as Paid", `Sale ID ${saleId.substring(0,8)} for ${mockSales[saleIndex].customerName} marked as fully paid by ${user.name}. Amount cleared: NRP ${paidAmount.toFixed(2)}.`);
      setCurrentDueSales(prevSales => prevSales.filter(s => s.id !== saleId));
      toast({ title: "Sale Updated", description: `Sale ${saleId.substring(0,8)}... marked as Paid.` });
    } else {
      toast({ title: "Error", description: "Sale not found.", variant: "destructive" });
    }
  };

  const handleAdjustSale = (saleId: string) => {
    // This is a placeholder. Full adjustment would require a dialog similar to ResolveFlagDialog
    // but generalized for any sale adjustment (items, quantities, payment etc.)
    // It would also need to handle stock updates carefully.
    toast({ 
      title: "Feature Placeholder", 
      description: `Adjusting sale ${saleId.substring(0,8)}... - This feature is not fully implemented yet.`,
      variant: "default"
    });
    // Example Log:
    // addLog("Sale Adjustment Attempted (Due Sales)", `Admin ${user?.name} attempted to adjust due sale ${saleId.substring(0,8)}...`);
  };


  if (!user || user.role !== 'admin') {
    // This will be handled by redirect, but good to have a fallback UI or null.
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
                <TableHead>Flagged</TableHead>
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
                    ) : <span className="text-xs">N/A</span>}
                  </TableCell>
                  <TableCell>NRP {sale.totalAmount.toFixed(2)}</TableCell>
                  <TableCell className="font-semibold text-destructive">NRP {sale.amountDue.toFixed(2)}</TableCell>
                  <TableCell>
                    {sale.isFlagged ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Flag className="h-4 w-4 text-destructive cursor-pointer" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs whitespace-pre-wrap">{sale.flaggedComment || "Flagged for review"}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <span>No</span>
                    )}
                  </TableCell>
                  <TableCell>{format(new Date(sale.date), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>{sale.createdBy}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleMarkAsPaid(sale.id)}>
                      <CheckCircle2 className="mr-2 h-4 w-4" /> Mark as Paid
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => handleAdjustSale(sale.id)} title="Adjust Sale">
                      <Edit3 className="h-4 w-4" />
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
      {/* Placeholder for AdjustSaleDialog if implemented for this page */}
      {/* {saleToAdjust && <AdjustSaleDialog sale={saleToAdjust} ... />} */}
    </div>
  );
}
