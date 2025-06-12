
"use client";

import AnalyticsCard from "@/components/dashboard/AnalyticsCard";
import { mockSales, mockExpenses, mockProducts, mockLogEntries, addSystemExpense } from "@/lib/data";
import { DollarSign, ShoppingCart, Package, AlertTriangle, BarChart3, Users as UsersIcon, Phone, Briefcase, Flag, AlertCircle, ShieldCheck } from "lucide-react"; // Removed Wallet, Archive
import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { format, subDays, isSameDay } from 'date-fns';
import type { Sale, LogEntry, Product, SaleItem, Expense } from '@/types';
import React, { useMemo, useState, useEffect } from 'react';
import FlagSaleDialog, { FlaggedItemDetailForUpdate } from "@/components/sales/FlagSaleDialog";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { calculateCurrentStock } from "@/lib/productUtils";
import { addLogEntry as globalAddLog } from "@/lib/data"; // Use the updated addLogEntry


export default function DashboardPage() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [triggerRefresh, setTriggerRefresh] = useState(0);


  const dueSalesCount = useMemo(() => mockSales.filter(sale => sale.amountDue > 0).length, [triggerRefresh, mockSales]);
  const totalProducts = useMemo(() => mockProducts.length, [mockProducts]);

  const criticalStockCount = useMemo(() => {
    return mockProducts.filter(p => {
      const currentStock = calculateCurrentStock(p, mockSales);
      return currentStock === 1;
    }).length;
  }, [triggerRefresh, mockProducts, mockSales]);

  const outOfStockCount = useMemo(() => {
    return mockProducts.filter(p => {
      const currentStock = calculateCurrentStock(p, mockSales);
      return currentStock === 0;
    }).length;
  }, [triggerRefresh, mockProducts, mockSales]);

  const flaggedSalesCount = useMemo(() => mockSales.filter(sale => sale.isFlagged).length, [triggerRefresh, mockSales]);


  const recentSalesForAdmin = useMemo(() =>
    [...mockSales].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0,5)
  , [triggerRefresh, mockSales]);

  const [saleToFlag, setSaleToFlag] = useState<Sale | null>(null);
  const [recentStaffSales, setRecentStaffSales] = useState<Sale[]>([]);


  useEffect(() => {
    if (user?.role === 'staff') {
      const sevenDaysAgo = subDays(new Date(), 7);
      const filteredSales = mockSales
        .filter(sale => sale.createdBy === user.name && new Date(sale.date) >= sevenDaysAgo)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRecentStaffSales(filteredSales);
    } else {
      setRecentStaffSales([]);
    }
  }, [user, triggerRefresh, mockSales]);


  const handleOpenFlagDialog = (sale: Sale) => {
    setSaleToFlag(sale);
  };

  const handleCloseFlagDialog = () => {
    setSaleToFlag(null);
  };

  const addLogEntry = (action: string, details: string, userName: string) => {
    globalAddLog(userName, action, details);
  };


  const handleSaleFlagged = (
    saleId: string,
    flaggedItemsDetail: FlaggedItemDetailForUpdate[],
    generalReasonComment: string
  ) => {
    const saleIndex = mockSales.findIndex(s => s.id === saleId);
    if (saleIndex === -1 || !user) {
      toast({ title: "Error", description: "Sale not found or user not available.", variant: "destructive"});
      return;
    }

    const targetSale = mockSales[saleIndex];
    let itemDamageSummary = "";
    let itemsProcessedForDamageExchangeCount = 0;
    let allDamageExchangeLogDetails = "";

    if (flaggedItemsDetail.length > 0) {
      flaggedItemsDetail.forEach(itemDetail => {
        const saleItemIndex = targetSale.items.findIndex(si => si.productId === itemDetail.productId);
        if (saleItemIndex !== -1) {
          targetSale.items[saleItemIndex].isFlaggedForDamageExchange = true;
          targetSale.items[saleItemIndex].damageExchangeComment = itemDetail.comment;
          itemDamageSummary += `${itemDetail.productName} (Qty: ${itemDetail.quantitySold}, Comment: ${itemDetail.comment || 'N/A'}); `;

          if (itemDetail.isDamagedExchanged) {
            itemsProcessedForDamageExchangeCount++;
            const productIndex = mockProducts.findIndex(p => p.id === itemDetail.productId);
            if (productIndex !== -1) {
              const product = mockProducts[productIndex];
              const originalStock = calculateCurrentStock(product, mockSales); 
              const originalDamage = product.damagedQuantity;

              product.damagedQuantity += itemDetail.quantitySold;
              
              const damageLogDetail = `Product Damage & Stock Update (Exchange): Item '${itemDetail.productName}' (Qty: ${itemDetail.quantitySold}) from Sale ID ${saleId.substring(0,8)}... marked damaged & exchanged by ${user.name}. Prev Sellable Stock (before damage): ${originalStock + itemDetail.quantitySold}, New Sellable Stock (after damage): ${calculateCurrentStock(product, mockSales)}. Prev Dmg: ${originalDamage}, New Dmg: ${product.damagedQuantity}. Comment: ${itemDetail.comment}`;
              addLogEntry("Product Damage & Stock Update (Exchange)", damageLogDetail, user.name);

              const damageExpense: Omit<Expense, 'id'> = {
                date: new Date().toISOString(),
                description: `Damaged (Sale Exchange): ${itemDetail.quantitySold}x ${itemDetail.productName} from Sale ID ${saleId.substring(0,8)}`,
                category: "Product Damage",
                amount: itemDetail.quantitySold * product.currentCostPrice,
                recordedBy: user.name, // actorName for addSystemExpense
              };
              addSystemExpense(damageExpense, user.name); // Pass user.name as actorName

              allDamageExchangeLogDetails += `Item '${itemDetail.productName}' (Qty: ${itemDetail.quantitySold}) processed. Cost: NRP ${(itemDetail.quantitySold * product.currentCostPrice).toFixed(2)}. `;
            } else {
               addLogEntry("Damage Exchange Error", `Product ID ${itemDetail.productId} from Sale ID ${saleId.substring(0,8)}... not found during damage exchange.`, user.name);
            }
          }
        }
      });
       addLogEntry("Sale Items Flagged (Damage)", `Sale ID ${saleId.substring(0,8)}... had items flagged for damage by ${user.name}. Details: ${itemDamageSummary}`, user.name);
    }

    let finalFlaggedComment = `General reason: ${generalReasonComment.trim()}`;
    if (itemDamageSummary) {
      finalFlaggedComment += `\nDamaged items: ${itemDamageSummary}`;
    }

    addLogEntry("Sale Flagged", `Sale ID ${saleId.substring(0,8)}... flagged by ${user.name}. ${finalFlaggedComment}`, user.name);

    targetSale.flaggedComment = finalFlaggedComment.trim();
    targetSale.isFlagged = true;

    toast({ title: "Sale Flagged", description: `Sale ${saleId.substring(0,8)}... has been flagged. Reason: ${generalReasonComment}`});

    if (itemsProcessedForDamageExchangeCount > 0) {
        toast({ title: "Damage Exchanged & Expense Logged", description: `Processed ${itemsProcessedForDamageExchangeCount} item(s) for damage exchange. Details: ${allDamageExchangeLogDetails}`});
    }

    setSaleToFlag(null);
    setTriggerRefresh(prev => prev + 1);
  };

  const todaySalesAmount = useMemo(() => {
    const todayDate = new Date();
    return mockSales
      .filter(sale => isSameDay(new Date(sale.date), todayDate))
      .reduce((sum, sale) => sum + sale.totalAmount, 0);
  }, [triggerRefresh, mockSales]);


  if (!user) return null; // Should be handled by layout/initializer, but good for safety

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">Welcome, {user.name}!</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {user.role === 'admin' ? (
          <>
            <AnalyticsCard
              title="Today's Sales"
              value={todaySalesAmount}
              icon={DollarSign}
              description="Total sales recorded today"
              isCurrency={true}
            />
            <AnalyticsCard
              title="Due Payments"
              value={dueSalesCount}
              icon={AlertTriangle}
              description={`${dueSalesCount} sale(s) with pending payment`}
              iconClassName={dueSalesCount > 0 ? "text-destructive" : "text-green-500"}
              isCurrency={false}
              href="/due-sales"
            />
            <AnalyticsCard
              title="Flagged Sales"
              value={flaggedSalesCount}
              icon={Flag}
              description={`${flaggedSalesCount} sale(s) marked for review`}
              iconClassName={flaggedSalesCount > 0 ? "text-destructive" : "text-green-500"}
              isCurrency={false}
              href="/sales"
            />
            <AnalyticsCard
              title="Out of Stock Items"
              value={outOfStockCount}
              icon={AlertCircle}
              description={`${outOfStockCount} product(s) with no units`}
              iconClassName={outOfStockCount > 0 ? "text-destructive" : "text-green-500"}
              isCurrency={false}
              href="/products"
            />
            <AnalyticsCard
              title="Critical Stock (Qty 1)"
              value={criticalStockCount}
              icon={AlertTriangle}
              description={`${criticalStockCount} product(s) with 1 unit left`}
              iconClassName={criticalStockCount > 0 ? "text-orange-500" : "text-green-500"}
              isCurrency={false}
              href="/products"
            />
            <AnalyticsCard
              title="Advanced Analytics"
              value="View Reports"
              icon={BarChart3}
              description="View detailed reports and metrics."
              isCurrency={false}
              href="/analytics"
            />
          </>
        ) : (
          <AnalyticsCard title="Total Sales (Session)" value={recentStaffSales.reduce((sum, s) => sum + s.totalAmount, 0)} icon={DollarSign} description="Your sales in this session" isCurrency={true}/>
        )}
        <AnalyticsCard title="Total Products" value={totalProducts} icon={Package} description="Available product types" isCurrency={false} href="/products"/>
      </div>

      {user.role === 'admin' && (
        <div className="grid gap-4 md:grid-cols-1">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Recent Sales</CardTitle>
              <CardDescription>A quick look at the latest transactions.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Items Sold</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentSalesForAdmin.map(sale => (
                    <TableRow key={sale.id}>
                      <TableCell>{sale.customerName}</TableCell>
                      <TableCell className="text-xs max-w-[150px] truncate">
                         {sale.items.map(item => `${item.productName} (Qty: ${item.quantity})`).join(', ')}
                      </TableCell>
                      <TableCell>NRP {sale.totalAmount.toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Badge variant={sale.status === 'Paid' ? 'default' : 'destructive'} className={cn(sale.status === 'Paid' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600', "text-xs")}>
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
                      <TableCell>{format(new Date(sale.date), 'MMM dd, yyyy')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {user.role === 'staff' && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-2">
              <Link href="/sales" passHref>
                <Button variant="outline" className="w-full justify-start gap-2 p-4 h-auto">
                  <ShoppingCart className="h-5 w-5 text-primary"/>
                  <div>
                    <p className="font-semibold">New Sale</p>
                    <p className="text-xs text-muted-foreground">Start a new transaction</p>
                  </div>
                </Button>
              </Link>
              <Link href="/products" passHref>
                <Button variant="outline" className="w-full justify-start gap-2 p-4 h-auto">
                  <Package className="h-5 w-5 text-primary"/>
                  <div>
                    <p className="font-semibold">View Products</p>
                    <p className="text-xs text-muted-foreground">Check stock and prices</p>
                  </div>
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2"><Briefcase /> Your Recent Sales (Last 7 Days)</CardTitle>
              <CardDescription>Sales you recorded in the past week. You can flag sales with issues (e.g. item damage, entry errors) for admin review.</CardDescription>
            </CardHeader>
            <CardContent>
              {recentStaffSales.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Items Sold</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentStaffSales.map(sale => (
                      <TableRow key={sale.id} className={cn(sale.isFlagged ? 'bg-yellow-100/50 dark:bg-yellow-900/20' : '', 'text-sm')}>
                        <TableCell>{sale.customerName}</TableCell>
                        <TableCell className="text-xs max-w-[200px] truncate">
                          {sale.items.map(item => `${item.productName} (Qty: ${item.quantity})`).join(', ')}
                        </TableCell>
                        <TableCell>NRP {sale.totalAmount.toFixed(2)}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Badge variant={sale.status === 'Paid' ? 'default' : 'destructive'} className={cn(sale.status === 'Paid' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600', "text-xs")}>
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
                          </div>
                        </TableCell>
                        <TableCell>{format(new Date(sale.date), 'MMM dd, yyyy HH:mm')}</TableCell>
                        <TableCell>
                          {sale.isFlagged ? (
                             <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center text-sm text-destructive cursor-default">
                                      <Flag className="h-4 w-4 mr-1" /> Flagged
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="max-w-xs whitespace-pre-wrap">{sale.flaggedComment || "Flagged for review"}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                          ) : sale.flaggedComment ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center text-sm text-green-600 cursor-default">
                                    <ShieldCheck className="h-4 w-4 mr-1" /> Resolved
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs whitespace-pre-wrap">{sale.flaggedComment}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            <Button variant="outline" size="sm" onClick={() => handleOpenFlagDialog(sale)}>
                              <Flag className="h-4 w-4 mr-1" /> Flag Sale
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-4">You have not recorded any sales in the last 7 days.</p>
              )}
            </CardContent>
          </Card>
        </>
      )}
      {saleToFlag && user && (
        <FlagSaleDialog
          key={saleToFlag.id}
          sale={saleToFlag}
          isOpen={!!saleToFlag}
          onClose={handleCloseFlagDialog}
          onSaleFlagged={handleSaleFlagged}
        />
      )}
    </div>
  );
}
