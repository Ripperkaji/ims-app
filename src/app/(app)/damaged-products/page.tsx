
"use client";

import { useMemo, useEffect } from 'react';
import { useAuthStore } from "@/stores/authStore";
import { mockProducts, mockLogEntries, mockSales } from "@/lib/data";
import type { Product } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertOctagon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { format } from 'date-fns';

interface DamagedProductEntry extends Product {
  dateOfDamageLogged?: string;
}

export default function DamagedProductsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (user && user.role !== 'admin') {
      toast({ title: "Access Denied", description: "You do not have permission to view this page.", variant: "destructive" });
      router.push('/dashboard');
    }
  }, [user, router, toast]);

  const damagedProductList = useMemo(() => {
    const filteredAndEnriched = mockProducts
      .filter(p => p.damagedQuantity > 0)
      .map(p => {
        const relevantLogs = mockLogEntries
          .filter(
            log =>
              log.action === "Product Damage & Stock Update (Exchange)" &&
              log.details.includes(p.name) 
          )
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()); 
        
        return {
          ...p,
          dateOfDamageLogged: relevantLogs.length > 0 ? relevantLogs[0].timestamp : undefined,
        };
      })
      .sort((a, b) => {
        if (a.dateOfDamageLogged && b.dateOfDamageLogged) {
          const dateComparison = new Date(b.dateOfDamageLogged).getTime() - new Date(a.dateOfDamageLogged).getTime();
          if (dateComparison !== 0) return dateComparison;
        } else if (a.dateOfDamageLogged) {
          return -1; 
        } else if (b.dateOfDamageLogged) {
          return 1;  
        }
        return a.name.localeCompare(b.name);
      });

    return filteredAndEnriched;
  }, []); 

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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-center">Units Damaged</TableHead>
                <TableHead className="text-center">Sellable Stock</TableHead>
                <TableHead>Date of Damage Logged</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {damagedProductList.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell className="text-center font-semibold text-destructive">{product.damagedQuantity}</TableCell>
                  <TableCell className="text-center">{product.acquisitionHistory.reduce((acc, batch) => acc + batch.quantityAdded, 0) - product.damagedQuantity - (product.testerQuantity || 0) - mockSales.flatMap(s => s.items).filter(si => si.productId === product.id).reduce((acc, si) => acc + si.quantity, 0)}</TableCell>
                  <TableCell>
                    {product.dateOfDamageLogged
                      ? format(new Date(product.dateOfDamageLogged), 'MMM dd, yyyy HH:mm') 
                      : 'N/A'}
                  </TableCell>
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
