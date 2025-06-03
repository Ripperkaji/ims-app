
"use client";

import { useAuth } from "@/contexts/AuthContext";
import { mockSales, mockLogEntries, mockProducts } from "@/lib/data";
import type { Sale, Product, LogEntry, SaleItem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit3, CheckCircle2, Phone, Flag } from "lucide-react";
import { format } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from 'react';
import { useRouter } from "next/navigation";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import ResolveFlagDialog from "@/components/sales/ResolveFlagDialog"; 
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type PaymentMethodSelection = 'Cash' | 'Credit Card' | 'Debit Card' | 'Due' | 'Hybrid';

export default function DueSalesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [currentDueSales, setCurrentDueSales] = useState<Sale[]>([]);
  const [saleToAdjust, setSaleToAdjust] = useState<Sale | null>(null);
  const [saleToMarkAsPaid, setSaleToMarkAsPaid] = useState<Sale | null>(null);
  const [markAsPaidConfirmationInput, setMarkAsPaidConfirmationInput] = useState('');

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

  const openMarkAsPaidDialog = (sale: Sale) => {
    setSaleToMarkAsPaid(sale);
    setMarkAsPaidConfirmationInput('');
  };

  const confirmMarkAsPaid = () => {
    if (!user || !saleToMarkAsPaid) return;

    if (markAsPaidConfirmationInput.trim().toUpperCase() !== 'YES') {
      toast({ title: "Confirmation Error", description: "Please type YES to confirm.", variant: "destructive" });
      return;
    }

    const saleIndex = mockSales.findIndex(s => s.id === saleToMarkAsPaid.id);
    if (saleIndex !== -1) {
      const paidAmount = mockSales[saleIndex].amountDue;
      mockSales[saleIndex].cashPaid += mockSales[saleIndex].amountDue; 
      mockSales[saleIndex].amountDue = 0;
      mockSales[saleIndex].status = 'Paid'; 
      
      addLog("Sale Marked as Paid", `Sale ID ${saleToMarkAsPaid.id.substring(0,8)} for ${mockSales[saleIndex].customerName} marked as fully paid by ${user.name}. Amount cleared: NRP ${paidAmount.toFixed(2)}.`);
      
      // Optimistically update UI for currentDueSales
      setCurrentDueSales(prevSales => prevSales.filter(s => s.id !== saleToMarkAsPaid.id));
      
      toast({ title: "Sale Updated", description: `Sale ${saleToMarkAsPaid.id.substring(0,8)}... marked as Paid.` });
    } else {
      toast({ title: "Error", description: "Sale not found.", variant: "destructive" });
    }
    setSaleToMarkAsPaid(null);
    setMarkAsPaidConfirmationInput('');
  };


  const handleOpenAdjustDialog = (sale: Sale) => {
    setSaleToAdjust(sale);
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

    // Stock Reversion for original items
    originalSale.items.forEach(originalItem => {
      const productIndex = mockProducts.findIndex(p => p.id === originalItem.productId);
      if (productIndex !== -1) {
        mockProducts[productIndex].stock += originalItem.quantity;
      }
    });

    // Stock Deduction for new/adjusted items
    let stockSufficient = true;
    const stockChangesToRollback: { productId: string, quantity: number }[] = [];

    for (const newItem of updatedSaleDataFromDialog.items) {
      const productIndex = mockProducts.findIndex(p => p.id === newItem.productId);
      if (productIndex !== -1) {
        if (mockProducts[productIndex].stock >= newItem.quantity) {
          mockProducts[productIndex].stock -= newItem.quantity;
          stockChangesToRollback.push({ productId: newItem.productId, quantity: newItem.quantity }); // Track successful deductions
        } else {
          toast({ title: "Stock Error", description: `Not enough stock for ${newItem.productName} to make adjustment. Only ${mockProducts[productIndex].stock} available. Adjustment cancelled.`, variant: "destructive"});
          // Rollback stock deductions made in this loop so far
          stockChangesToRollback.forEach(change => {
            const prodIdx = mockProducts.findIndex(p => p.id === change.productId);
            if (prodIdx !== -1) mockProducts[prodIdx].stock += change.quantity;
          });
          // Re-deduct stock for original items (as they were added back initially)
          originalSale.items.forEach(origItem => {
            const prodIdx = mockProducts.findIndex(p => p.id === origItem.productId);
            if (prodIdx !== -1) mockProducts[prodIdx].stock -= origItem.quantity;
          });
          stockSufficient = false;
          break;
        }
      } else {
         toast({ title: "Product Error", description: `Product ${newItem.productName} not found during stock adjustment. Adjustment cancelled.`, variant: "destructive"});
         stockSufficient = false;
         break; 
      }
    }

    if (!stockSufficient) {
      setSaleToAdjust(null);
      return; 
    }
    
    let finalFlaggedComment = originalSale.flaggedComment || "";
    if (originalSale.isFlagged) {
        finalFlaggedComment = `Original Flag: ${originalSale.flaggedComment || 'N/A'}\nResolved by ${user.name} on ${format(new Date(), 'MMM dd, yyyy HH:mm')}: ${adjustmentComment}`;
    } else if (adjustmentComment.trim()) {
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
      isFlagged: originalSale.isFlagged ? false : originalSale.isFlagged, // Clears flag if it was flagged, otherwise keeps current state
      flaggedComment: finalFlaggedComment,
      status: updatedSaleDataFromDialog.amountDue > 0 ? 'Due' : 'Paid',
    };
    
    mockSales[originalSaleIndex] = finalUpdatedSale;
    
    const logAction = originalSale.isFlagged ? "Sale Flag Resolved & Adjusted" : "Sale Adjusted";
    addLog(logAction, `Sale ID ${originalSaleId.substring(0,8)}... details updated by ${user.name}. New Total: NRP ${finalUpdatedSale.totalAmount.toFixed(2)}. Comment: ${adjustmentComment || "N/A"}`);
    
    setCurrentDueSales(mockSales.filter(sale => sale.amountDue > 0)
        .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        
    toast({ title: "Sale Updated", description: `Sale ${originalSaleId.substring(0,8)}... has been updated.` });
    
    setSaleToAdjust(null);
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
                    <Button variant="outline" size="sm" onClick={() => openMarkAsPaidDialog(sale)}>
                      <CheckCircle2 className="mr-2 h-4 w-4" /> Mark as Paid
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => handleOpenAdjustDialog(sale)} title="Adjust Sale">
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

      {saleToMarkAsPaid && (
        <AlertDialog open={!!saleToMarkAsPaid} onOpenChange={(isOpen) => { if (!isOpen) { setSaleToMarkAsPaid(null); setMarkAsPaidConfirmationInput('');} }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Mark as Paid</AlertDialogTitle>
              <AlertDialogDescription>
                You are about to mark sale <strong>{saleToMarkAsPaid.id.substring(0,8)}...</strong> for 
                customer <strong>{saleToMarkAsPaid.customerName}</strong> (Due: NRP {saleToMarkAsPaid.amountDue.toFixed(2)}) as fully paid. 
                This action assumes the full due amount has been received.
                <br/><br/>
                To confirm, please type "<strong>YES</strong>" in the box below.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <Label htmlFor="confirmMarkAsPaidInput" className="sr-only">Type YES to confirm</Label>
              <Input 
                id="confirmMarkAsPaidInput"
                value={markAsPaidConfirmationInput}
                onChange={(e) => setMarkAsPaidConfirmationInput(e.target.value)}
                placeholder='Type YES here'
                autoFocus
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => { setSaleToMarkAsPaid(null); setMarkAsPaidConfirmationInput(''); }}>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmMarkAsPaid} 
                disabled={markAsPaidConfirmationInput.trim().toUpperCase() !== 'YES'}
                className={markAsPaidConfirmationInput.trim().toUpperCase() !== 'YES' ? "bg-primary/50" : ""}
              >
                Confirm Payment
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {saleToAdjust && (
        <ResolveFlagDialog
          sale={saleToAdjust}
          isOpen={!!saleToAdjust}
          onClose={() => setSaleToAdjust(null)}
          onFlagResolved={handleSaleAdjusted} // ResolveFlagDialog expects onFlagResolved
          allGlobalProducts={mockProducts}
        />
      )}
    </div>
  );
}

    