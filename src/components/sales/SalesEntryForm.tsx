"use client";

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { PlusCircle, Trash2, ShoppingCart, DollarSign, Users } from 'lucide-react';
import type { Product, SaleItem } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { mockProducts as initialProducts } from '@/lib/data'; // Simulating data source

export default function SalesEntryForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [customerName, setCustomerName] = useState('');
  const [selectedItems, setSelectedItems] = useState<SaleItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Credit Card' | 'Debit Card' | 'Due'>('Cash');
  const [products, setProducts] = useState<Product[]>(initialProducts);

  const handleAddItem = () => {
    const firstAvailableProduct = products.find(p => p.stock > 0 && !selectedItems.find(si => si.productId === p.id));
    if (firstAvailableProduct) {
      setSelectedItems([
        ...selectedItems,
        {
          productId: firstAvailableProduct.id,
          productName: firstAvailableProduct.name,
          quantity: 1,
          unitPrice: firstAvailableProduct.price,
          totalPrice: firstAvailableProduct.price,
        },
      ]);
    } else {
      toast({ title: "No more products", description: "All available products have been added or are out of stock.", variant: "destructive" });
    }
  };

  const handleItemChange = (index: number, field: keyof SaleItem, value: string | number) => {
    const newItems = [...selectedItems];
    const item = newItems[index];
    const product = products.find(p => p.id === item.productId);

    if (field === 'productId') {
      const newProduct = products.find(p => p.id === value as string);
      if (newProduct) {
        item.productId = newProduct.id;
        item.productName = newProduct.name;
        item.unitPrice = newProduct.price;
      }
    } else if (field === 'quantity') {
      const quantity = Number(value);
      if (product && quantity > product.stock) {
        toast({ title: "Stock limit", description: `${product.name} has only ${product.stock} items in stock.`, variant: "destructive" });
        item.quantity = product.stock;
      } else {
        item.quantity = quantity > 0 ? quantity : 1;
      }
    }
    
    item.totalPrice = item.quantity * item.unitPrice;
    newItems[index] = item;
    setSelectedItems(newItems);
  };

  const handleRemoveItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const totalAmount = useMemo(() => {
    return selectedItems.reduce((sum, item) => sum + item.totalPrice, 0);
  }, [selectedItems]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      toast({ title: "Missing Information", description: "Please enter customer name.", variant: "destructive" });
      return;
    }
    if (selectedItems.length === 0) {
      toast({ title: "No Items", description: "Please add at least one product to the sale.", variant: "destructive" });
      return;
    }

    const newSale = {
      id: `sale-${Date.now()}`,
      customerName,
      items: selectedItems,
      totalAmount,
      paymentMethod,
      date: new Date().toISOString(),
      status: paymentMethod === 'Due' ? 'Due' : 'Paid',
      createdBy: user?.name || 'Unknown Staff',
    };

    // Simulate saving the sale and updating stock
    const updatedProducts = [...products];
    selectedItems.forEach(item => {
      const productIndex = updatedProducts.findIndex(p => p.id === item.productId);
      if (productIndex !== -1) {
        updatedProducts[productIndex].stock -= item.quantity;
      }
    });
    setProducts(updatedProducts); // Update local product stock state

    console.log('New Sale:', newSale); // In a real app, send to backend
    toast({ title: "Sale Recorded!", description: `Sale for ${customerName} totaling $${totalAmount.toFixed(2)} has been recorded.` });

    // Reset form
    setCustomerName('');
    setSelectedItems([]);
    setPaymentMethod('Cash');
  };

  const availableProductsForDropdown = products.filter(p => p.stock > 0);

  return (
    <Card className="w-full max-w-3xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl font-headline flex items-center gap-2"><ShoppingCart /> New Sale Entry</CardTitle>
        <CardDescription>Enter customer details and products for the new sale.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="customerName" className="text-base">Customer Name</Label>
            <Input
              id="customerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="E.g., John Doe"
              className="mt-1"
              required
            />
          </div>

          <div className="space-y-4">
            <Label className="text-base">Selected Items</Label>
            {selectedItems.map((item, index) => (
              <div key={index} className="flex items-end gap-3 p-3 border rounded-lg bg-card">
                <div className="flex-1 space-y-2">
                  <Label htmlFor={`product-${index}`}>Product</Label>
                  <Select
                    value={item.productId}
                    onValueChange={(value) => handleItemChange(index, 'productId', value)}
                  >
                    <SelectTrigger id={`product-${index}`}>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableProductsForDropdown.map((p) => (
                        <SelectItem key={p.id} value={p.id} disabled={selectedItems.some(si => si.productId === p.id && si.productId !== item.productId)}>
                          {p.name} (Stock: {p.stock}, Price: ${p.price.toFixed(2)})
                        </SelectItem>
                      ))}
                       {products.find(p=>p.id === item.productId) && !availableProductsForDropdown.find(p=>p.id === item.productId) && (
                         <SelectItem key={item.productId} value={item.productId}>
                          {item.productName} (Stock: {products.find(p=>p.id === item.productId)?.stock || 0}, Price: ${item.unitPrice.toFixed(2)})
                        </SelectItem>
                       )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-24 space-y-2">
                  <Label htmlFor={`quantity-${index}`}>Quantity</Label>
                  <Input
                    id={`quantity-${index}`}
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                    className="text-center"
                  />
                </div>
                <div className="text-right w-28 space-y-2">
                    <Label>Subtotal</Label>
                    <p className="font-semibold text-lg h-10 flex items-center justify-end">${item.totalPrice.toFixed(2)}</p>
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => handleRemoveItem(index)}
                  className="shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={handleAddItem} className="w-full">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Item
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            <div>
              <Label htmlFor="paymentMethod" className="text-base">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as any)}>
                <SelectTrigger id="paymentMethod" className="mt-1">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Credit Card">Credit Card</SelectItem>
                  <SelectItem value="Debit Card">Debit Card</SelectItem>
                  <SelectItem value="Due">Due Payment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-3xl font-bold font-headline">${totalAmount.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" size="lg" className="w-full text-lg py-3">
            <DollarSign className="mr-2 h-5 w-5" /> Record Sale
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
