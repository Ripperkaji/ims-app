
"use client";

import { useMemo, useEffect } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { mockProducts, mockLogEntries } from "@/lib/data";
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
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (user && user.role !== 'admin') {
      toast({ title: "Access Denied", description: "You do not have permission to view this page.", variant: "destructive" });
      router.push('/dashboard');
    }
  }, [user, router, toast]);

  const damagedProductList = useMemo(() => {
    // Ensure we are working with the latest mockProducts and mockLogEntries
    // Since they are global mutable arrays, their references don't change,
    // so useMemo will re-run if its dependencies change, but for direct mutation,
    // we assume other parts of the app might trigger re-renders that cause this to re-evaluate.
    // For a more robust mock, a refresh trigger could be passed or a global state solution used.

    const filteredAndEnriched = mockProducts
      .filter(p => p.damagedQuantity > 0)
      .map(p => {
        const relevantLogs = mockLogEntries
          .filter(
            log =>
              log.action === "Product Damage & Stock Update (Exchange)" &&
              log.details.includes(p.name) // Simple string matching for product name
          )
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()); // Most recent first
        
        return {
          ...p,
          dateOfDamageLogged: relevantLogs.length > 0 ? relevantLogs[0].timestamp : undefined,
        };
      })
      .sort((a, b) => {
        // Sort by dateOfDamageLogged (most recent first), then by product name
        if (a.dateOfDamageLogged && b.dateOfDamageLogged) {
          const dateComparison = new Date(b.dateOfDamageLogged).getTime() - new Date(a.dateOfDamageLogged).getTime();
          if (dateComparison !== 0) return dateComparison;
        } else if (a.dateOfDamageLogged) {
          return -1; // Products with dates come before those without
        } else if (b.dateOfDamageLogged) {
          return 1;  // Products without dates come after those with
        }
        // Fallback to sorting by name if dates are the same or one is missing
        return a.name.localeCompare(b.name);
      });

    return filteredAndEnriched;
  }, [mockProducts, mockLogEntries]); // Technically, mockProducts and mockLogEntries are stable references.
                                      // The list will update when this component re-renders due to other state changes
                                      // or navigations that cause a fresh evaluation.

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
