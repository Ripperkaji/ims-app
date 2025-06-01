"use client";

import AnalyticsCard from "@/components/dashboard/AnalyticsCard";
import { mockSales, mockExpenses, mockProducts } from "@/lib/data";
import { DollarSign, ShoppingCart, Package, AlertTriangle, BarChart3, TrendingUp, TrendingDown, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, LineChart, Line } from "recharts"
import { format } from 'date-fns';

const chartConfig = {
  sales: { label: "Sales", color: "hsl(var(--primary))" },
  expenses: { label: "Expenses", color: "hsl(var(--destructive))" },
} satisfies ChartConfig


export default function DashboardPage() {
  const { user } = useAuth();

  const totalSalesAmount = mockSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const totalExpensesAmount = mockExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const netProfit = totalSalesAmount - totalExpensesAmount;
  const dueSalesCount = mockSales.filter(sale => sale.status === 'Due').length;
  const totalProducts = mockProducts.length;
  const lowStockProducts = mockProducts.filter(p => p.stock < 10).length;

  // Prepare data for sales trend chart (e.g., last 7 days)
  const salesByDay: { [key: string]: number } = {};
  mockSales.forEach(sale => {
    const day = format(new Date(sale.date), 'MMM dd');
    salesByDay[day] = (salesByDay[day] || 0) + sale.totalAmount;
  });
  const salesTrendData = Object.entries(salesByDay)
    .map(([date, sales]) => ({ date, sales }))
    .slice(-7); // Last 7 entries for trend

  const recentSales = [...mockSales].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0,5);


  if (!user) return null; // Should be handled by layout, but good practice

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">Welcome, {user.name}!</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <AnalyticsCard title="Total Sales" value={totalSalesAmount} icon={DollarSign} description="All successful transactions" />
        {user.role === 'admin' && (
          <>
            <AnalyticsCard title="Total Expenses" value={totalExpensesAmount} icon={TrendingDown} description="All recorded business expenses" />
            <AnalyticsCard title="Net Profit" value={netProfit} icon={TrendingUp} description="Sales minus expenses" />
            <AnalyticsCard title="Due Payments" value={dueSalesCount} icon={AlertTriangle} description="Number of sales pending payment" />
          </>
        )}
        <AnalyticsCard title="Total Products" value={totalProducts} icon={Package} description="Available product types" />
        <AnalyticsCard title="Low Stock Items" value={lowStockProducts} icon={Users /* Using Users as placeholder, consider better icon */} description="Products needing restocking" />
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
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentSales.map(sale => (
                    <TableRow key={sale.id}>
                      <TableCell>{sale.customerName}</TableCell>
                      <TableCell>${sale.totalAmount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={sale.status === 'Paid' ? 'default' : 'destructive'} className={sale.status === 'Paid' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}>
                          {sale.status}
                        </Badge>
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
      )}

    </div>
  );
}

// Placeholder for a more complex chart if needed later
function PlaceholderChart() {
  return (
    <div className="flex items-center justify-center h-full w-full bg-muted/50 rounded-md p-8">
      <BarChart3 className="h-16 w-16 text-muted-foreground" />
      <p className="ml-4 text-muted-foreground">Chart data will be displayed here.</p>
    </div>
  )
}
