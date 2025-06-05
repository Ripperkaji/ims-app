
"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import AnalyticsCard from "@/components/dashboard/AnalyticsCard";
import { BarChart3, DollarSign, TrendingUp, TrendingDown, Archive } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { mockSales, mockExpenses, mockProducts } from "@/lib/data"; 
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { format } from 'date-fns';

const chartConfig = {
  sales: { label: "Sales", color: "hsl(var(--primary))" },
} satisfies ChartConfig;

export default function AnalyticsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (user && user.role !== 'admin') {
      toast({ title: "Access Denied", description: "You do not have permission to view this page.", variant: "destructive" });
      router.push('/dashboard');
    }
  }, [user, router, toast]);

  const totalSalesAmount = useMemo(() => mockSales.reduce((sum, sale) => sum + sale.totalAmount, 0), [mockSales]);
  const totalExpensesAmount = useMemo(() => mockExpenses.reduce((sum, expense) => sum + expense.amount, 0), [mockExpenses]);
  const netProfit = useMemo(() => totalSalesAmount - totalExpensesAmount, [totalSalesAmount, totalExpensesAmount]);
  
  const currentStockValuation = useMemo(() => {
    return mockProducts.reduce((sum, product) => sum + (product.stock * product.costPrice), 0);
  }, [mockProducts]);

  const salesTrendData = useMemo(() => {
    const salesByDay: { [key: string]: number } = {};
    // Use a copy of mockSales to avoid potential direct mutation issues if sorting is ever added to mockSales itself
    const sortedSales = [...mockSales].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    sortedSales.forEach(sale => {
      const day = format(new Date(sale.date), 'MMM dd');
      salesByDay[day] = (salesByDay[day] || 0) + sale.totalAmount;
    });
    // Get the last 7 unique days with sales
    const uniqueDays = Object.keys(salesByDay);
    const last7UniqueDaysWithSales = uniqueDays.slice(-7);
    
    return last7UniqueDaysWithSales.map(day => ({
        date: day,
        sales: salesByDay[day]
    }));
  }, [mockSales]);


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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <AnalyticsCard title="Total Sales" value={totalSalesAmount} icon={DollarSign} description="All successful transactions" isCurrency={true}/>
        <AnalyticsCard title="Total Expenses" value={totalExpensesAmount} icon={TrendingDown} description="All recorded business expenses" isCurrency={true}/>
        <AnalyticsCard title="Net Profit" value={netProfit} icon={TrendingUp} description="Sales minus expenses" isCurrency={true}/>
        <AnalyticsCard title="Current Stock Valuation" value={currentStockValuation} icon={Archive} description="Total cost value of current inventory" isCurrency={true}/>
      </div>
      
      <div className="grid gap-4 md:grid-cols-1">
        <Card>
            <CardHeader>
              <CardTitle className="font-headline">Sales Trend (Last 7 entries)</CardTitle>
              <CardDescription>Visual overview of sales performance based on days with recorded sales.</CardDescription>
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
      </div>

      <Card className="shadow-lg mt-6">
        <CardHeader>
          <CardTitle>Comprehensive Analytics Dashboard</CardTitle>
          <CardDescription>
            More detailed insights and reports will be available here. (Under Construction)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <BarChart3 className="h-16 w-16 mx-auto mb-4" />
            <p className="text-lg">This section will provide in-depth analytics.</p>
            <p>More features coming soon!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

