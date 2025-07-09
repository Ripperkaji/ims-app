
"use client";

import { useMemo, useEffect, useState } from 'react';
import { useAuthStore } from "@/stores/authStore";
import { mockSales, mockProducts } from "@/lib/data";
import type { Sale, ProductType } from '@/types';
import { ALL_PRODUCT_TYPES } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Phone, ShoppingCart, DollarSign, Filter, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { format, parseISO } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import SaleDetailsDialog from '@/components/sales/SaleDetailsDialog';

interface Customer {
  id: string;
  name: string;
  contact?: string;
  purchaseHistory: Sale[];
  totalPurchases: number;
  totalSpent: number;
  firstSeen: string; // ISO string
  lastSeen: string; // ISO string
}

export default function CustomersPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { toast } = useToast();

  const [filterContact, setFilterContact] = useState('');
  const [filterProduct, setFilterProduct] = useState('');
  const [filterCategory, setFilterCategory] = useState<ProductType | ''>('');
  const [saleToView, setSaleToView] = useState<Sale | null>(null);

  useEffect(() => {
    if (user && user.role !== 'admin') {
      toast({ title: "Access Denied", description: "You do not have permission to view this page.", variant: "destructive" });
      router.push('/dashboard');
    }
  }, [user, router, toast]);

  const customers = useMemo(() => {
    const customerMap = new Map<string, Customer>();

    mockSales.forEach(sale => {
      const key = `${sale.customerName.trim().toLowerCase()}-${(sale.customerContact || '').trim()}`;
      
      if (!customerMap.has(key)) {
        customerMap.set(key, {
          id: key,
          name: sale.customerName,
          contact: sale.customerContact,
          purchaseHistory: [],
          totalPurchases: 0,
          totalSpent: 0,
          firstSeen: sale.date,
          lastSeen: sale.date,
        });
      }

      const customer = customerMap.get(key)!;
      customer.purchaseHistory.push(sale);
      customer.totalPurchases += 1;
      customer.totalSpent += sale.totalAmount;
      
      if (new Date(sale.date) < new Date(customer.firstSeen)) {
        customer.firstSeen = sale.date;
      }
      if (new Date(sale.date) > new Date(customer.lastSeen)) {
        customer.lastSeen = sale.date;
      }
    });

    let filteredCustomers = Array.from(customerMap.values());

    if (filterContact) {
      filteredCustomers = filteredCustomers.filter(c => c.contact?.includes(filterContact.trim()));
    }

    if (filterProduct) {
      const lowerCaseFilterProduct = filterProduct.toLowerCase();
      filteredCustomers = filteredCustomers.filter(c =>
        c.purchaseHistory.some(sale =>
          sale.items.some(item =>
            item.productName.toLowerCase().includes(lowerCaseFilterProduct)
          )
        )
      );
    }

    if (filterCategory) {
      filteredCustomers = filteredCustomers.filter(c =>
        c.purchaseHistory.some(sale =>
          sale.items.some(item => {
            const product = mockProducts.find(p => p.id === item.productId);
            return product?.category === filterCategory;
          })
        )
      );
    }

    filteredCustomers.forEach(customer => {
      customer.purchaseHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });

    return filteredCustomers.sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime());
  }, [filterContact, filterProduct, filterCategory]);

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
          <Users className="h-7 w-7 text-primary" /> Customer Database
        </h1>
      </div>

      <Card className="shadow-md mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary"/> Filter Customers
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="contactFilter">Contact Number</Label>
            <Input
              id="contactFilter"
              placeholder="Search by contact..."
              value={filterContact}
              onChange={(e) => setFilterContact(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="productFilter">Product Name/Variant</Label>
            <Input
              id="productFilter"
              placeholder="Search by product name..."
              value={filterProduct}
              onChange={(e) => setFilterProduct(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="categoryFilter">Product Category</Label>
            <Select
              value={filterCategory}
              onValueChange={(value) => setFilterCategory(value === 'ALL_CATEGORIES' ? '' : value as ProductType)}
            >
              <SelectTrigger id="categoryFilter" className="mt-1">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL_CATEGORIES">All Categories</SelectItem>
                {ALL_PRODUCT_TYPES.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Customer List</CardTitle>
          <CardDescription>
            {`Showing ${customers.length} customer(s). Click on a customer to view their purchase history.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {customers.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {customers.map((customer) => (
                <AccordionItem value={customer.id} key={customer.id}>
                  <AccordionTrigger className="hover:bg-muted/30 px-4 py-3 rounded-md text-sm">
                    <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-x-4 items-center text-left">
                        <div className="font-semibold text-base truncate flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            {customer.name}
                        </div>
                        <div className="text-muted-foreground flex items-center gap-2 text-xs">
                           {customer.contact ? <><Phone className="h-3 w-3" /> {customer.contact}</> : 'No Contact'}
                        </div>
                        <div className="text-muted-foreground hidden md:flex items-center gap-2 text-xs">
                           <ShoppingCart className="h-3 w-3" /> {customer.totalPurchases} Purchases
                        </div>
                        <div className="font-medium flex items-center gap-2 text-xs">
                           <DollarSign className="h-3 w-3" /> Total Spent: NRP {formatCurrency(customer.totalSpent)}
                        </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 py-3 bg-muted/20">
                    <h4 className="text-sm font-semibold mb-2">Purchase History for {customer.name}</h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[120px]">Date</TableHead>
                          <TableHead>Items</TableHead>
                          <TableHead className="text-right">Total Amount</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customer.purchaseHistory.map((sale) => (
                          <TableRow key={sale.id}>
                            <TableCell>{format(parseISO(sale.date), 'MMM dd, yyyy')}</TableCell>
                            <TableCell className="text-xs max-w-xs truncate">
                                {sale.items.map(item => `${item.productName} (Qty: ${item.quantity})`).join(', ')}
                            </TableCell>
                            <TableCell className="text-right font-medium">NRP {formatCurrency(sale.totalAmount)}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant={sale.status === 'Paid' ? 'default' : 'destructive'} className="text-xs">
                                {sale.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="outline" size="icon" onClick={() => setSaleToView(sale)} title="View Details" className="h-8 w-8">
                                  <Eye className="h-4 w-4" />
                                  <span className="sr-only">View Details</span>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <div className="text-xs text-muted-foreground mt-2 flex justify-between">
                       <span>First Purchase: {format(parseISO(customer.firstSeen), 'MMM dd, yyyy')}</span>
                       <span>Last Purchase: {format(parseISO(customer.lastSeen), 'MMM dd, yyyy')}</span>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No customer data found matching the current filters.
            </div>
          )}
        </CardContent>
      </Card>
    </div>

    {saleToView && (
      <SaleDetailsDialog
          isOpen={!!saleToView}
          onClose={() => setSaleToView(null)}
          sale={saleToView}
      />
    )}
    </>
  );
}
