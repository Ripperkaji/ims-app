
"use client";

import { useState, useEffect } from 'react';
import { useAuthStore } from "@/stores/authStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertOctagon, Loader2, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { format, parseISO } from 'date-fns';
import { formatCurrency } from '@/lib/utils';

interface DamagedProductEntry {
  id: string;
  name: string;
  modelName?: string;
  flavorName?: string;
  category: string;
  damagedQuantity: number;
  sellableStock: number;
  dateOfDamageLogged?: string;
  totalDamageCost: number;
}

export default function DamagedProductsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { toast } = useToast();
  const [damagedProducts, setDamagedProducts] = useState<DamagedProductEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user && user.role !== 'admin') {
      toast({ title: "Access Denied", description: "You do not have permission to view this page.", variant: "destructive" });
      router.push('/dashboard');
      return;
    }

    const fetchDamagedProducts = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/products/damaged');
        if (!response.ok) {
          throw new Error('Failed to fetch damaged products');
        }
        const data = await response.json();
        setDamagedProducts(data);
      } catch (error) {
        toast({ title: "Error", description: "Could not fetch damaged products.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDamagedProducts();
  }, [user, router, toast]);

  const totalCostOfAllDamaged = damagedProducts.reduce((sum, p) => sum + p.totalDamageCost, 0);

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
            Products with units recorded as damaged. Damage is typically recorded during sale flagging.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
             </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Variant</TableHead>
                  <TableHead className="text-center">Units Damaged</TableHead>
                  <TableHead className="text-center">Sellable Stock</TableHead>
                  <TableHead className="text-right">Total Damage Cost</TableHead>
                  <TableHead>Date of Damage Logged</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {damagedProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.modelName || 'N/A'}</TableCell>
                    <TableCell>{product.flavorName || 'N/A'}</TableCell>
                    <TableCell className="text-center font-semibold text-destructive">{product.damagedQuantity}</TableCell>
                    <TableCell className="text-center">{product.sellableStock}</TableCell>
                    <TableCell className="text-right font-semibold text-destructive">NRP {formatCurrency(product.totalDamageCost)}</TableCell>
                    <TableCell>
                      {product.dateOfDamageLogged
                        ? format(parseISO(product.dateOfDamageLogged), 'MMM dd, yyyy HH:mm') 
                        : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {!isLoading && damagedProducts.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No products are currently recorded as damaged.
            </div>
          )}
        </CardContent>
        {!isLoading && totalCostOfAllDamaged > 0 && (
            <CardFooter className="flex justify-end items-center gap-2 border-t pt-4">
                <DollarSign className="h-5 w-5 text-destructive"/>
                <p className="text-base font-semibold">Total Cost of Damaged Goods:</p>
                <p className="text-xl font-bold text-destructive">NRP {formatCurrency(totalCostOfAllDamaged)}</p>
            </CardFooter>
        )}
      </Card>
    </div>
  );
}
