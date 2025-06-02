
"use client";

import SalesEntryForm from "@/components/sales/SalesEntryForm";
import { useAuth } from "@/contexts/AuthContext";
import { mockSales, mockLogEntries } from "@/lib/data"; 
import type { Sale, LogEntry } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Keep if needed for other features, not directly for delete comment
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Edit, Eye, Trash2, Phone, Flag, AlertTriangle } from "lucide-react";
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
  // AlertDialogTrigger, // Trigger will be handled manually by the button
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

  const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null);
  const [deleteReason, setDeleteReason] = useState<string>("");

  useEffect(() => {
    setSalesData([...mockSales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  }, []); // Runs on initial mount

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
    const sale = mockSales.find(s => s.id === saleId);
    if (sale && user) {
      addLog("Sale Adjustment Attempted", `Admin ${user.name} attempted to adjust sale ID ${saleId.substring(0,8)}... for ${sale.customerName}. (Feature not fully implemented).`);
      toast({ 
        title: "Action Required", 
        description: `Adjusting sale ${saleId.substring(0,8)}... - This feature is not fully implemented yet.` 
      });
    }
  };
  
  const openDeleteDialog = (sale: Sale) => {
    setSaleToDelete(sale);
    setDeleteReason(""); // Reset reason when opening dialog
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
                        <Button variant="outline" size="icon" onClick={() => handleAdjustSale(sale.id)} title="Adjust Sale">
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Adjust Sale</span>
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
                Are you sure you want to delete sale <strong>{saleToDelete.id.substring(0,8)}...</strong> for customer <strong>{saleToDelete.customerName}</strong> (Total: NRP {saleToDelete.totalAmount.toFixed(2)})? This action cannot be undone.
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
    </div>
  );
}
