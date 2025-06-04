
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { mockProducts, mockLogEntries } from "@/lib/data";
import type { Product, LogEntry } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FlaskConical, Edit, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

interface ProductWithTesterInput extends Product {
  testerInput: string; // For controlled input state
}

export default function TestersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [productsForTesterMgmt, setProductsForTesterMgmt] = useState<ProductWithTesterInput[]>([]);

  useEffect(() => {
    if (user && user.role !== 'admin') {
      toast({ title: "Access Denied", description: "You do not have permission to view this page.", variant: "destructive" });
      router.push('/dashboard');
      return;
    }
    // Initialize products with their current tester quantity as string for input
    const initialProducts = mockProducts.map(p => ({
      ...p,
      testerInput: (p.testerQuantity || 0).toString()
    })).sort((a, b) => a.name.localeCompare(b.name));
    setProductsForTesterMgmt(initialProducts);
  }, [user, router, toast]);

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

  const handleTesterInputChange = (productId: string, value: string) => {
    setProductsForTesterMgmt(prevProducts =>
      prevProducts.map(p =>
        p.id === productId ? { ...p, testerInput: value } : p
      )
    );
  };

  const handleUpdateTesterQuantity = (productId: string) => {
    if (!user) return;

    const productState = productsForTesterMgmt.find(p => p.id === productId);
    const productGlobalIndex = mockProducts.findIndex(p => p.id === productId);

    if (!productState || productGlobalIndex === -1) {
      toast({ title: "Error", description: "Product not found.", variant: "destructive" });
      return;
    }

    const currentProductGlobal = mockProducts[productGlobalIndex];
    const oldTesterQty = currentProductGlobal.testerQuantity || 0;
    const oldStock = currentProductGlobal.stock;

    const newDesiredTesterQty = parseInt(productState.testerInput, 10);

    if (isNaN(newDesiredTesterQty) || newDesiredTesterQty < 0) {
      toast({ title: "Invalid Input", description: "Tester quantity must be a non-negative number.", variant: "destructive" });
      // Reset input to reflect current global state
      setProductsForTesterMgmt(prev => prev.map(p => p.id === productId ? {...p, testerInput: oldTesterQty.toString()} : p));
      return;
    }

    if (newDesiredTesterQty === oldTesterQty) {
      toast({ title: "No Change", description: "Tester quantity is already set to this value.", variant: "default" });
      return;
    }

    const deltaTesters = newDesiredTesterQty - oldTesterQty;

    if (deltaTesters > 0) { // Increasing testers
      if (oldStock < deltaTesters) {
        toast({
          title: "Insufficient Stock",
          description: `Not enough sellable stock to convert to testers. Available: ${oldStock}. Needed: ${deltaTesters}. Max testers: ${oldTesterQty + oldStock}.`,
          variant: "destructive",
          duration: 7000
        });
         setProductsForTesterMgmt(prev => prev.map(p => p.id === productId ? {...p, testerInput: oldTesterQty.toString()} : p));
        return;
      }
      mockProducts[productGlobalIndex].stock -= deltaTesters;
      mockProducts[productGlobalIndex].testerQuantity += deltaTesters;
    } else { // Decreasing testers (deltaTesters is negative)
      mockProducts[productGlobalIndex].stock -= deltaTesters; // e.g., stock - (-1) = stock + 1
      mockProducts[productGlobalIndex].testerQuantity += deltaTesters; // e.g., testers + (-1) = testers - 1
    }

    // Update local state for UI consistency
    const updatedProductForState = { ...mockProducts[productGlobalIndex], testerInput: mockProducts[productGlobalIndex].testerQuantity.toString() };
    setProductsForTesterMgmt(prevProducts =>
      prevProducts.map(p =>
        p.id === productId ? updatedProductForState : p
      ).sort((a, b) => a.name.localeCompare(b.name))
    );

    addLog(
      "Tester Quantity Updated",
      `Tester quantity for '${currentProductGlobal.name}' (ID: ${productId.substring(0,8)}...) changed from ${oldTesterQty} to ${newDesiredTesterQty} by ${user.name}. Sellable stock adjusted from ${oldStock} to ${mockProducts[productGlobalIndex].stock}.`
    );
    toast({
      title: "Tester Quantity Updated",
      description: `Testers for ${currentProductGlobal.name} set to ${newDesiredTesterQty}. Stock is now ${mockProducts[productGlobalIndex].stock}.`,
    });
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
          <FlaskConical className="h-7 w-7 text-primary" /> Tester Product Management
        </h1>
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Manage Tester Units</CardTitle>
          <CardDescription>
            Set the number of tester units for each product. Adjusting testers will affect sellable stock.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-center">Sellable Stock</TableHead>
                <TableHead className="text-center">Current Testers</TableHead>
                <TableHead className="w-40 text-center">Set Tester Qty</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productsForTesterMgmt.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell className="text-center">{mockProducts.find(p=>p.id === product.id)?.stock || 0}</TableCell>
                  <TableCell className="text-center">{mockProducts.find(p=>p.id === product.id)?.testerQuantity || 0}</TableCell>
                  <TableCell className="text-center">
                    <Input
                      type="number"
                      value={product.testerInput}
                      onChange={(e) => handleTesterInputChange(product.id, e.target.value)}
                      className="w-24 h-9 text-center mx-auto"
                      min="0"
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateTesterQuantity(product.id)}
                      disabled={parseInt(product.testerInput,10) === (mockProducts.find(p=>p.id === product.id)?.testerQuantity || 0) && product.testerInput === (mockProducts.find(p=>p.id === product.id)?.testerQuantity || 0).toString()}
                    >
                      <Save className="mr-2 h-4 w-4" /> Update
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {productsForTesterMgmt.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No products found in the inventory.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
