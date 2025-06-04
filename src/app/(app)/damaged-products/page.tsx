
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { mockProducts } from "@/lib/data";
import type { Product } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertOctagon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export default function DamagedProductsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [damagedProductList, setDamagedProductList] = useState<Product[]>([]);

  useEffect(() => {
    if (user && user.role !== 'admin') {
      toast({ title: "Access Denied", description: "You do not have permission to view this page.", variant: "destructive" });
      router.push('/dashboard');
      return;
    }
    // Filter and sort products with damaged quantity
    const filtered = mockProducts
      .filter(p => p.damagedQuantity > 0)
      .sort((a, b) => a.name.localeCompare(b.name));
    setDamagedProductList(filtered);
  }, [user, router, toast]); // mockProducts dependency can be added if it's expected to change from other actions dynamically

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
          <AlertOctagon className="h-7 w-7 text-destructive" /> Damaged Product Report
        </h1>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>List of Damaged Products</CardTitle>
          <CardDescription>
            Products with one or more units recorded as damaged. Damage is typically recorded during sale flagging.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-center">Units Damaged</TableHead>
                <TableHead className="text-center">Sellable Stock</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {damagedProductList.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell className="text-center font-semibold text-destructive">{product.damagedQuantity}</TableCell>
                  <TableCell className="text-center">{product.stock}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {damagedProductList.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No products are currently recorded as damaged.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
