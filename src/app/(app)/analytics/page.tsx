
"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import AnalyticsCard from "@/components/dashboard/AnalyticsCard";
import { BarChart3, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { mockSales, mockExpenses } from "@/lib/data"; // Import mock data

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
      {/* Placeholder for more detailed charts and reports */}
    </div>
  );
}
