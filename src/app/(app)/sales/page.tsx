
"use client";

import SalesEntryForm from "@/components/sales/SalesEntryForm";
import { useAuth } from "@/contexts/AuthContext";
import { mockSales, mockLogEntries, mockProducts } from "@/lib/data"; 
import type { Sale, LogEntry, Product } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; 
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Edit, Eye, Trash2, Phone, Flag, AlertTriangle, ShieldCheck, Landmark } from "lucide-react";
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
} from "@/components/ui/alert-dialog";
import { useState, useEffect, useMemo }  from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import ResolveFlagDialog from "@/components/sales/ResolveFlagDialog";

type PaymentMethodSelection = 'Cash' | 'Credit Card' | 'Debit Card' | 'Due' | 'Hybrid';


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

  const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null);
  const [deleteReason, setDeleteReason] = useState<string>("");

  const [saleToResolveFlag, setSaleToResolveFlag] = useState<Sale | null>(null);

  useEffect(() => {
    // Initial load and sort
    setSalesData([...mockSales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  }, []); 

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

  const handleAdjustSale = (saleId: string) => {
    const sale = salesData.find(s => s.id === saleId); // Use salesData to find the sale
    if (sale && user) {
      if (sale.isFlagged) {
        setSaleToResolveFlag(sale);
      } else {
        addLog("Sale Adjustment Attempted", `Admin ${user.name} attempted to adjust sale ID ${saleId.substring(0,8)}... for ${sale.customerName}. (Feature not fully implemented for non-flagged sales).`);
        toast({ 
          title: "Adjust Sale", 
          description: `Adjusting sale ${saleId.substring(0,8)}... - This feature is not fully implemented yet for non-flagged sales.` 
        });
      }
    }
  };

  const handleFlagResolved = (
    originalSaleId: string, 
    updatedSaleDataFromDialog: Partial<Sale> & { // More specific type
        customerName: string;
        customerContact?: string;
        items: SaleItem[];
        totalAmount: number;
        formPaymentMethod: PaymentMethodSelection;
        cashPaid: number;
        digitalPaid: number;
        amountDue: number;
    }, 
    resolutionComment: string
  ) => {
    const originalSaleIndex = mockSales.findIndex(s => s.id === originalSaleId);
    if (originalSaleIndex === -1 || !user) {
      toast({ title: "Error", description: "Original sale not found or user not available.", variant: "destructive"});
      return;
    }
    const originalSale = mockSales[originalSaleIndex];

    // 1. Revert stock for original items
    originalSale.items.forEach(originalItem => {
      const productIndex = mockProducts.findIndex(p => p.id === originalItem.productId);
      if (productIndex !== -1) {
        mockProducts[productIndex].stock += originalItem.quantity;
      }
    });

    // 2. Deduct stock for new/adjusted items
    let stockSufficient = true;
    for (const newItem of updatedSaleDataFromDialog.items) {
      const productIndex = mockProducts.findIndex(p => p.id === newItem.productId);
      if (productIndex !== -1) {
        if (mockProducts[productIndex].stock >= newItem.quantity) {
          mockProducts[productIndex].stock -= newItem.quantity;
        } else {
          // Not enough stock for the new item quantity, revert previous stock changes and abort
          toast({ title: "Stock Error", description: `Not enough stock for ${newItem.productName} to make adjustment. Only ${mockProducts[productIndex].stock} available.`, variant: "destructive"});
          // Re-add stock for items processed so far in this loop
          for (let i = 0; i < updatedSaleDataFromDialog.items.indexOf(newItem); i++) {
             const prevNewItem = updatedSaleDataFromDialog.items[i];
             const prevProdIdx = mockProducts.findIndex(p => p.id === prevNewItem.productId);
             if (prevProdIdx !== -1) mockProducts[prevProdIdx].stock += prevNewItem.quantity;
          }
          // Re-deduct stock for original items (as if the operation failed)
          originalSale.items.forEach(origItem => {
            const prodIdx = mockProducts.findIndex(p => p.id === origItem.productId);
            if (prodIdx !== -1) mockProducts[prodIdx].stock -= origItem.quantity;
          });
          stockSufficient = false;
          break;
        }
      } else {
         toast({ title: "Product Error", description: `Product ${newItem.productName} not found during stock adjustment.`, variant: "destructive"});
         stockSufficient = false;
         break; 
      }
    }

    if (!stockSufficient) {
      setSaleToResolveFlag(null); // Close dialog
      // No need to refresh salesData as no sale was actually updated
      return; // Abort if stock adjustment failed
    }
    
    // 3. Construct the final updated sale object
    const finalUpdatedSale: Sale = {
      ...originalSale, // Start with original to keep id, date, createdBy
      customerName: updatedSaleDataFromDialog.customerName,
      customerContact: updatedSaleDataFromDialog.customerContact,
      items: updatedSaleDataFromDialog.items,
      totalAmount: updatedSaleDataFromDialog.totalAmount,
      cashPaid: updatedSaleDataFromDialog.cashPaid,
      digitalPaid: updatedSaleDataFromDialog.digitalPaid,
      amountDue: updatedSaleDataFromDialog.amountDue,
      formPaymentMethod: updatedSaleDataFromDialog.formPaymentMethod,
      isFlagged: false,
      flaggedComment: `Original: ${originalSale.flaggedComment || 'N/A'}\nResolved by ${user.name} on ${format(new Date(), 'MMM dd, yyyy HH:mm')}: ${resolutionComment}`,
      status: updatedSaleDataFromDialog.amountDue > 0 ? 'Due' : 'Paid',
    };
    
    mockSales[originalSaleIndex] = finalUpdatedSale;
    
    addLog("Sale Flag Resolved & Adjusted", `Flag for sale ID ${originalSaleId.substring(0,8)}... resolved and adjusted by ${user.name}. New Total: NRP ${finalUpdatedSale.totalAmount.toFixed(2)}. Resolution: ${resolutionComment}`);
    setSalesData([...mockSales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    toast({ title: "Flag Resolved & Sale Adjusted", description: `Sale ${originalSaleId.substring(0,8)}... has been updated.` });
    
    setSaleToResolveFlag(null);
  };
  
  const openDeleteDialog = (sale: Sale) => {
    setSaleToDelete(sale);
    setDeleteReason(""); 
  };

  const closeDeleteDialog = () => {
    setSaleToDelete(null);
    setDeleteReason("");
  };

  const handleConfirmDelete = () => {
    if (!saleToDelete) return;
    if (!deleteReason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for deleting this sale.",
        variant: "destructive",
      });
      return;
    }

    // Revert stock for deleted sale items
    saleToDelete.items.forEach(item => {
      const productIndex = mockProducts.findIndex(p => p.id === item.productId);
      if (productIndex !== -1) {
        mockProducts[productIndex].stock += item.quantity;
      }
    });

    if (user) {
      addLog(
        "Sale Deleted", 
        `Sale ID ${saleToDelete.id.substring(0,8)}... (Customer: ${saleToDelete.customerName}, Amount: NRP ${saleToDelete.totalAmount.toFixed(2)}) deleted by ${user.name}. Reason: ${deleteReason}`
      );
    }

    const saleIndex = mockSales.findIndex(s => s.id === saleToDelete.id);
    if (saleIndex > -1) {
      mockSales.splice(saleIndex, 1);
    }
    
    setSalesData([...mockSales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    
    toast({ title: "Sale Deleted", description: `Sale ${saleToDelete.id.substring(0,8)}... has been deleted.` });
    closeDeleteDialog();
  };

  const handleSaleAdded = () => {
    setSalesData(
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
        const monthDisplay = format(new Date(monthYearKey + '-01T00:00:00'), 'MMMM yyyy');
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
                    <TableRow key={sale.id} className={sale.isFlagged ? 'bg-yellow-100/50 dark:bg-yellow-900/20' : ''}>
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
                        <div className="flex items-center space-x-1">
                          <Badge variant={sale.status === 'Paid' ? 'default' : 'destructive'} className={sale.status === 'Paid' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}>
                            {sale.status}
                          </Badge>
                          {sale.amountDue > 0 && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <AlertTriangle className="h-4 w-4 text-orange-500 cursor-default" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Outstanding: NRP {sale.amountDue.toFixed(2)}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          {sale.isFlagged && (
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
                          )}
                           {!sale.isFlagged && sale.flaggedComment && ( // Show resolved icon if not flagged but has a comment
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <ShieldCheck className="h-4 w-4 text-green-600 cursor-default" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs whitespace-pre-wrap">{sale.flaggedComment}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{format(new Date(sale.date), 'MMM dd, yyyy HH:mm')}</TableCell>
                      <TableCell>{sale.createdBy}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="icon" onClick={() => handleAdjustSale(sale.id)} title={sale.isFlagged ? "Resolve Flag & Adjust" : "Adjust Sale (Placeholder)"}>
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">{sale.isFlagged ? "Resolve Flag & Adjust" : "Adjust Sale"}</span>
                        </Button>
                        <Button variant="destructive" size="icon" onClick={() => openDeleteDialog(sale)} title="Delete Sale">
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete Sale</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )
      })}

      {saleToDelete && (
        <AlertDialog open={!!saleToDelete} onOpenChange={(isOpen) => { if (!isOpen) closeDeleteDialog(); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Sale Deletion</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete sale <strong>{saleToDelete.id.substring(0,8)}...</strong> for customer <strong>{saleToDelete.customerName}</strong> (Total: NRP {saleToDelete.totalAmount.toFixed(2)})? This action cannot be undone. Stock for items in this sale will be reverted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4 space-y-2">
              <Label htmlFor="deleteReason">Reason for Deletion (Required)</Label>
              <Textarea
                id="deleteReason"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="E.g., Duplicate entry, incorrect sale, etc."
                rows={3}
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={closeDeleteDialog}>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleConfirmDelete} 
                disabled={!deleteReason.trim()}
                className={!deleteReason.trim() ? "bg-destructive/50" : "bg-destructive hover:bg-destructive/90"}
              >
                Confirm Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {saleToResolveFlag && (
        <ResolveFlagDialog
          sale={saleToResolveFlag}
          isOpen={!!saleToResolveFlag}
          onClose={() => setSaleToResolveFlag(null)}
          onFlagResolved={handleFlagResolved}
          allGlobalProducts={mockProducts} // Pass current global products
        />
      )}
    </div>
  );
}

// Minor alias to avoid tsx conflict in this file
const DialogCardHeader = CardHeader;
const DialogCardDescription = CardDescription;
const DialogCardTitle = CardTitle;
const DialogCard = Card;
