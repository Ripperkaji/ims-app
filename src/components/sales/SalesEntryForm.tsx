
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PlusCircle, Trash2, ShoppingCart, Landmark, Phone, Info, Store, Globe } from 'lucide-react';
import type { Product, SaleItem, Sale, LogEntry } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { mockProducts as allGlobalProducts, mockSales, mockLogEntries } from '@/lib/data';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface SalesEntryFormProps {
  onSaleAdded?: (newSale: Sale) => void;
}

type PaymentMethodSelection = 'Cash' | 'Credit Card' | 'Debit Card' | 'Due' | 'Hybrid';

export default function SalesEntryForm({ onSaleAdded }: SalesEntryFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [saleOrigin, setSaleOrigin] = useState<'store' | 'online' | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerContact, setCustomerContact] = useState('');
  const [selectedItems, setSelectedItems] = useState<SaleItem[]>([]);
  
  const [formPaymentMethod, setFormPaymentMethod] = useState<PaymentMethodSelection>('Cash');
  const [isHybridPayment, setIsHybridPayment] = useState(false);
  const [hybridCashPaid, setHybridCashPaid] = useState('');
  const [hybridDigitalPaid, setHybridDigitalPaid] = useState('');
  const [hybridAmountLeftDue, setHybridAmountLeftDue] = useState('');

  const [validationError, setValidationError] = useState<string | null>(null);


  const totalAmount = useMemo(() => {
    try {
      if (!Array.isArray(selectedItems)) {
        console.error("SalesEntryForm: selectedItems is not an array in totalAmount calculation.");
        return 0;
      }
      return selectedItems.reduce((sum, item) => {
        if (item && typeof item.totalPrice === 'number' && !isNaN(item.totalPrice)) {
          return sum + item.totalPrice;
        }
        return sum;
      }, 0);
    } catch (e) {
      console.error("SalesEntryForm: Error calculating totalAmount:", e);
      return 0; 
    }
  }, [selectedItems]);

  useEffect(() => {
    if (formPaymentMethod === 'Hybrid') {
      setIsHybridPayment(true);
    } else {
      setIsHybridPayment(false);
      setHybridCashPaid('');
      setHybridDigitalPaid('');
      setHybridAmountLeftDue('');
    }
    setValidationError(null); 
  }, [formPaymentMethod]);

  useEffect(() => {
    if (!isHybridPayment) {
        if (validationError && validationError.startsWith("Hybrid payments")) {
             setValidationError(null);
        }
        return;
    }
    if (totalAmount === 0 && !hybridCashPaid && !hybridDigitalPaid && !hybridAmountLeftDue) {
        setValidationError(null);
        return;
    }

    const cash = parseFloat(hybridCashPaid) || 0;
    const digital = parseFloat(hybridDigitalPaid) || 0;
    const due = parseFloat(hybridAmountLeftDue) || 0;

    const filledFields = [hybridCashPaid, hybridDigitalPaid, hybridAmountLeftDue].filter(val => val !== '').length;

    if (filledFields === 2) {
      if (hybridCashPaid !== '' && hybridDigitalPaid !== '' && hybridAmountLeftDue === '') {
        const remainingForDue = totalAmount - cash - digital;
        if (parseFloat(hybridAmountLeftDue || "0") !== remainingForDue) { 
            setHybridAmountLeftDue(remainingForDue >= 0 ? remainingForDue.toFixed(2) : '0.00');
        }
      } else if (hybridCashPaid !== '' && hybridAmountLeftDue !== '' && hybridDigitalPaid === '') {
        const remainingForDigital = totalAmount - cash - due;
         if (parseFloat(hybridDigitalPaid || "0") !== remainingForDigital) {
            setHybridDigitalPaid(remainingForDigital >= 0 ? remainingForDigital.toFixed(2) : '0.00');
         }
      } else if (hybridDigitalPaid !== '' && hybridAmountLeftDue !== '' && hybridCashPaid === '') {
        const calculatedCash = totalAmount - digital - due;
        if (parseFloat(hybridCashPaid || "0") !== calculatedCash) {
            setHybridCashPaid(calculatedCash >= 0 ? calculatedCash.toFixed(2) : '0.00');
        }
      }
    }
    
    const currentCashForValidation = parseFloat(hybridCashPaid) || 0;
    const currentDigitalForValidation = parseFloat(hybridDigitalPaid) || 0;
    const currentDueForValidation = parseFloat(hybridAmountLeftDue) || 0;

    if (Math.abs(currentCashForValidation + currentDigitalForValidation + currentDueForValidation - totalAmount) > 0.001 && (currentCashForValidation + currentDigitalForValidation + currentDueForValidation > 0 || totalAmount > 0)) {
        setValidationError(`Hybrid payments (NRP ${(currentCashForValidation + currentDigitalForValidation + currentDueForValidation).toFixed(2)}) must sum up to Total Amount (NRP ${totalAmount.toFixed(2)}).`);
    } else {
        setValidationError(null);
    }

  }, [hybridCashPaid, hybridDigitalPaid, hybridAmountLeftDue, totalAmount, isHybridPayment, validationError]);


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
    const firstAvailableProduct = allGlobalProducts.find(
      p => p.stock > 0 && !selectedItems.find(si => si.productId === p.id)
    );

    if (firstAvailableProduct) {
      setSelectedItems([
        ...selectedItems,
        {
          productId: firstAvailableProduct.id,
          productName: firstAvailableProduct.name,
          quantity: 1,
          unitPrice: firstAvailableProduct.sellingPrice, // Use sellingPrice
          totalPrice: firstAvailableProduct.sellingPrice, // Use sellingPrice
        },
      ]);
    } else {
      toast({
        title: "No More Products",
        description: "All available products are either out of stock or already added to this sale.",
        variant: "destructive"
      });
    }
  };

  const handleItemChange = (index: number, field: keyof SaleItem, value: string | number) => {
    const newItems = [...selectedItems];
    const item = newItems[index];

    if (field === 'productId') {
      const newProduct = allGlobalProducts.find(p => p.id === value as string);
      if (newProduct) {
        item.productId = newProduct.id;
        item.productName = newProduct.name;
        item.unitPrice = newProduct.sellingPrice; // Use sellingPrice
        item.quantity = 1; 
        if (newProduct.stock < 1) {
            toast({ title: "Out of Stock", description: `${newProduct.name} is out of stock. Quantity set to 0.`, variant: "destructive" });
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
        item.quantity = quantity >= 0 ? quantity : 0; 
      }
    }
    
    item.totalPrice = item.quantity * item.unitPrice;
    newItems[index] = item;
    setSelectedItems(newItems);
  };

  const handleRemoveItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saleOrigin) {
      toast({ title: "Missing Information", description: "Please select a Sale Origin (Store Visit or Online).", variant: "destructive" });
      return;
    }
    if (!customerName.trim()) {
      toast({ title: "Missing Information", description: "Please enter customer name.", variant: "destructive" });
      return;
    }
    if (selectedItems.length === 0) {
      toast({ title: "No Items", description: "Please add at least one product to the sale.", variant: "destructive" });
      return;
    }
     if (selectedItems.some(item => item.quantity <= 0 || isNaN(item.quantity))) {
      toast({ title: "Invalid Quantity", description: "One or more items have zero or invalid quantity. Please remove or correct them.", variant: "destructive" });
      return;
    }
    if (totalAmount <= 0 && selectedItems.length > 0){
       toast({ title: "Invalid Sale Amount", description: "Total amount cannot be zero or less if items are selected.", variant: "destructive" });
      return;
    }


    let finalCashPaid = 0;
    let finalDigitalPaid = 0;
    let finalAmountDue = 0;

    if (isHybridPayment) {
      finalCashPaid = parseFloat(hybridCashPaid) || 0;
      finalDigitalPaid = parseFloat(hybridDigitalPaid) || 0;
      finalAmountDue = parseFloat(hybridAmountLeftDue) || 0;

      if (finalCashPaid < 0 || finalDigitalPaid < 0 || finalAmountDue < 0) {
        toast({ title: "Invalid Payment", description: "Payment amounts cannot be negative.", variant: "destructive" });
        return;
      }
      if (Math.abs(finalCashPaid + finalDigitalPaid + finalAmountDue - totalAmount) > 0.001) { 
        toast({ title: "Payment Mismatch", description: `Hybrid payments (NRP ${(finalCashPaid + finalDigitalPaid + finalAmountDue).toFixed(2)}) must sum up to Total Amount (NRP ${totalAmount.toFixed(2)}).`, variant: "destructive" });
        setValidationError(`Hybrid payments (NRP ${(finalCashPaid + finalDigitalPaid + finalAmountDue).toFixed(2)}) must sum up to Total Amount (NRP ${totalAmount.toFixed(2)}).`);
        return;
      }
    } else {
      switch (formPaymentMethod) {
        case 'Cash':
          finalCashPaid = totalAmount;
          break;
        case 'Credit Card':
        case 'Debit Card':
          finalDigitalPaid = totalAmount;
          break;
        case 'Due':
          finalAmountDue = totalAmount;
          break;
      }
    }
    
    const saleStatus = finalAmountDue > 0 ? 'Due' : 'Paid';

    const newSale: Sale = {
      id: `sale-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      customerName,
      customerContact: customerContact.trim() || undefined,
      items: selectedItems,
      totalAmount,
      cashPaid: finalCashPaid,
      digitalPaid: finalDigitalPaid,
      amountDue: finalAmountDue,
      formPaymentMethod: formPaymentMethod,
      date: new Date().toISOString(),
      status: saleStatus,
      createdBy: user?.name || 'Unknown',
      saleOrigin: saleOrigin,
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
    
    mockSales.unshift(newSale);
    mockSales.sort((a,b) => new Date(b.date).getTime() - new Date(a.timestamp).getTime());

    const contactInfoLog = newSale.customerContact ? ` (${newSale.customerContact})` : '';
    let paymentLogDetails = '';
    if (newSale.formPaymentMethod === 'Hybrid') {
        const parts = [];
        if (newSale.cashPaid > 0) parts.push(`NRP ${newSale.cashPaid.toFixed(2)} by cash`);
        if (newSale.digitalPaid > 0) parts.push(`NRP ${newSale.digitalPaid.toFixed(2)} by digital`);
        if (newSale.amountDue > 0) parts.push(`NRP ${newSale.amountDue.toFixed(2)} due`);
        paymentLogDetails = `Payment: ${parts.join(', ')}.`;
    } else {
        paymentLogDetails = `Payment: ${newSale.formPaymentMethod}.`;
    }
    const logDetails = `Sale ID ${newSale.id.substring(0,8)}... for ${newSale.customerName}${contactInfoLog}, Total: NRP ${newSale.totalAmount.toFixed(2)}. ${paymentLogDetails} Status: ${newSale.status}. Origin: ${newSale.saleOrigin}. Items: ${newSale.items.map(i => `${i.productName} (x${i.quantity})`).join(', ')}`;
    addLog("Sale Created", logDetails);

    toast({ title: "Sale Recorded!", description: `Sale for ${customerName} totaling NRP ${totalAmount.toFixed(2)} has been recorded.` });

    if (onSaleAdded) {
      onSaleAdded(newSale);
    }
    setSaleOrigin(null);
    setCustomerName('');
    setCustomerContact('');
    setSelectedItems([]);
    setFormPaymentMethod('Cash'); 
    setHybridCashPaid('');
    setHybridDigitalPaid('');
    setHybridAmountLeftDue('');
    setValidationError(null);
  };

  const availableProductsForDropdown = (currentItemId?: string) => 
    allGlobalProducts.filter(p => 
      p.stock > 0 || (currentItemId && p.id === currentItemId)
    ).sort((a, b) => a.name.localeCompare(b.name));


  return (
    <Card className="w-full max-w-3xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl font-headline flex items-center gap-2"><ShoppingCart /> New Sale Entry</CardTitle>
        <CardDescription>Enter customer details and products for the new sale.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label className="text-base font-medium">Sale Origin (Required)</Label>
            <RadioGroup
              value={saleOrigin ?? ""}
              onValueChange={(value) => setSaleOrigin(value as 'store' | 'online')}
              className="flex items-center space-x-6 pt-1"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="store" id="storeVisit" />
                <Label htmlFor="storeVisit" className="font-normal flex items-center gap-2 text-sm">
                  <Store className="h-4 w-4 text-primary" /> Store Visit
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="online" id="onlineSale" />
                <Label htmlFor="onlineSale" className="font-normal flex items-center gap-2 text-sm">
                  <Globe className="h-4 w-4 text-primary" /> Online
                </Label>
              </div>
            </RadioGroup>
            {!saleOrigin && (
                <p className="text-xs text-destructive pt-1">Please select a sale origin to continue.</p>
            )}
          </div>
          
          <fieldset disabled={!saleOrigin} className="space-y-6">
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
                          <SelectItem key={p.id} value={p.id} disabled={p.stock === 0 && p.id !== item.productId}>
                            {p.name} ({p.category}) - Stock: {p.stock}, Price: NRP {p.sellingPrice.toFixed(2)}
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
                      min="0" 
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <div>
                <Label htmlFor="paymentMethod" className="text-base">Payment Method</Label>
                <Select value={formPaymentMethod} onValueChange={(value) => setFormPaymentMethod(value as PaymentMethodSelection)}>
                  <SelectTrigger id="paymentMethod" className="mt-1">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Credit Card">Credit Card</SelectItem>
                    <SelectItem value="Debit Card">Debit Card</SelectItem>
                    <SelectItem value="Hybrid">Hybrid Payment</SelectItem>
                    <SelectItem value="Due">Full Amount Due</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Sale Amount</p>
                <p className="text-3xl font-bold font-headline">NRP {totalAmount.toFixed(2)}</p>
              </div>
            </div>

            {isHybridPayment && (
              <Card className="p-4 border-primary/50 bg-primary/5">
                <CardHeader className="p-2 pt-0">
                  <CardTitle className="text-lg font-semibold">Hybrid Payment Details</CardTitle>
                   <CardDescription>Enter amounts for each payment type. Sum must equal total sale amount.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 p-2">
                  <div>
                    <Label htmlFor="hybridCashPaid">Cash Paid (NRP)</Label>
                    <Input
                      id="hybridCashPaid"
                      type="number"
                      value={hybridCashPaid}
                      onChange={(e) => setHybridCashPaid(e.target.value)}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="hybridDigitalPaid">Digital Payment Paid (NRP)</Label>
                    <Input
                      id="hybridDigitalPaid"
                      type="number"
                      value={hybridDigitalPaid}
                      onChange={(e) => setHybridDigitalPaid(e.target.value)}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="hybridAmountLeftDue">Amount Left Due (NRP)</Label>
                    <Input
                      id="hybridAmountLeftDue"
                      type="number"
                      value={hybridAmountLeftDue}
                      onChange={(e) => setHybridAmountLeftDue(e.target.value)}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="mt-1"
                    />
                  </div>
                  {validationError && (
                      <Alert variant="destructive" className="mt-2">
                          <Info className="h-4 w-4" />
                          <AlertTitle>Payment Error</AlertTitle>
                          <AlertDescription>{validationError}</AlertDescription>
                      </Alert>
                  )}
                </CardContent>
              </Card>
            )}
          </fieldset>
        </CardContent>
        <CardFooter>
          <Button type="submit" size="lg" className="w-full text-lg py-3" disabled={!saleOrigin || (!!validationError && isHybridPayment)}>
            <Landmark className="mr-2 h-5 w-5" /> Record Sale
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

    