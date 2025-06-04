"use client";

import SalesEntryForm from "@/components/sales/SalesEntryForm";
import { useAuth } from "@/contexts/AuthContext";
import { mockSales, mockLogEntries, mockProducts } from "@/lib/data"; 
import type { Sale, LogEntry, Product, SaleItem } from "@/types"; 
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; 
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, Eye, Trash2, Phone, Flag, AlertTriangle, ShieldCheck, Landmark, Edit3, CalendarIcon, ListFilter, X, Filter as FilterIcon } from "lucide-react";
import { format, startOfDay, endOfDay, isValid, parse } from 'date-fns';
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
import AdjustSaleDialog from "@/components/sales/AdjustSaleDialog"; 
import { cn } from "@/lib/utils";

type PaymentMethodSelection = 'Cash' | 'Credit Card' | 'Debit Card' | 'Due' | 'Hybrid';
type FilterStatusType = "all" | "flagged" | "due" | "paid" | "resolvedFlagged";

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
  
  const [allSalesData, setAllSalesData] = useState<Sale[]>(
    [...mockSales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  );
  const [displayedSales, setDisplayedSales] = useState<Sale[]>(allSalesData);

  const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null);
  const [deleteReason, setDeleteReason] = useState<string>("");
  const [saleToAdjust, setSaleToAdjust] = useState<Sale | null>(null);

  // Filter states
  const [filterDate, setFilterDate] = useState<Date | undefined>(undefined);
  const [filterMonthYear, setFilterMonthYear] = useState<string>(''); // YYYY-MM
  const [filterStatus, setFilterStatus] = useState<FilterStatusType>('all');
  const [filterCommentText, setFilterCommentText] = useState<string>('');
  const [isFilterActive, setIsFilterActive] = useState<boolean>(false);
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState<boolean>(false);

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    allSalesData.forEach(sale => {
      months.add(format(new Date(sale.date), 'yyyy-MM'));
    });
    return Array.from(months).sort((a, b) => b.localeCompare(a)); // Sort descending
  }, [allSalesData]);

  useEffect(() => {
    // Re-sync allSalesData if mockSales changes externally (e.g. new sale added)
    const sortedMockSales = [...mockSales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setAllSalesData(sortedMockSales);
    if (!isFilterActive) {
      setDisplayedSales(sortedMockSales);
    } else {
      // If filters are active, re-apply them.
      // This is a simplified approach; a more robust one might store current filter values and re-apply.
      // For now, we'll just note that adding/deleting sales might require re-applying filters manually.
    }
  }, []); // mockSales is not in deps to avoid loop, actions will call handleSaleAdded etc.

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
    const sale = allSalesData.find(s => s.id === saleId);
    if (sale) {
      setSaleToAdjust(sale);
    } else {
       toast({ title: "Error", description: "Sale not found.", variant: "destructive"});
    }
  };

  const handleSaleAdjustedOnSalesPage = (
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
    const stockChangesToRollback: { productId: string, quantity: number }[] = [];

    for (const newItem of updatedSaleDataFromDialog.items) {
      const productIndex = mockProducts.findIndex(p => p.id === newItem.productId);
      if (productIndex !== -1) {
        if (mockProducts[productIndex].stock >= newItem.quantity) {
          mockProducts[productIndex].stock -= newItem.quantity;
          stockChangesToRollback.push({ productId: newItem.productId, quantity: newItem.quantity });
        } else {
          toast({ title: "Stock Error", description: `Not enough stock for ${newItem.productName} to make adjustment. Only ${mockProducts[productIndex].stock} available. Adjustment cancelled.`, variant: "destructive"});
          stockChangesToRollback.forEach(change => {
            const prodIdx = mockProducts.findIndex(p => p.id === change.productId);
            if (prodIdx !== -1) mockProducts[prodIdx].stock += change.quantity;
          });
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
    if (wasInitiallyFlagged) {
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
      isFlagged: wasInitiallyFlagged ? false : originalSale.isFlagged, 
      flaggedComment: finalFlaggedComment,
      status: updatedSaleDataFromDialog.amountDue > 0 ? 'Due' : 'Paid',
    };
    
    mockSales[originalSaleIndex] = finalUpdatedSale;
    
    const logAction = wasInitiallyFlagged ? "Sale Flag Resolved & Adjusted" : "Sale Adjusted";
    const commentForLog = adjustmentComment.trim() ? `Comment: ${adjustmentComment}` : "No comment provided for adjustment.";
    addLog(logAction, `Sale ID ${originalSaleId.substring(0,8)}... details updated by ${user.name}. New Total: NRP ${finalUpdatedSale.totalAmount.toFixed(2)}. ${commentForLog}`);
    
    const newAllSales = [...mockSales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setAllSalesData(newAllSales);
    if (isFilterActive) {
      applyFilters(newAllSales); // Re-apply filters with updated data
    } else {
      setDisplayedSales(newAllSales);
    }
    toast({ title: logAction.replace(" &", " and"), description: `Sale ${originalSaleId.substring(0,8)}... has been updated.` });
    
    setSaleToAdjust(null);
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
    if (!saleToDelete || !user) return;
    if (!deleteReason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for deleting this sale.",
        variant: "destructive",
      });
      return;
    }

    saleToDelete.items.forEach(item => {
      const productIndex = mockProducts.findIndex(p => p.id === item.productId);
      if (productIndex !== -1) {
        mockProducts[productIndex].stock += item.quantity;
      }
    });

    addLog(
        "Sale Deleted", 
        `Sale ID ${saleToDelete.id.substring(0,8)}... (Customer: ${saleToDelete.customerName}, Amount: NRP ${saleToDelete.totalAmount.toFixed(2)}) deleted by ${user.name}. Reason: ${deleteReason}`
    );
    
    const saleIndex = mockSales.findIndex(s => s.id === saleToDelete.id);
    if (saleIndex > -1) {
      mockSales.splice(saleIndex, 1);
    }
    
    const newAllSales = [...mockSales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setAllSalesData(newAllSales);
    if (isFilterActive) {
      applyFilters(newAllSales); // Re-apply filters with updated data
    } else {
      setDisplayedSales(newAllSales);
    }
    
    toast({ title: "Sale Deleted", description: `Sale ${saleToDelete.id.substring(0,8)}... has been deleted.` });
    closeDeleteDialog();
  };

  const handleSaleAdded = (newSale: Sale) => { // newSale is passed from SalesEntryForm
    // allSalesData is already updated because mockSales is updated in SalesEntryForm
    const newAllSales = [...mockSales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setAllSalesData(newAllSales); // Ensure allSalesData state is current
    if (isFilterActive) {
      // If filters are active, you might want to re-apply them or clear them
      // For now, let's re-apply to potentially include the new sale if it matches
      applyFilters(newAllSales);
    } else {
      setDisplayedSales(newAllSales); // Update displayed sales if no filter is active
    }
  };

  const salesByMonth = useMemo(() => {
    if (user?.role !== 'admin') return {}; 
    const grouped: { [key: string]: Sale[] } = {};
    allSalesData.forEach(sale => { // Use allSalesData for grouping
      const monthYearKey = format(new Date(sale.date), 'yyyy-MM'); 
      if (!grouped[monthYearKey]) {
        grouped[monthYearKey] = [];
      }
      grouped[monthYearKey].push(sale);
    });
    return grouped;
  }, [allSalesData, user]);

  const sortedMonthYearKeys = useMemo(() => {
    if (user?.role !== 'admin') return [];
    return Object.keys(salesByMonth).sort((a, b) => b.localeCompare(a)); 
  }, [salesByMonth, user]);

  const applyFilters = (sourceData = allSalesData) => {
    let tempFilteredSales = [...sourceData];

    if (filterDate) {
        const fDate = startOfDay(filterDate);
        tempFilteredSales = tempFilteredSales.filter(sale => {
            const saleDate = startOfDay(new Date(sale.date));
            return isValid(saleDate) && saleDate.getTime() === fDate.getTime();
        });
    } else if (filterMonthYear) {
        tempFilteredSales = tempFilteredSales.filter(sale => {
            return format(new Date(sale.date), 'yyyy-MM') === filterMonthYear;
        });
    }

    if (filterStatus !== 'all') {
        switch (filterStatus) {
            case 'flagged':
                tempFilteredSales = tempFilteredSales.filter(sale => sale.isFlagged === true);
                break;
            case 'due':
                tempFilteredSales = tempFilteredSales.filter(sale => sale.status === 'Due');
                break;
            case 'paid':
                tempFilteredSales = tempFilteredSales.filter(sale => sale.status === 'Paid');
                break;
            case 'resolvedFlagged':
                tempFilteredSales = tempFilteredSales.filter(sale => sale.isFlagged === false && sale.flaggedComment && sale.flaggedComment.length > 0);
                break;
        }
    }

    if (filterCommentText.trim() && (filterStatus === 'flagged' || filterStatus === 'resolvedFlagged')) {
        tempFilteredSales = tempFilteredSales.filter(sale => 
            sale.flaggedComment?.toLowerCase().includes(filterCommentText.toLowerCase())
        );
    }
    
    setDisplayedSales(tempFilteredSales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setIsFilterActive(true);
    setIsFilterPopoverOpen(false); // Close popover if open
    toast({ title: "Filters Applied", description: `${tempFilteredSales.length} sales found.`});
  };

  const clearFilters = () => {
    setFilterDate(undefined);
    setFilterMonthYear('');
    setFilterStatus('all');
    setFilterCommentText('');
    setDisplayedSales(allSalesData);
    setIsFilterActive(false);
    setIsFilterPopoverOpen(false);
    toast({ title: "Filters Cleared", description: "Showing all sales."});
  };


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
      <CardDescription>View and manage all recorded sales transactions. Use filters to refine your search.</CardDescription>
      
      <div>
        <SalesEntryForm onSaleAdded={handleSaleAdded} />
      </div>

      <Card className="shadow-lg mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ListFilter /> Filter Sales</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="filterDate">Date</Label>
            <Popover open={isFilterPopoverOpen && !!filterDate} onOpenChange={(open) => { if (open) setFilterMonthYear(''); setIsFilterPopoverOpen(open);}}>
                <PopoverTrigger asChild>
                    <Button
                    variant={"outline"}
                    className={cn(
                        "w-full justify-start text-left font-normal mt-1",
                        !filterDate && "text-muted-foreground"
                    )}
                    onClick={() => { setFilterMonthYear(''); setIsFilterPopoverOpen(!isFilterPopoverOpen);}}
                    >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filterDate ? format(filterDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                    mode="single"
                    selected={filterDate}
                    onSelect={(date) => {setFilterDate(date); setFilterMonthYear(''); setIsFilterPopoverOpen(false);}}
                    initialFocus
                    />
                </PopoverContent>
            </Popover>
          </div>
          <div>
            <Label htmlFor="filterMonthYear">Month/Year</Label>
            <Select value={filterMonthYear} onValueChange={(value) => {setFilterMonthYear(value); setFilterDate(undefined);}}>
              <SelectTrigger id="filterMonthYear" className="mt-1">
                <SelectValue placeholder="Select Month/Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Months</SelectItem>
                {availableMonths.map(month => (
                  <SelectItem key={month} value={month}>
                    {format(parse(month, 'yyyy-MM', new Date()), 'MMMM yyyy')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="filterStatus">Status</Label>
            <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as FilterStatusType)}>
              <SelectTrigger id="filterStatus" className="mt-1">
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="due">Due</SelectItem>
                <SelectItem value="flagged">Flagged</SelectItem>
                <SelectItem value="resolvedFlagged">Resolved Flagged</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="filterCommentText">Flag Comment</Label>
            <Input
              id="filterCommentText"
              value={filterCommentText}
              onChange={(e) => setFilterCommentText(e.target.value)}
              placeholder="Search in flag comments..."
              className="mt-1"
              disabled={filterStatus !== 'flagged' && filterStatus !== 'resolvedFlagged'}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={clearFilters}><X className="mr-2 h-4 w-4" />Clear Filters</Button>
          <Button onClick={() => applyFilters()}><FilterIcon className="mr-2 h-4 w-4" />Apply Filters</Button>
        </CardFooter>
      </Card>
      
      {displayedSales.length === 0 && (
         <Card className="shadow-lg mt-8">
            <CardHeader>
              <CardTitle>Sales Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                {isFilterActive ? "No sales records match your current filters." : "No sales records found."}
              </div>
            </CardContent>
          </Card>
      )}

      {isFilterActive && displayedSales.length > 0 && (
        <Card className="shadow-lg mt-8">
          <CardHeader>
            <CardTitle>Filtered Sales Results</CardTitle>
            <CardDescription>Showing {displayedSales.length} sale(s) matching your criteria.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              {/* Table structure identical to grouped view for consistency */}
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
                {displayedSales.map((sale) => (
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
                          {!sale.isFlagged && sale.flaggedComment && ( 
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
                      <Button variant="outline" size="icon" onClick={() => handleOpenAdjustDialog(sale.id)} title={sale.isFlagged ? "Resolve Flag & Adjust" : "Adjust Sale"}>
                        <Edit3 className="h-4 w-4" />
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
      )}

      {!isFilterActive && allSalesData.length > 0 && sortedMonthYearKeys.map(monthYearKey => {
        const monthDisplay = format(parse(monthYearKey + '-01', 'yyyy-MM-dd', new Date()), 'MMMM yyyy');
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
                           {!sale.isFlagged && sale.flaggedComment && ( 
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
                        <Button variant="outline" size="icon" onClick={() => handleOpenAdjustDialog(sale.id)} title={sale.isFlagged ? "Resolve Flag & Adjust" : "Adjust Sale"}>
                          <Edit3 className="h-4 w-4" />
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

      {saleToAdjust && (
        <AdjustSaleDialog
          sale={saleToAdjust}
          isOpen={!!saleToAdjust}
          onClose={() => setSaleToAdjust(null)}
          onSaleAdjusted={handleSaleAdjustedOnSalesPage}
          allGlobalProducts={mockProducts}
          isInitiallyFlagged={saleToAdjust.isFlagged || false}
        />
      )}
    </div>
  );
}
    
