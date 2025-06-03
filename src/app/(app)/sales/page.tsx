
"use client";

import SalesEntryForm from "@/components/sales/SalesEntryForm";
import { useAuth } from "@/contexts/AuthContext";
import { mockSales, mockLogEntries, mockProducts } from "@/lib/data"; 
import type { Sale, LogEntry, Product, SaleItem } from "@/types"; // Ensure SaleItem is imported
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; 
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Edit, Eye, Trash2, Phone, Flag, AlertTriangle, ShieldCheck, Landmark, Edit3 } from "lucide-react";
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
    // This will re-run if mockSales is externally modified and a re-render is triggered
    setSalesData([...mockSales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  }, []); // Re-run when mockSales reference changes (e.g. after a sale is added/deleted)

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
    const sale = salesData.find(s => s.id === saleId);
    if (sale && user) {
      if (sale.isFlagged) {
        setSaleToResolveFlag(sale);
      } else {
        toast({ title: "Action Required", description: `Adjusting sale ${saleId.substring(0,8)}... - This feature is not fully implemented yet for non-flagged sales.` });
        // Placeholder: Log attempt if needed, or do nothing until full feature is ready
        // addLog("Sale Adjustment Attempted (Non-Flagged)", `Admin ${user.name} attempted to adjust non-flagged sale ${saleId.substring(0,8)}...`);
      }
    } else {
       toast({ title: "Error", description: "Sale not found or user not available.", variant: "destructive"});
    }
  };

  const handleFlagResolved = (
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
          // Not enough stock, revert changes made so far in this attempt
          toast({ title: "Stock Error", description: `Not enough stock for ${newItem.productName} to make adjustment. Only ${mockProducts[productIndex].stock} available. Adjustment cancelled.`, variant: "destructive"});
          // Re-add stock for items already processed in this loop before failure
          for (let i = 0; i < updatedSaleDataFromDialog.items.indexOf(newItem); i++) {
             const prevNewItem = updatedSaleDataFromDialog.items[i];
             const prevProdIdx = mockProducts.findIndex(p => p.id === prevNewItem.productId);
             if (prevProdIdx !== -1) mockProducts[prevProdIdx].stock += prevNewItem.quantity;
          }
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
         stockSufficient = false; // Should ideally also revert previous item stock deductions in this loop
         break; // Or handle more gracefully
      }
    }

    if (!stockSufficient) {
      setSaleToResolveFlag(null); // Close dialog if stock issue
      return; // Stop further processing
    }
    
    const finalFlaggedComment = `Original Flag: ${originalSale.flaggedComment || 'N/A'}\nResolved by ${user.name} on ${format(new Date(), 'MMM dd, yyyy HH:mm')}: ${resolutionComment}`;
    
    const finalUpdatedSale: Sale = {
      ...originalSale, // Preserves original id, date, createdBy
      customerName: updatedSaleDataFromDialog.customerName,
      customerContact: updatedSaleDataFromDialog.customerContact,
      items: updatedSaleDataFromDialog.items,
      totalAmount: updatedSaleDataFromDialog.totalAmount,
      cashPaid: updatedSaleDataFromDialog.cashPaid,
      digitalPaid: updatedSaleDataFromDialog.digitalPaid,
      amountDue: updatedSaleDataFromDialog.amountDue,
      formPaymentMethod: updatedSaleDataFromDialog.formPaymentMethod,
      isFlagged: false, // Flag is now resolved
      flaggedComment: finalFlaggedComment,
      status: updatedSaleDataFromDialog.amountDue > 0 ? 'Due' : 'Paid', // Update status based on new amountDue
    };
    
    mockSales[originalSaleIndex] = finalUpdatedSale;
    
    addLog("Sale Flag Resolved & Adjusted", `Sale ID ${originalSaleId.substring(0,8)}... details updated and flag resolved by ${user.name}. New Total: NRP ${finalUpdatedSale.totalAmount.toFixed(2)}. Resolution: ${resolutionComment}`);
    setSalesData([...mockSales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    toast({ title: "Sale Flag Resolved & Adjusted", description: `Sale ${originalSaleId.substring(0,8)}... has been updated and flag cleared.` });
    
    setSaleToResolveFlag(null); // Close the dialog
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

    // Remove sale from mockSales
    const saleIndex = mockSales.findIndex(s => s.id === saleToDelete.id);
    if (saleIndex > -1) {
      mockSales.splice(saleIndex, 1);
    }
    
    // Update UI
    setSalesData([...mockSales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    
    toast({ title: "Sale Deleted", description: `Sale ${saleToDelete.id.substring(0,8)}... has been deleted.` });
    closeDeleteDialog();
  };

  const handleSaleAdded = () => {
    // This function is called by SalesEntryForm when a new sale is added
    // It ensures the salesData state (and thus the table) is updated
    setSalesData(
      [...mockSales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    );
  };

  const salesByMonth = useMemo(() => {
    if (user?.role !== 'admin') return {}; // Only group for admin
    const grouped: { [key: string]: Sale[] } = {};
    salesData.forEach(sale => {
      const monthYearKey = format(new Date(sale.date), 'yyyy-MM'); // e.g., 2023-10
      if (!grouped[monthYearKey]) {
        grouped[monthYearKey] = [];
      }
      grouped[monthYearKey].push(sale);
    });
    return grouped;
  }, [salesData, user]);

  const sortedMonthYearKeys = useMemo(() => {
    if (user?.role !== 'admin') return [];
    return Object.keys(salesByMonth).sort((a, b) => b.localeCompare(a)); // Sort descending (newest month first)
  }, [salesByMonth, user]);


  if (!user) return null;

  // If user is staff, only show the SalesEntryForm
  if (user.role === 'staff') {
    return (
      <div>
        <SalesEntryForm onSaleAdded={handleSaleAdded} /> 
        {/* Staff might also need to see their recent sales here, similar to dashboard if required */}
      </div>
    );
  }

  // Admin view
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold font-headline">Sales Management</h1>
      <CardDescription>View and manage all recorded sales transactions, grouped by month.</CardDescription>
      
      {/* Sales Entry Form for Admin */}
      <div>
        <SalesEntryForm onSaleAdded={handleSaleAdded} />
      </div>
      
      {/* Sales Table for Admin - Grouped by Month */}
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
        const monthDisplay = format(new Date(monthYearKey + '-01T00:00:00'), 'MMMM yyyy'); // Ensure correct date parsing for format
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
                           {!sale.isFlagged && sale.flaggedComment && ( // Check if there's a comment even if not currently flagged (meaning it was resolved)
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
                        <Button variant="outline" size="icon" onClick={() => handleAdjustSale(sale.id)} title={sale.isFlagged ? "Resolve Flag & Adjust" : "Adjust Sale"}>
                          <Edit3 className="h-4 w-4" />
                          <span className="sr-only">{sale.isFlagged ? "Resolve Flag & Adjust" : "Adjust Sale (Not Implemented)"}</span>
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

      {/* Delete Confirmation Dialog */}
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

      {/* Resolve Flag Dialog */}
      {saleToResolveFlag && (
        <ResolveFlagDialog
          sale={saleToResolveFlag}
          isOpen={!!saleToResolveFlag}
          onClose={() => setSaleToResolveFlag(null)}
          onFlagResolved={handleFlagResolved}
          allGlobalProducts={mockProducts} // Pass all products for selection
        />
      )}
    </div>
  );
}
