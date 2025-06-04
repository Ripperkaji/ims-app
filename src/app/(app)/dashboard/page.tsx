
"use client";

import AnalyticsCard from "@/components/dashboard/AnalyticsCard";
import { mockSales, mockExpenses, mockProducts, mockLogEntries } from "@/lib/data";
import { DollarSign, ShoppingCart, Package, AlertTriangle, BarChart3, TrendingUp, TrendingDown, Users, Phone, Briefcase, Flag, AlertCircle, ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { format, subDays } from 'date-fns';
import type { Sale, LogEntry, Product, SaleItem } from '@/types';
import React, { useMemo, useState, useEffect } from 'react';
import FlagSaleDialog, { FlaggedItemDetailForUpdate } from "@/components/sales/FlagSaleDialog";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const chartConfig = {
  sales: { label: "Sales", color: "hsl(var(--primary))" },
  expenses: { label: "Expenses", color: "hsl(var(--destructive))" },
} satisfies ChartConfig


export default function DashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const totalSalesAmount = mockSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const totalExpensesAmount = mockExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const netProfit = totalSalesAmount - totalExpensesAmount;
  const dueSalesCount = mockSales.filter(sale => sale.amountDue > 0).length;
  const totalProducts = mockProducts.length;
  
  const criticalStockCount = useMemo(() => mockProducts.filter(p => p.stock === 1).length, []);
  const outOfStockCount = useMemo(() => mockProducts.filter(p => p.stock === 0).length, []);
  const flaggedSalesCount = useMemo(() => mockSales.filter(sale => sale.isFlagged).length, []); 

  const salesByDay: { [key: string]: number } = {};
  mockSales.forEach(sale => {
    const day = format(new Date(sale.date), 'MMM dd');
    salesByDay[day] = (salesByDay[day] || 0) + sale.totalAmount;
  });
  const salesTrendData = Object.entries(salesByDay)
    .map(([date, sales]) => ({ date, sales }))
    .slice(-7); 

  const recentSalesForAdmin = [...mockSales].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0,5);

  const [saleToFlag, setSaleToFlag] = useState<Sale | null>(null);
  const [triggerRefresh, setTriggerRefresh] = useState(0);
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
  }, [user, triggerRefresh]); 


  const handleOpenFlagDialog = (sale: Sale) => {
    setSaleToFlag(sale);
  };

  const handleCloseFlagDialog = () => {
    setSaleToFlag(null);
  };
  
  const addLogEntry = (action: string, details: string, userName: string) => {
    const newLog: LogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      user: userName,
      action,
      details,
    };
    mockLogEntries.unshift(newLog);
     mockLogEntries.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
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

    // Process item-specific damage exchanges first
    if (flaggedItemsDetail.length > 0) {
      flaggedItemsDetail.forEach(itemDetail => {
        const saleItemIndex = targetSale.items.findIndex(si => si.productId === itemDetail.productId);
        if (saleItemIndex !== -1) {
          targetSale.items[saleItemIndex].isFlaggedForDamageExchange = true;
          targetSale.items[saleItemIndex].damageExchangeComment = itemDetail.comment;
          itemDamageSummary += `${itemDetail.productName} (Qty: ${itemDetail.quantitySold}, Comment: ${itemDetail.comment || 'N/A'}); `;

          if (itemDetail.isDamagedExchanged) { // This field in FlaggedItemDetailForUpdate signals to process stock
            itemsProcessedForDamageExchangeCount++;
            const productIndex = mockProducts.findIndex(p => p.id === itemDetail.productId);
            if (productIndex !== -1) {
              const product = mockProducts[productIndex];
              const originalStock = product.stock;
              const originalDamage = product.damagedQuantity;

              product.damagedQuantity += itemDetail.quantitySold;
              product.stock -= itemDetail.quantitySold;
              if (product.stock < 0) product.stock = 0;

              const damageLogDetail = `Product Damage & Stock Update (Exchange): Item '${itemDetail.productName}' (Qty: ${itemDetail.quantitySold}) from Sale ID ${saleId.substring(0,8)}... marked damaged & exchanged by ${user.name}. Prev Stock: ${originalStock}, New Stock: ${product.stock}. Prev Dmg: ${originalDamage}, New Dmg: ${product.damagedQuantity}. Comment: ${itemDetail.comment}`;
              addLogEntry("Product Damage & Stock Update (Exchange)", damageLogDetail, user.name);
              allDamageExchangeLogDetails += `Item '${itemDetail.productName}' (Qty: ${itemDetail.quantitySold}) processed. `;
            } else {
               addLogEntry("Damage Exchange Error", `Product ID ${itemDetail.productId} from Sale ID ${saleId.substring(0,8)}... not found during damage exchange.`, user.name);
            }
          }
        }
      });
       addLogEntry("Sale Items Flagged (Damage)", `Sale ID ${saleId.substring(0,8)}... had items flagged for damage by ${user.name}. Details: ${itemDamageSummary}`, user.name);
    }

    // Construct the main flagged comment including the general reason
    let finalFlaggedComment = `General reason: ${generalReasonComment.trim()}`;
    if (itemDamageSummary) {
      finalFlaggedComment += `\nDamaged items: ${itemDamageSummary}`;
    }
    
    addLogEntry("Sale Flagged", `Sale ID ${saleId.substring(0,8)}... flagged by ${user.name}. ${finalFlaggedComment}`, user.name);
    
    targetSale.flaggedComment = finalFlaggedComment.trim();
    targetSale.isFlagged = true; 

    toast({ title: "Sale Flagged", description: `Sale ${saleId.substring(0,8)}... has been flagged. Reason: ${generalReasonComment}`});
    
    if (itemsProcessedForDamageExchangeCount > 0) {
        toast({ title: "Damage Exchanged", description: `Processed ${itemsProcessedForDamageExchangeCount} item(s) for damage exchange from sale ${saleId.substring(0,8)}.... Details: ${allDamageExchangeLogDetails}`});
    }

    setSaleToFlag(null);
    setTriggerRefresh(prev => prev + 1);
  };


  if (!user) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">Welcome, {user.name}!</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <AnalyticsCard title="Total Sales" value={totalSalesAmount} icon={DollarSign} description="All successful transactions" />
        {user.role === 'admin' && (
          <>
            <AnalyticsCard title="Total Expenses" value={totalExpensesAmount} icon={TrendingDown} description="All recorded business expenses" />
            <AnalyticsCard title="Net Profit" value={netProfit} icon={TrendingUp} description="Sales minus expenses" />
            <AnalyticsCard 
              title="Due Payments" 
              value={dueSalesCount} 
              icon={AlertTriangle} 
              description="Sales with pending payment" 
              iconClassName={dueSalesCount > 0 ? "text-destructive" : "text-green-500"}
            />
            <AnalyticsCard 
              title="Flagged Sales" 
              value={flaggedSalesCount} 
              icon={Flag} 
              description="Sales marked for review" 
              iconClassName={flaggedSalesCount > 0 ? "text-destructive" : "text-green-500"}
            />
             <AnalyticsCard 
              title="Critical Stock (Qty 1)" 
              value={criticalStockCount} 
              icon={AlertTriangle} 
              description="Products with only 1 unit left"
              iconClassName={criticalStockCount > 0 ? "text-orange-500" : "text-green-500"}
            />
            <AnalyticsCard 
              title="Out of Stock Items" 
              value={outOfStockCount} 
              icon={AlertCircle} 
              description="Products with no units left" 
              iconClassName={outOfStockCount > 0 ? "text-destructive" : "text-green-500"}
            />
          </>
        )}
        <AnalyticsCard title="Total Products" value={totalProducts} icon={Package} description="Available product types" />
      </div>

      {user.role === 'admin' && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Sales Trend (Last 7 entries)</CardTitle>
              <CardDescription>Visual overview of sales performance.</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={salesTrendData} margin={{ top: 5, right: 20, left: -25, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                    <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="sales" stroke="var(--color-sales)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
          
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
                    <TableHead>Contact</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentSalesForAdmin.map(sale => (
                    <TableRow key={sale.id}>
                      <TableCell>{sale.customerName}</TableCell>
                       <TableCell>
                        {sale.customerContact ? (
                          <a href={`tel:${sale.customerContact}`} className="flex items-center gap-1 text-xs hover:underline text-primary">
                            <Phone className="h-3 w-3" /> {sale.customerContact}
                          </a>
                        ) : <span className="text-xs">N/A</span>}
                      </TableCell>
                      <TableCell>NRP {sale.totalAmount.toFixed(2)}</TableCell>
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
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentStaffSales.map(sale => (
                      <TableRow key={sale.id} className={sale.isFlagged ? 'bg-yellow-100/50 dark:bg-yellow-900/20' : ''}>
                        <TableCell>{sale.customerName}</TableCell>
                        <TableCell>NRP {sale.totalAmount.toFixed(2)}</TableCell>
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

function PlaceholderChart() {
  return (
    <div className="flex items-center justify-center h-full w-full bg-muted/50 rounded-md p-8">
      <BarChart3 className="h-16 w-16 text-muted-foreground" />
      <p className="ml-4 text-muted-foreground">Chart data will be displayed here.</p>
    </div>
  )
}

