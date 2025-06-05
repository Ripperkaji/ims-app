
"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import AnalyticsCard from "@/components/dashboard/AnalyticsCard";
import { DollarSign, TrendingUp, TrendingDown, Archive, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { mockSales, mockExpenses, mockProducts } from "@/lib/data"; 
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";

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

  const totalSalesAmount = useMemo(() => mockSales.reduce((sum, sale) => sum + sale.totalAmount, 0), []);
  const totalExpensesAmount = useMemo(() => mockExpenses.reduce((sum, expense) => sum + expense.amount, 0), []);
  const netProfit = useMemo(() => totalSalesAmount - totalExpensesAmount, [totalSalesAmount, totalExpensesAmount]);
  
  const currentStockValuation = useMemo(() => {
    return mockProducts.reduce((sum, product) => sum + (product.stock * product.costPrice), 0);
  }, []);

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
        label: categoryData.name, // Reverted to simple name
        color: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
      };
    });
    return config;
  }, [categorySalesData]);


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
      
      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
        <Card className="shadow-lg lg:col-span-1">
            <CardHeader>
                <CardTitle>Product Category Sales Distribution</CardTitle>
                <CardDescription>Quantity of products sold by category (all time).</CardDescription>
            </CardHeader>
            <CardContent>
              {categorySalesData.length > 0 ? (
                <ChartContainer config={categoryChartConfig} className="mx-auto aspect-square max-h-[350px]">
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
                        outerRadius={120}
                        innerRadius={70}
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
                        content={<ChartLegendContent nameKey="name" className="text-xs" />}
                        verticalAlign="bottom"
                        align="center"
                    />
                    </PieChart>
                </ChartContainer>
                ) : (
                <div className="flex items-center justify-center h-[350px] text-muted-foreground">
                    No sales data available to display category distribution.
                </div>
                )}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}

