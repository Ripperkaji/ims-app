"use client";

import { useMemo, useEffect } from 'react';
import { useAuthStore } from "@/stores/authStore";
import { mockProducts } from "@/lib/data";
import type { AcquisitionBatch } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Briefcase, ShoppingCart, DollarSign, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { format, parseISO } from 'date-fns';
import { formatCurrency, cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


interface PurchaseHistoryItem extends AcquisitionBatch {
  productName: string;
}

interface Supplier {
  name: string;
  purchaseHistory: PurchaseHistoryItem[];
  totalSpent: number; // This is total value of goods acquired, not necessarily paid
  totalDue: number;
  firstPurchaseDate: string; // ISO string
  lastPurchaseDate: string; // ISO string
}

export default function SuppliersPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (user && user.role !== 'admin') {
      toast({ title: "Access Denied", description: "You do not have permission to view this page.", variant: "destructive" });
      router.push('/dashboard');
    }
  }, [user, router, toast]);

  const suppliers = useMemo(() => {
    const supplierMap = new Map<string, Supplier>();

    mockProducts.forEach(product => {
      const fullProductName = `${product.name}${product.modelName ? ` (${product.modelName})` : ''}${product.flavorName ? ` - ${product.flavorName}` : ''}`;
      
      product.acquisitionHistory.forEach(batch => {
        if (!batch.supplierName) return;

        const key = batch.supplierName;
        
        if (!supplierMap.has(key)) {
          supplierMap.set(key, {
            name: key,
            purchaseHistory: [],
            totalSpent: 0,
            totalDue: 0,
            firstPurchaseDate: batch.date,
            lastPurchaseDate: batch.date,
          });
        }

        const supplier = supplierMap.get(key)!;
        supplier.purchaseHistory.push({ ...batch, productName: fullProductName });
        supplier.totalSpent += batch.totalBatchCost;
        supplier.totalDue += batch.dueToSupplier;
        
        if (new Date(batch.date) < new Date(supplier.firstPurchaseDate)) {
          supplier.firstPurchaseDate = batch.date;
        }
        if (new Date(batch.date) > new Date(supplier.lastPurchaseDate)) {
          supplier.lastPurchaseDate = batch.date;
        }
      });
    });

    const sortedSuppliers = Array.from(supplierMap.values());
    
    sortedSuppliers.forEach(supplier => {
      supplier.purchaseHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });

    return sortedSuppliers.sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  if (!user || user.role !== 'admin') {
    return null;
  }
  
  const getPaymentDetailsTooltip = (batch: PurchaseHistoryItem) => {
    let details = `Method: ${batch.paymentMethod}. Batch Cost: NRP ${formatCurrency(batch.totalBatchCost)}. `;
    if (batch.paymentMethod === 'Hybrid') {
      details += `(Paid Cash: NRP ${formatCurrency(batch.cashPaid)}, Paid Digital: NRP ${formatCurrency(batch.digitalPaid)}, Due: NRP ${formatCurrency(batch.dueToSupplier)})`;
    } else if (batch.paymentMethod === 'Due') {
      details += `(Outstanding Due: NRP ${formatCurrency(batch.dueToSupplier)})`;
    } else {
      details += `(Batch Fully Paid via ${batch.paymentMethod})`;
    }
    return details;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
          <Briefcase className="h-7 w-7 text-primary" /> Vendors/Suppliers
        </h1>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Vendor/Supplier List</CardTitle>
          <CardDescription>
            {`Showing ${suppliers.length} vendor(s)/supplier(s). Click on an entry to view their purchase history.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {suppliers.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {suppliers.map((supplier) => (
                <AccordionItem value={supplier.name} key={supplier.name}>
                  <AccordionTrigger className="hover:bg-muted/30 px-4 py-3 rounded-md text-sm">
                    <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-x-4 items-center text-left">
                        <div className="font-semibold text-base truncate flex items-center gap-2">
                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                            {supplier.name}
                        </div>
                        <div className="text-muted-foreground hidden md:flex items-center gap-2 text-xs">
                           <ShoppingCart className="h-3 w-3" /> {supplier.purchaseHistory.length} Acquisitions
                        </div>
                         <div className="font-medium flex items-center gap-2 text-xs">
                           <DollarSign className="h-3 w-3" /> Total Acquired: NRP {formatCurrency(supplier.totalSpent)}
                        </div>
                        <div className="font-medium flex items-center gap-2 text-xs">
                           <AlertCircle className="h-3 w-3 text-destructive" /> Total Due: NRP {formatCurrency(supplier.totalDue)}
                        </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 py-3 bg-muted/20">
                    <h4 className="text-sm font-semibold mb-2">Purchase History from {supplier.name}</h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[120px]">Date</TableHead>
                          <TableHead>Product</TableHead>
                          <TableHead className="text-center">Qty</TableHead>
                          <TableHead className="text-right">Cost/Unit</TableHead>
                          <TableHead className="text-right">Total Cost</TableHead>
                          <TableHead className="text-center">Payment</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {supplier.purchaseHistory.map((batch) => (
                          <TableRow key={batch.batchId}>
                            <TableCell>{format(parseISO(batch.date), 'MMM dd, yyyy')}</TableCell>
                            <TableCell className="text-xs max-w-xs truncate font-medium">
                               {batch.productName}
                            </TableCell>
                            <TableCell className="text-center">{batch.quantityAdded}</TableCell>
                            <TableCell className="text-right">NRP {formatCurrency(batch.costPricePerUnit)}</TableCell>
                            <TableCell className="text-right font-semibold">NRP {formatCurrency(batch.totalBatchCost)}</TableCell>
                            <TableCell className="text-center">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge variant={batch.dueToSupplier > 0 ? "destructive" : "default"} className={cn(batch.dueToSupplier > 0 ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600", "text-xs cursor-default")}>
                                      {batch.paymentMethod}
                                      {batch.dueToSupplier > 0 && <AlertCircle className="ml-1 h-3 w-3" />}
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="max-w-xs">{getPaymentDetailsTooltip(batch)}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                     <div className="text-xs text-muted-foreground mt-2 flex justify-between">
                       <span>First Purchase: {format(parseISO(supplier.firstPurchaseDate), 'MMM dd, yyyy')}</span>
                       <span>Last Purchase: {format(parseISO(supplier.lastPurchaseDate), 'MMM dd, yyyy')}</span>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No suppliers found in product acquisition history.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
