
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { mockProducts, mockLogEntries } from "@/lib/data"; // Import mockLogEntries
import type { Product } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertOctagon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { format } from 'date-fns'; // Import format

interface DamagedProductEntry extends Product {
  dateOfDamageLogged?: string;
}

export default function DamagedProductsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [damagedProductList, setDamagedProductList] = useState<DamagedProductEntry[]>([]);

  useEffect(() => {
    if (user && user.role !== 'admin') {
      toast({ title: "Access Denied", description: "You do not have permission to view this page.", variant: "destructive" });
      router.push('/dashboard');
      return;
    }

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

    setDamagedProductList(filteredAndEnriched);
  }, [user, router, toast]);

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
                  <TableCell className="text-center">{product.stock}</TableCell>
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
