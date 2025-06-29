
"use client";

import { useAuthStore } from "@/stores/authStore";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import AnalyticsCard from "@/components/dashboard/AnalyticsCard";
import { DollarSign, TrendingUp, TrendingDown, Archive, BarChart3, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { mockSales, mockExpenses, mockProducts, mockLogEntries } from "@/lib/data"; 
import type { Sale } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts"; // Removed LineChart, Line
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { cn, formatCurrency } from "@/lib/utils";
import { subMonths, format, startOfMonth, endOfMonth, isWithinInterval, getMonth, getYear, getDaysInMonth, isSameDay } from "date-fns"; // Removed getDate

interface DailyComparisonRow {
  currentMonthDateDisplay: string;
  currentMonthSales: number;
  previousMonthDateDisplay: string | null;
  previousMonthSales: number;
}

export default function AnalyticsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (user && user.role !== 'admin') {
      toast({ title: "Access Denied", description: "You do not have permission to view this page.", variant: "destructive" });
      router.push('/dashboard');
    }
  }, [user, router, toast]);

  const totalSalesAmount = useMemo(() => mockSales.reduce((sum, sale) => sum + sale.totalAmount, 0), []);
  const totalExpensesAmount = useMemo(() => mockExpenses.reduce((sum, expense) => sum + expense.amount, 0), []);
  const netProfit = useMemo(() => totalSalesAmount - totalExpensesAmount, [totalSalesAmount, totalExpensesAmount]);

  const currentStockValuation = useMemo(() => {
    return mockProducts.reduce((sum, product) => {
      const totalAcquired = product.acquisitionHistory.reduce((acc, batch) => acc + batch.quantityAdded, 0);
      const totalSold = mockSales
        .flatMap(sale => sale.items)
        .filter(item => item.productId === product.id)
        .reduce((acc, item) => acc + item.quantity, 0);
      const currentStock = totalAcquired - totalSold - (product.damagedQuantity || 0) - (product.testerQuantity || 0);
      
      const valuationForProduct = currentStock * product.currentCostPrice;
      return sum + (isNaN(valuationForProduct) ? 0 : valuationForProduct);
    }, 0);
  }, []);

  const supplierDueItems: Array<{ dueAmount: number }> = [];
  mockProducts.forEach(product => {
    product.acquisitionHistory.forEach(batch => {
      if (batch.dueToSupplier > 0) {
        supplierDueItems.push({ dueAmount: batch.dueToSupplier });
      }
    });
  });
  const totalSupplierDue = supplierDueItems.reduce((sum, item) => sum + item.dueAmount, 0);

  const expenseDueExpenseRecordedLogs = mockLogEntries.filter(log => log.action === "Expense Recorded");
  const calculatedExpenseDueItems: Array<{ dueAmount: number }> = [];
  expenseDueExpenseRecordedLogs.forEach(log => {
    const mainDetailMatch = log.details.match(/Expense for '([^']*)' \(Category: ([^)]+)\), Amount: NRP ([\d.]+)/i);
    if (!mainDetailMatch) return;

    let outstandingDue = 0;
    const hybridEntryMatch = log.details.match(/via Hybrid\s*\(([^)]+)\)/i);
    const directDueMatch = log.details.match(/Marked as Due \(NRP ([\d.]+)\)\./i);

    if (hybridEntryMatch && hybridEntryMatch[1]) {
        const detailsStr = hybridEntryMatch[1];
        const duePartMatch = detailsStr.match(/Due:\s*NRP\s*([\d.]+)/i);
        if (duePartMatch && duePartMatch[1]) {
            outstandingDue = parseFloat(duePartMatch[1]);
        }
    } else if (directDueMatch && directDueMatch[1]) {
        outstandingDue = parseFloat(directDueMatch[1]);
    }
    
    if (outstandingDue > 0) {
      calculatedExpenseDueItems.push({ dueAmount: outstandingDue });
    }
  });
  const totalExpenseDue = calculatedExpenseDueItems.reduce((sum, item) => sum + item.dueAmount, 0);
  const totalAccountPayableAmount = totalSupplierDue + totalExpenseDue;

  const categorySalesData = useMemo(() => {
    const salesByCategory: { [category: string]: number } = {};
    mockSales.forEach(sale => {
      sale.items.forEach(item => {
        const product = mockProducts.find(p => p.id === item.productId);
        if (product) {
          salesByCategory[product.category] = (salesByCategory[product.category] || 0) + item.quantity;
        }
      });
    });
    return Object.entries(salesByCategory)
      .map(([name, value]) => ({ name, value }))
      .filter(entry => entry.value > 0) 
      .sort((a, b) => b.value - a.value);
  }, []);

  const categoryChartConfig = useMemo(() => {
    const config: ChartConfig = {};
    const baseHue = 173;
    const hueStep = 47;
    const saturation = 65;
    const lightness = 55;

    categorySalesData.forEach((categoryData, index) => {
      const hue = (baseHue + index * hueStep) % 360;
      config[categoryData.name] = {
        label: categoryData.name,
        color: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
      };
    });
    return config;
  }, [categorySalesData]);

  const monthlySalesData = useMemo(() => {
    const today = new Date();
    const monthsData: { name: string; totalSales: number }[] = [];
    for (let i = 2; i >= 0; i--) { 
      const targetMonthDate = subMonths(today, i);
      const monthName = format(targetMonthDate, 'MMM yy');
      const firstDay = startOfMonth(targetMonthDate);
      const lastDay = endOfMonth(targetMonthDate);

      const monthlyTotal = mockSales
        .filter(sale => {
          const saleDate = new Date(sale.date);
          return isWithinInterval(saleDate, { start: firstDay, end: lastDay });
        })
        .reduce((sum, sale) => sum + sale.totalAmount, 0);

      monthsData.push({ name: monthName, totalSales: monthlyTotal });
    }
    return monthsData;
  }, []);

  const monthlySalesChartConfig = {
    totalSales: { 
      label: "Sales",
    },
  } satisfies ChartConfig;


  const monthToDateSalesTableData: DailyComparisonRow[] = useMemo(() => {
    const tableData: DailyComparisonRow[] = [];
    const today = new Date(); 
    const currentMonth = getMonth(today);
    const currentYear = getYear(today);
    const daysInCurrentMonth = getDaysInMonth(new Date(currentYear, currentMonth)); 

    const firstDayPreviousMonth = startOfMonth(subMonths(today, 1));
    const prevMonth = getMonth(firstDayPreviousMonth);
    const prevYear = getYear(firstDayPreviousMonth);

    for (let day = 1; day <= daysInCurrentMonth; day++) { 
      const dateInCurrentMonth = new Date(currentYear, currentMonth, day);
      const salesCurrentMonth = mockSales
        .filter(s => isSameDay(new Date(s.date), dateInCurrentMonth))
        .reduce((acc, s) => acc + s.totalAmount, 0);

      let salesPreviousMonth = 0;
      let previousMonthDateDisplay: string | null = null;
      
      const tempPrevDate = new Date(prevYear, prevMonth, day);
      if (getMonth(tempPrevDate) === prevMonth) { 
        const dateInPreviousMonth = tempPrevDate;
        previousMonthDateDisplay = format(dateInPreviousMonth, 'MMM d, yy');
        salesPreviousMonth = mockSales
          .filter(s => isSameDay(new Date(s.date), dateInPreviousMonth))
          .reduce((acc, s) => acc + s.totalAmount, 0);
      }
      
      tableData.push({
        currentMonthDateDisplay: format(dateInCurrentMonth, 'MMM d, yy'),
        currentMonthSales: salesCurrentMonth,
        previousMonthDateDisplay: previousMonthDateDisplay,
        previousMonthSales: salesPreviousMonth,
      });
    }
    return tableData;
  }, []);


  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
          <BarChart3 className="h-7 w-7 text-primary" /> Advanced Analytics
        </h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <AnalyticsCard title="Total Sales" value={totalSalesAmount} icon={DollarSign} description="All successful transactions" isCurrency={true}/>
        <AnalyticsCard title="Total Expenses" value={totalExpensesAmount} icon={TrendingDown} description="All recorded business expenses" isCurrency={true}/>
        <AnalyticsCard title="Net Profit" value={netProfit} icon={TrendingUp} description="Sales minus expenses" isCurrency={true}/>
        <AnalyticsCard title="Current Stock Valuation" value={currentStockValuation} icon={Archive} description="Total cost value of current inventory" isCurrency={true}/>
        <AnalyticsCard 
            title="Account Payable" 
            value={totalAccountPayableAmount} 
            icon={Wallet} 
            description="Total outstanding dues to suppliers and for recorded expenses." 
            isCurrency={true}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
        <Card className="shadow-lg lg:col-span-1">
            <CardHeader>
                <CardTitle>Product Category Sales Distribution</CardTitle>
                <CardDescription>Quantity of products sold by category (all time).</CardDescription>
            </CardHeader>
            <CardContent className="h-[374px]">
              {categorySalesData.length > 0 ? (
                <ChartContainer config={categoryChartConfig} className="h-full w-full aspect-square">
                    <PieChart>
                    <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent hideLabel nameKey="name" />}
                    />
                    <Pie
                        data={categorySalesData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={70} 
                        innerRadius={40} 
                        labelLine={false}
                    >
                        {categorySalesData.map((entry) => (
                        <Cell
                            key={`cell-${entry.name}`}
                            fill={categoryChartConfig[entry.name]?.color}
                            className={cn("stroke-background focus:outline-none")}
                        />
                        ))}
                    </Pie>
                    <ChartLegend
                        content={<ChartLegendContent nameKey="name" className="text-[11px] leading-tight flex flex-col items-start gap-1" />}
                        layout="vertical"
                        verticalAlign="middle"
                        align="left"
                    />
                    </PieChart>
                </ChartContainer>
                ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                    No sales data available to display category distribution.
                </div>
                )}
            </CardContent>
        </Card>

        <Card className="shadow-lg lg:col-span-1">
          <CardHeader>
            <CardTitle>Monthly Sales (Last 3 Months)</CardTitle>
            <CardDescription>Comparison of total sales amounts.</CardDescription>
          </CardHeader>
          <CardContent className="h-[374px]">
            {monthlySalesData.length > 0 && monthlySalesData.some(m => m.totalSales > 0) ? (
              <ChartContainer config={monthlySalesChartConfig} className="h-full w-full">
                <BarChart data={monthlySalesData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis
                    tick={false} 
                    tickLine={false}
                    axisLine={false}
                  />
                  <ChartTooltip
                    cursor={{ fill: "hsl(var(--muted))" }}
                    content={<ChartTooltipContent />}
                  />
                  <Bar dataKey="totalSales" radius={[4, 4, 0, 0]}>
                    {monthlySalesData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={
                          index === 0 ? "hsl(var(--chart-1))" : 
                          index === 1 ? "hsl(var(--chart-2))" : 
                          "hsl(var(--chart-3))"
                        } 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No sales data available for the last 3 months.
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="shadow-lg lg:col-span-1">
          <CardHeader>
            <CardTitle>Month-to-Date Sales</CardTitle>
            <CardDescription>Daily sales comparison: Current vs. Previous Month.</CardDescription>
          </CardHeader>
          <CardContent className="h-[374px] p-0">
            {monthToDateSalesTableData.length > 0 && monthToDateSalesTableData.some(d => d.currentMonthSales > 0 || d.previousMonthSales > 0) ? (
              <ScrollArea className="h-full">
                <Table className="text-xs">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="px-3 py-2">Date (Current)</TableHead>
                      <TableHead className="text-right px-3 py-2">Amount (Current)</TableHead>
                      <TableHead className="px-3 py-2">Date (Prev.)</TableHead>
                      <TableHead className="text-right px-3 py-2">Amount (Prev.)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthToDateSalesTableData.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell className="px-3 py-1.5">{row.currentMonthDateDisplay}</TableCell>
                        <TableCell className="text-right px-3 py-1.5 font-medium">NRP {formatCurrency(row.currentMonthSales)}</TableCell>
                        <TableCell className="px-3 py-1.5">{row.previousMonthDateDisplay || '-'}</TableCell>
                        <TableCell className="text-right px-3 py-1.5 font-medium">
                          {row.previousMonthDateDisplay ? `NRP ${formatCurrency(row.previousMonthSales)}` : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No sales data available for month-to-date comparison.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
