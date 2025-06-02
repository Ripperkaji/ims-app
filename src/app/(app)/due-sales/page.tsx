
"use client";

import { useAuth } from "@/contexts/AuthContext";
import { mockSales, mockProducts, mockLogEntries } from "@/lib/data"; // Added mockProducts and mockLogEntries
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Added Input
import { Label } from "@/components/ui/label"; // Added Label
import { Edit3, CheckCircle2, Phone, Edit } from "lucide-react"; // Using Edit3 for consistency
import { format } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useMemo } from 'react';
import type { Sale, Product, LogEntry, SaleItem } from '@/types'; // Added Product, LogEntry, SaleItem
import { useRouter } from "next/navigation";
import AdjustSaleDialog from "@/components/sales/AdjustSaleDialog"; // Added AdjustSaleDialog
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"; // Added AlertDialog components

type PaymentMethodSelection = 'Cash' | 'Credit Card' | 'Debit Card' | 'Due' | 'Hybrid';

export default function DueSalesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [currentDueSales, setCurrentDueSales] = useState<Sale[]>([]);
  const [saleToAdjust, setSaleToAdjust] = useState<Sale | null>(null);
  const [saleToMarkAsPaid, setSaleToMarkAsPaid] = useState<Sale | null>(null);
  const [markAsPaidConfirmationInput, setMarkAsPaidConfirmationInput] = useState<string>("");

  useEffect(() => {
     const updatedDueSales = mockSales.filter(sale => sale.amountDue > 0)
        .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
     setCurrentDueSales(updatedDueSales);
  }, []); 


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

  const handleOpenAdjustDialog = (saleId: string) => {
    const sale = currentDueSales.find(s => s.id === saleId);
    if (sale) {
      setSaleToAdjust(sale);
    } else {
      toast({ title: "Error", description: "Sale not found for adjustment.", variant: "destructive" });
    }
  };

  const handleSaleAdjusted = (
    originalSaleId: string,
    updatedSaleDataFromDialog: Partial<Sale> & {
        customerName: string;
        customerContact?: string;
        items: SaleItem[];
        totalAmount: number;
        formPaymentMethod: PaymentMethodSelection;
        cashPaid: number;
        digitalPaid: number;
        amountDue: number;
    },
    adjustmentComment: string
  ) => {
    const originalSaleIndex = mockSales.findIndex(s => s.id === originalSaleId);
    if (originalSaleIndex === -1 || !user) {
      toast({ title: "Error", description: "Original sale not found or user not available.", variant: "destructive"});
      return;
    }
    const originalSale = mockSales[originalSaleIndex];
    const wasInitiallyFlagged = originalSale.isFlagged;

    originalSale.items.forEach(originalItem => {
      const productIndex = mockProducts.findIndex(p => p.id === originalItem.productId);
      if (productIndex !== -1) {
        mockProducts[productIndex].stock += originalItem.quantity;
      }
    });

    let stockSufficient = true;
    for (const newItem of updatedSaleDataFromDialog.items) {
      const productIndex = mockProducts.findIndex(p => p.id === newItem.productId);
      if (productIndex !== -1) {
        if (mockProducts[productIndex].stock >= newItem.quantity) {
          mockProducts[productIndex].stock -= newItem.quantity;
        } else {
          toast({ title: "Stock Error", description: `Not enough stock for ${newItem.productName}.`, variant: "destructive"});
          stockSufficient = false; // Revert stock changes made so far in this adjustment attempt.
           updatedSaleDataFromDialog.items.slice(0, updatedSaleDataFromDialog.items.indexOf(newItem)).forEach(revertedItem => {
            const revertedProductIndex = mockProducts.findIndex(p => p.id === revertedItem.productId);
            if (revertedProductIndex !== -1) mockProducts[revertedProductIndex].stock += revertedItem.quantity;
          });
          originalSale.items.forEach(originalItem => { // Add back original items stock
            const productIndexRevert = mockProducts.findIndex(p => p.id === originalItem.productId);
            if (productIndexRevert !== -1) mockProducts[productIndexRevert].stock -= originalItem.quantity;
          });
          break;
        }
      }
    }

    if (!stockSufficient) {
      setSaleToAdjust(null);
      return;
    }

    let finalFlaggedComment = originalSale.flaggedComment || "";
    if (wasInitiallyFlagged) { // This sale was flagged and is now being resolved via adjustment
        finalFlaggedComment = `Original Flag: ${originalSale.flaggedComment || 'N/A'}\nResolved by ${user.name} on ${format(new Date(), 'MMM dd, yyyy HH:mm')}: ${adjustmentComment}`;
    } else if (adjustmentComment) { // This sale was not flagged, just adjusted with a comment
        finalFlaggedComment = `Adjusted by ${user.name} on ${format(new Date(), 'MMM dd, yyyy HH:mm')}: ${adjustmentComment}`;
    }
    
    const finalUpdatedSale: Sale = {
      ...originalSale,
      customerName: updatedSaleDataFromDialog.customerName,
      customerContact: updatedSaleDataFromDialog.customerContact,
      items: updatedSaleDataFromDialog.items,
      totalAmount: updatedSaleDataFromDialog.totalAmount,
      cashPaid: updatedSaleDataFromDialog.cashPaid,
      digitalPaid: updatedSaleDataFromDialog.digitalPaid,
      amountDue: updatedSaleDataFromDialog.amountDue,
      formPaymentMethod: updatedSaleDataFromDialog.formPaymentMethod,
      isFlagged: updatedSaleDataFromDialog.amountDue > 0 ? originalSale.isFlagged : false, // Clear flag if paid off by adjustment
      flaggedComment: finalFlaggedComment,
      status: updatedSaleDataFromDialog.amountDue > 0 ? 'Due' : 'Paid',
    };
    
    mockSales[originalSaleIndex] = finalUpdatedSale;
    
    const logAction = wasInitiallyFlagged ? "Sale Flag Resolved & Adjusted" : "Sale Adjusted";
    addLog(logAction, `Sale ID ${originalSaleId.substring(0,8)}... details updated by ${user.name}. New Total: NRP ${finalUpdatedSale.totalAmount.toFixed(2)}. Comment: ${adjustmentComment || "N/A"}`);
    
    setCurrentDueSales(mockSales.filter(sale => sale.amountDue > 0).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    toast({ title: logAction, description: `Sale ${originalSaleId.substring(0,8)}... has been updated.` });
    setSaleToAdjust(null);
  };


  const openMarkAsPaidDialog = (saleId: string) => {
    const sale = currentDueSales.find(s => s.id === saleId);
    if (sale) {
      setSaleToMarkAsPaid(sale);
      setMarkAsPaidConfirmationInput("");
    }
  };

  const confirmAndMarkAsPaid = () => {
    if (!saleToMarkAsPaid || !user) return;

    const saleIndex = mockSales.findIndex(s => s.id === saleToMarkAsPaid.id);
    if (saleIndex !== -1) {
        // Assume due amount is paid in cash. This could be made more flexible.
        mockSales[saleIndex].cashPaid += mockSales[saleIndex].amountDue; 
        const paidAmount = mockSales[saleIndex].amountDue;
        mockSales[saleIndex].amountDue = 0;
        mockSales[saleIndex].status = 'Paid'; 
        
        addLog("Sale Marked as Paid", `Sale ID ${saleToMarkAsPaid.id.substring(0,8)} for ${saleToMarkAsPaid.customerName} marked as fully paid by ${user.name}. Amount cleared: NRP ${paidAmount.toFixed(2)}.`);
        setCurrentDueSales(prevSales => prevSales.filter(s => s.id !== saleToMarkAsPaid.id));
        toast({ title: "Sale Updated", description: `Sale ${saleToMarkAsPaid.id.substring(0,8)}... marked as Paid.` });
    } else {
      toast({ title: "Error", description: "Sale not found.", variant: "destructive" });
    }
    setSaleToMarkAsPaid(null);
    setMarkAsPaidConfirmationInput("");
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
                    ) : <span className="text-xs">N/A</span>}
                  </TableCell>
                  <TableCell>NRP {sale.totalAmount.toFixed(2)}</TableCell>
                  <TableCell className="font-semibold text-destructive">NRP {sale.amountDue.toFixed(2)}</TableCell>
                  <TableCell>{format(new Date(sale.date), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>{sale.createdBy}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => openMarkAsPaidDialog(sale.id)}>
                      <CheckCircle2 className="mr-2 h-4 w-4" /> Mark as Paid
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => handleOpenAdjustDialog(sale.id)} title="Adjust Sale">
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

      {saleToAdjust && (
        <AdjustSaleDialog
          sale={saleToAdjust}
          isOpen={!!saleToAdjust}
          onClose={() => setSaleToAdjust(null)}
          onSaleAdjusted={handleSaleAdjusted}
          allGlobalProducts={mockProducts}
          isInitiallyFlagged={saleToAdjust.isFlagged || false}
        />
      )}

      {saleToMarkAsPaid && (
        <AlertDialog open={!!saleToMarkAsPaid} onOpenChange={(isOpen) => { if (!isOpen) setSaleToMarkAsPaid(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Mark as Paid</AlertDialogTitle>
              <AlertDialogDescription>
                To mark sale <strong>{saleToMarkAsPaid.id.substring(0,8)}...</strong> for customer <strong>{saleToMarkAsPaid.customerName}</strong> (Due: NRP {saleToMarkAsPaid.amountDue.toFixed(2)}) as fully paid, please type "YES" in the box below.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4 space-y-2">
              <Label htmlFor="confirmMarkAsPaidInput">Type YES to confirm</Label>
              <Input
                id="confirmMarkAsPaidInput"
                value={markAsPaidConfirmationInput}
                onChange={(e) => setMarkAsPaidConfirmationInput(e.target.value)}
                placeholder='Type "YES" here'
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setSaleToMarkAsPaid(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmAndMarkAsPaid}
                disabled={markAsPaidConfirmationInput.trim().toLowerCase() !== 'yes'}
              >
                Confirm Payment
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

    