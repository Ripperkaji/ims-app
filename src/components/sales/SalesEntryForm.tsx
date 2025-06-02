
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { PlusCircle, Trash2, ShoppingCart, Landmark, Phone } from 'lucide-react';
import type { Product, SaleItem, Sale, LogEntry } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { mockProducts as allGlobalProducts, mockSales, mockLogEntries } from '@/lib/data';

interface SalesEntryFormProps {
  onSaleAdded?: (newSale: Sale) => void;
}

export default function SalesEntryForm({ onSaleAdded }: SalesEntryFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [customerName, setCustomerName] = useState('');
  const [customerContact, setCustomerContact] = useState('');
  const [selectedItems, setSelectedItems] = useState<SaleItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Credit Card' | 'Debit Card' | 'Due'>('Cash');
  const [formProductList, setFormProductList] = useState<Product[]>([...allGlobalProducts]);

  useEffect(() => {
    setFormProductList([...allGlobalProducts]);
  }, []);


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

  const handleAddItem = () => {
    const firstAvailableProduct = formProductList.find(p => p.stock > 0 && !selectedItems.find(si => si.productId === p.id));
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
    const productInFormList = formProductList.find(p => p.id === item.productId); 

    if (field === 'productId') {
      const newProduct = formProductList.find(p => p.id === value as string);
      if (newProduct) {
        item.productId = newProduct.id;
        item.productName = newProduct.name;
        item.unitPrice = newProduct.price;
        item.quantity = 1; 
        if (newProduct.stock < 1) {
            toast({ title: "Out of Stock", description: `${newProduct.name} is out of stock.`, variant: "destructive" });
            item.quantity = 0;
        }
      }
    } else if (field === 'quantity') {
      const quantity = Number(value);
      const stockToCheck = allGlobalProducts.find(p => p.id === item.productId)?.stock || 0;

      if (quantity > stockToCheck) {
        toast({ title: "Stock limit", description: `${item.productName} has only ${stockToCheck} items in stock.`, variant: "destructive" });
        item.quantity = stockToCheck;
      } else {
        item.quantity = quantity > 0 ? quantity : (stockToCheck > 0 ? 1 : 0);
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
    if (selectedItems.some(item => item.quantity === 0 || isNaN(item.quantity))) {
      toast({ title: "Invalid Quantity", description: "One or more items have zero or invalid quantity.", variant: "destructive" });
      return;
    }


    const newSale: Sale = {
      id: `sale-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      customerName,
      customerContact: customerContact.trim() || undefined,
      items: selectedItems,
      totalAmount,
      paymentMethod,
      date: new Date().toISOString(),
      status: paymentMethod === 'Due' ? 'Due' : 'Paid',
      createdBy: user?.name || 'Unknown',
    };

    const updatedGlobalProducts = [...allGlobalProducts];
    let successfulStockUpdate = true;
    selectedItems.forEach(item => {
      const productIndex = updatedGlobalProducts.findIndex(p => p.id === item.productId);
      if (productIndex !== -1) {
        if (updatedGlobalProducts[productIndex].stock >= item.quantity) {
          updatedGlobalProducts[productIndex].stock -= item.quantity;
        } else {
          toast({ title: "Stock Error", description: `Not enough stock for ${item.productName} during final processing.`, variant: "destructive" });
          successfulStockUpdate = false;
        }
      } else {
        toast({ title: "Product Error", description: `Product ${item.productName} not found during final processing.`, variant: "destructive" });
        successfulStockUpdate = false;
      }
    });

    if (!successfulStockUpdate) {
      return; 
    }
    
    allGlobalProducts.length = 0; 
    allGlobalProducts.push(...updatedGlobalProducts);
    
    setFormProductList([...allGlobalProducts]); 

    mockSales.unshift(newSale);
    mockSales.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const contactInfo = newSale.customerContact ? ` (${newSale.customerContact})` : '';
    const logDetails = `Sale ID ${newSale.id.substring(0,8)}... for ${newSale.customerName}${contactInfo}, Total: NRP ${newSale.totalAmount.toFixed(2)}. Status: ${newSale.status}. Items: ${newSale.items.map(i => `${i.productName} (x${i.quantity})`).join(', ')}`;
    addLog("Sale Created", logDetails);

    toast({ title: "Sale Recorded!", description: `Sale for ${customerName} totaling NRP ${totalAmount.toFixed(2)} has been recorded.` });

    if (onSaleAdded) {
      onSaleAdded(newSale);
    }

    setCustomerName('');
    setCustomerContact('');
    setSelectedItems([]);
    setPaymentMethod('Cash');
  };

  const availableProductsForDropdown = (currentItemId?: string) => 
    formProductList.filter(p => 
      p.stock > 0 || (currentItemId && p.id === currentItemId) || selectedItems.some(si => si.productId === p.id && p.id === currentItemId)
    );


  return (
    <Card className="w-full max-w-3xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl font-headline flex items-center gap-2"><ShoppingCart /> New Sale Entry</CardTitle>
        <CardDescription>Enter customer details and products for the new sale.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div>
              <Label htmlFor="customerContact" className="text-base">Contact Number (Optional)</Label>
              <div className="relative mt-1">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="customerContact"
                  type="tel"
                  value={customerContact}
                  onChange={(e) => setCustomerContact(e.target.value)}
                  placeholder="E.g., 98XXXXXXXX"
                  className="pl-10"
                />
              </div>
            </div>
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
                      {availableProductsForDropdown(item.productId).map((p) => (
                        <SelectItem key={p.id} value={p.id} disabled={selectedItems.some(si => si.productId === p.id && si.productId !== item.productId) && p.stock === 0}>
                          {p.name} (Stock: {allGlobalProducts.find(agp => agp.id === p.id)?.stock || 0}, Price: NRP {p.price.toFixed(2)})
                        </SelectItem>
                      ))}
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
                    <p className="font-semibold text-lg h-10 flex items-center justify-end">NRP {item.totalPrice.toFixed(2)}</p>
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
              <p className="text-3xl font-bold font-headline">NRP {totalAmount.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" size="lg" className="w-full text-lg py-3">
            <Landmark className="mr-2 h-5 w-5" /> Record Sale
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
