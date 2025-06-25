
"use client";

import { useEffect, useState, useMemo } from 'react';
import { useAuthStore } from "@/stores/authStore";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Wallet, DollarSign, Archive, Landmark } from "lucide-react";
import { mockProducts, mockSales, mockCapital, updateCashInHand } from "@/lib/data";
import { calculateCurrentStock } from '@/lib/productUtils';
import { format } from 'date-fns';

export default function CapitalManagementPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { toast } = useToast();

  const [currentCashInHand, setCurrentCashInHand] = useState(mockCapital.cashInHand);
  const [lastUpdated, setLastUpdated] = useState(mockCapital.lastUpdated);
  const [newCashAmount, setNewCashAmount] = useState<string>('');

  useEffect(() => {
    if (user && user.role !== 'admin') {
      toast({
        title: "Access Denied",
        description: "You do not have permission to view this page.",
        variant: "destructive"
      });
      router.push('/dashboard');
    }
  }, [user, router, toast]);

  const currentInventoryValue = useMemo(() => {
    return mockProducts.reduce((sum, product) => {
      const stock = calculateCurrentStock(product, mockSales);
      return sum + (stock * product.currentCostPrice);
    }, 0);
  }, [mockProducts, mockSales]);

  const totalCapital = useMemo(() => {
    return currentCashInHand + currentInventoryValue;
  }, [currentCashInHand, currentInventoryValue]);

  const handleUpdateCash = () => {
    if (!user) return;
    const amount = parseFloat(newCashAmount);
    if (isNaN(amount) || amount < 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid non-negative number for cash in hand.", variant: "destructive" });
      return;
    }

    const { newAmount, lastUpdated: updatedTimestamp } = updateCashInHand(amount, user.name);
    setCurrentCashInHand(newAmount);
    setLastUpdated(updatedTimestamp);
    setNewCashAmount(''); // Clear input

    toast({ title: "Success", description: `Cash in hand has been updated to NRP ${amount.toFixed(2)}.` });
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
        <Wallet className="h-7 w-7 text-primary" /> Capital Management
      </h1>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Capital Overview</CardTitle>
          <CardDescription>
            A snapshot of your business's current capital. Last updated: {format(new Date(lastUpdated), "MMM dd, yyyy 'at' p")}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="p-4 border rounded-lg">
                <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2"><DollarSign/> Cash in Hand</h3>
                <p className="text-2xl font-bold">NRP {currentCashInHand.toFixed(2)}</p>
            </div>
             <div className="p-4 border rounded-lg">
                <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Archive/> Inventory Value (Cost)</h3>
                <p className="text-2xl font-bold">NRP {currentInventoryValue.toFixed(2)}</p>
            </div>
             <div className="p-4 border rounded-lg bg-muted/50">
                <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Wallet/> Total Capital</h3>
                <p className="text-2xl font-bold text-primary">NRP {totalCapital.toFixed(2)}</p>
            </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Update Cash in Hand</CardTitle>
          <CardDescription>
            Use this form to set or adjust the current amount of cash available to the business. This action will be logged.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="space-y-2 max-w-sm">
                <Label htmlFor="cashAmount">New Cash Amount (NRP)</Label>
                <Input
                    id="cashAmount"
                    type="number"
                    value={newCashAmount}
                    onChange={(e) => setNewCashAmount(e.target.value)}
                    placeholder="Enter total cash amount"
                    min="0"
                    step="0.01"
                />
            </div>
        </CardContent>
        <CardFooter>
            <Button onClick={handleUpdateCash}>
                <Landmark className="mr-2 h-4 w-4" /> Update Cash Amount
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
