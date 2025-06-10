
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
import { calculateCurrentStock } from "../products/page"; // Import calculateCurrentStock

type PaymentMethodSelection = 'Cash' | 'Credit Card' | 'Debit Card' | 'Due' | 'Hybrid';
type FilterStatusType = "all" | "flagged" | "due" | "paid" | "resolvedFlagged";

const ALL_MONTHS_FILTER_VALUE = "ALL_MONTHS_FILTER_VALUE";

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
  const [filterMonthYear, setFilterMonthYear] = useState<string>(ALL_MONTHS_FILTER_VALUE); // YYYY-MM
  const [filterStatus, setFilterStatus] = useState<FilterStatusType>('all');
  const [filterCommentText, setFilterCommentText] = useState<string>('');
  const [isFilterActive, setIsFilterActive] = useState<boolean>(false);
  const [isCalendarPopoverOpen, setIsCalendarPopoverOpen] = useState<boolean>(false);


  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    allSalesData.forEach(sale => {
      months.add(format(new Date(sale.date), 'yyyy-MM'));
    });
    return Array.from(months).sort((a, b) => b.localeCompare(a)); // Sort descending
  }, [allSalesData]);

  useEffect(() => {
    const sortedMockSales = [...mockSales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setAllSalesData(sortedMockSales);
    if (!isFilterActive) {
      setDisplayedSales(sortedMockSales);
    } else {
      // If filters are active, re-apply them with the potentially updated allSalesData
      applyFilters(sortedMockSales);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    mockLogEntries.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.date).getTime());
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

    // Validate stock for new/adjusted items
    let stockSufficient = true;
    for (const newItem of updatedSaleDataFromDialog.items) {
      const product = mockProducts.find(p => p.id === newItem.productId);
      if (product) {
        const originalItem = originalSale.items.find(oi => oi.productId === newItem.productId);
        const originalQuantityInThisSale = originalItem ? originalItem.quantity : 0;
        
        const currentStockWithOriginalSale = calculateCurrentStock(product, mockSales);
        const availableStockForAdjustment = currentStockWithOriginalSale + originalQuantityInThisSale;

        if (newItem.quantity > availableStockForAdjustment) {
          toast({ title: "Stock Error", description: `Not enough stock for ${newItem.productName} to make adjustment. Only ${availableStockForAdjustment} available. Adjustment cancelled.`, variant: "destructive", duration: 7000 });
          stockSufficient = false;
          break;
        }
      } else {
         toast({ title: "Product Error", description: `Product ${newItem.productName} not found during stock validation. Adjustment cancelled.`, variant: "destructive"});
         stockSufficient = false; 
         break; 
      }
    }

    if (!stockSufficient) {
      setSaleToAdjust(null); // Close dialog
      return; // Stop processing
    }
    
    // If stock is sufficient, proceed
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
      applyFilters(newAllSales); 
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

    // Stock reversion for deleted sale items is implicitly handled
    // by removing the sale from mockSales. calculateCurrentStock will then be accurate.

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
      applyFilters(newAllSales); 
    } else {
      setDisplayedSales(newAllSales);
    }
    
    toast({ title: "Sale Deleted", description: `Sale ${saleToDelete.id.substring(0,8)}... has been deleted.` });
    closeDeleteDialog();
  };

  const handleSaleAdded = (newSale: Sale) => { 
    const newAllSales = [...mockSales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setAllSalesData(newAllSales); 
    if (isFilterActive) {
      applyFilters(newAllSales);
    } else {
      setDisplayedSales(newAllSales); 
    }
  };

  const salesByMonth = useMemo(() => {
    if (user?.role !== 'admin') return {}; 
    const grouped: { [key: string]: Sale[] } = {};
    allSalesData.forEach(sale => { 
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
    } else if (filterMonthYear && filterMonthYear !== ALL_MONTHS_FILTER_VALUE) {
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
    toast({ title: "Filters Applied", description: `${tempFilteredSales.length} sales found.`});
  };

  const clearFilters = () => {
    setFilterDate(undefined);
    setFilterMonthYear(ALL_MONTHS_FILTER_VALUE);
    setFilterStatus('all');
    setFilterCommentText('');
    setDisplayedSales(allSalesData);
    setIsFilterActive(false);
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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold font-headline">Sales Management</h1>
      <CardDescription className="text-sm -mt-4">View and manage all recorded sales transactions. Use filters to refine your search.</CardDescription>
      
      <div className="mt-4">
        <SalesEntryForm onSaleAdded={handleSaleAdded} />
      </div>

      <Card className="shadow-lg mt-6">
        <CardHeader className="p-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2"><ListFilter className="h-4 w-4"/> Filter Sales</CardTitle>
        </CardHeader>
        <CardContent className="p-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          <div>
            <Label htmlFor="filterDate" className="text-xs">Date</Label>
             <Popover open={isCalendarPopoverOpen} onOpenChange={setIsCalendarPopoverOpen}>
                <PopoverTrigger asChild>
                    <Button
                    variant={"outline"}
                    className={cn(
                        "w-full justify-start text-left font-normal mt-0.5 h-9 text-xs",
                        !filterDate && "text-muted-foreground"
                    )}
                    onClick={() => { setFilterMonthYear(ALL_MONTHS_FILTER_VALUE); setIsCalendarPopoverOpen(!isCalendarPopoverOpen);}}
                    >
                    <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                    {filterDate ? format(filterDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                    mode="single"
                    selected={filterDate}
                    onSelect={(date) => {setFilterDate(date); setFilterMonthYear(ALL_MONTHS_FILTER_VALUE); setIsCalendarPopoverOpen(false);}}
                    initialFocus
                    />
                </PopoverContent>
            </Popover>
          </div>
          <div>
            <Label htmlFor="filterMonthYear" className="text-xs">Month/Year</Label>
            <Select 
                value={filterMonthYear || ALL_MONTHS_FILTER_VALUE} 
                onValueChange={(value) => {
                    setFilterMonthYear(value === ALL_MONTHS_FILTER_VALUE ? ALL_MONTHS_FILTER_VALUE : value); 
                    setFilterDate(undefined);
                }}
            >
              <SelectTrigger id="filterMonthYear" className="mt-0.5 h-9 text-xs">
                <SelectValue placeholder="Select Month/Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_MONTHS_FILTER_VALUE} className="text-xs">All Months</SelectItem>
                {availableMonths.map(month => (
                  <SelectItem key={month} value={month} className="text-xs">
                    {format(parse(month, 'yyyy-MM', new Date()), 'MMMM yyyy')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="filterStatus" className="text-xs">Status</Label>
            <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as FilterStatusType)}>
              <SelectTrigger id="filterStatus" className="mt-0.5 h-9 text-xs">
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All Statuses</SelectItem>
                <SelectItem value="paid" className="text-xs">Paid</SelectItem>
                <SelectItem value="due" className="text-xs">Due</SelectItem>
                <SelectItem value="flagged" className="text-xs">Flagged</SelectItem>
                <SelectItem value="resolvedFlagged" className="text-xs">Resolved Flagged</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="filterCommentText" className="text-xs">Flag Comment</Label>
            <Input
              id="filterCommentText"
              value={filterCommentText}
              onChange={(e) => setFilterCommentText(e.target.value)}
              placeholder="Search in flag comments..."
              className="mt-0.5 h-9 text-xs"
              disabled={filterStatus !== 'flagged' && filterStatus !== 'resolvedFlagged'}
            />
          </div>
        </CardContent>
        <CardFooter className="p-3 flex justify-end gap-2">
          <Button variant="outline" onClick={clearFilters} size="sm"><X className="mr-1.5 h-3.5 w-3.5" />Clear Filters</Button>
          <Button onClick={() => applyFilters()} size="sm"><FilterIcon className="mr-1.5 h-3.5 w-3.5" />Apply Filters</Button>
        </CardFooter>
      </Card>
      
      {displayedSales.length === 0 && (
         <Card className="shadow-lg mt-6">
            <CardHeader className="p-4">
              <CardTitle className="text-lg font-semibold">Sales Records</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="text-center py-6 text-muted-foreground">
                {isFilterActive ? "No sales records match your current filters." : "No sales records found."}
              </div>
            </CardContent>
          </Card>
      )}

      {isFilterActive && displayedSales.length > 0 && (
        <Card className="shadow-lg mt-6">
          <CardHeader className="p-4">
            <CardTitle className="text-lg font-semibold">Filtered Sales Results</CardTitle>
            <CardDescription className="text-xs">Showing {displayedSales.length} sale(s) matching your criteria.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">ID</TableHead>
                  <TableHead className="text-xs">Customer</TableHead>
                  <TableHead className="text-xs">Contact</TableHead>
                  <TableHead className="text-xs">Items Sold</TableHead>
                  <TableHead className="text-xs">Total Amount</TableHead>
                  <TableHead className="text-xs">Payment Details</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Recorded By</TableHead>
                  <TableHead className="text-right text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedSales.map((sale) => (
                  <TableRow key={sale.id} className={cn(sale.isFlagged ? 'bg-yellow-100/50 dark:bg-yellow-900/20' : '', "text-xs")}>
                    <TableCell className="font-medium py-2.5">{sale.id.substring(0, 8)}...</TableCell>
                    <TableCell className="py-2.5">{sale.customerName}</TableCell>
                    <TableCell className="py-2.5">
                      {sale.customerContact ? (
                        <a href={`tel:${sale.customerContact}`} className="flex items-center gap-1 hover:underline text-primary">
                          <Phone className="h-3 w-3" /> {sale.customerContact}
                        </a>
                      ) : <span className="text-xs">N/A</span>}
                    </TableCell>
                    <TableCell className="py-2.5 max-w-xs truncate">
                      {sale.items.map(item => `${item.productName} (Qty: ${item.quantity})`).join(', ')}
                    </TableCell>
                    <TableCell className="py-2.5">NRP {sale.totalAmount.toFixed(2)}</TableCell>
                    <TableCell className="py-2.5">{getPaymentSummary(sale)}</TableCell>
                    <TableCell className="py-2.5">
                      <div className="flex items-center space-x-1">
                        <Badge variant={sale.status === 'Paid' ? 'default' : 'destructive'} className={cn(sale.status === 'Paid' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600', "text-xs px-2 py-0.5")}>
                          {sale.status}
                        </Badge>
                        {sale.amountDue > 0 && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <AlertTriangle className="h-3.5 w-3.5 text-orange-500 cursor-default" />
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
                                <Flag className="h-3.5 w-3.5 text-destructive cursor-pointer" />
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
                                <ShieldCheck className="h-3.5 w-3.5 text-green-600 cursor-default" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs whitespace-pre-wrap">{sale.flaggedComment}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-2.5">{format(new Date(sale.date), 'MMM dd, yy HH:mm')}</TableCell>
                    <TableCell className="py-2.5">{sale.createdBy}</TableCell>
                    <TableCell className="text-right space-x-1 py-2.5">
                      <Button variant="outline" size="icon" onClick={() => handleOpenAdjustDialog(sale.id)} title={sale.isFlagged ? "Resolve Flag & Adjust" : "Adjust Sale"} className="h-7 w-7">
                        <Edit3 className="h-3.5 w-3.5" />
                        <span className="sr-only">{sale.isFlagged ? "Resolve Flag & Adjust" : "Adjust Sale"}</span>
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => openDeleteDialog(sale)} title="Delete Sale" className="h-7 w-7">
                        <Trash2 className="h-3.5 w-3.5" />
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
          <Card key={monthYearKey} className="shadow-lg mt-6">
            <CardHeader className="p-4">
              <CardTitle className="text-lg font-semibold">{monthDisplay}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">ID</TableHead>
                    <TableHead className="text-xs">Customer</TableHead>
                    <TableHead className="text-xs">Contact</TableHead>
                    <TableHead className="text-xs">Items Sold</TableHead>
                    <TableHead className="text-xs">Total Amount</TableHead>
                    <TableHead className="text-xs">Payment Details</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Date</TableHead>
                    <TableHead className="text-xs">Recorded By</TableHead>
                    <TableHead className="text-right text-xs">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlySales.map((sale) => (
                    <TableRow key={sale.id} className={cn(sale.isFlagged ? 'bg-yellow-100/50 dark:bg-yellow-900/20' : '', "text-xs")}>
                      <TableCell className="font-medium py-2.5">{sale.id.substring(0, 8)}...</TableCell>
                      <TableCell className="py-2.5">{sale.customerName}</TableCell>
                      <TableCell className="py-2.5">
                        {sale.customerContact ? (
                          <a href={`tel:${sale.customerContact}`} className="flex items-center gap-1 hover:underline text-primary">
                            <Phone className="h-3 w-3" /> {sale.customerContact}
                          </a>
                        ) : <span className="text-xs">N/A</span>}
                      </TableCell>
                       <TableCell className="py-2.5 max-w-xs truncate">
                        {sale.items.map(item => `${item.productName} (Qty: ${item.quantity})`).join(', ')}
                      </TableCell>
                      <TableCell className="py-2.5">NRP {sale.totalAmount.toFixed(2)}</TableCell>
                      <TableCell className="py-2.5">{getPaymentSummary(sale)}</TableCell>
                      <TableCell className="py-2.5">
                        <div className="flex items-center space-x-1">
                          <Badge variant={sale.status === 'Paid' ? 'default' : 'destructive'} className={cn(sale.status === 'Paid' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600', "text-xs px-2 py-0.5")}>
                            {sale.status}
                          </Badge>
                          {sale.amountDue > 0 && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <AlertTriangle className="h-3.5 w-3.5 text-orange-500 cursor-default" />
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
                                  <Flag className="h-3.5 w-3.5 text-destructive cursor-pointer" />
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
                                  <ShieldCheck className="h-3.5 w-3.5 text-green-600 cursor-default" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs whitespace-pre-wrap">{sale.flaggedComment}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-2.5">{format(new Date(sale.date), 'MMM dd, yy HH:mm')}</TableCell>
                      <TableCell className="py-2.5">{sale.createdBy}</TableCell>
                      <TableCell className="text-right space-x-1 py-2.5">
                        <Button variant="outline" size="icon" onClick={() => handleOpenAdjustDialog(sale.id)} title={sale.isFlagged ? "Resolve Flag & Adjust" : "Adjust Sale"} className="h-7 w-7">
                          <Edit3 className="h-3.5 w-3.5" />
                          <span className="sr-only">{sale.isFlagged ? "Resolve Flag & Adjust" : "Adjust Sale"}</span>
                        </Button>
                        <Button variant="destructive" size="icon" onClick={() => openDeleteDialog(sale)} title="Delete Sale" className="h-7 w-7">
                          <Trash2 className="h-3.5 w-3.5" />
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
          mockSales={allSalesData}
        />
      )}
    </div>
  );
}
    



