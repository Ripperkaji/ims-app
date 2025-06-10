
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PlusCircle, Trash2, ShoppingCart, Landmark, Phone, Info, Store, Globe } from 'lucide-react';
import type { Product, SaleItem, Sale, LogEntry, ProductType } from '@/types';
import { ALL_PRODUCT_TYPES } from '@/types'; // Import ALL_PRODUCT_TYPES
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';
import { mockProducts as allGlobalProducts, mockSales, mockLogEntries } from '@/lib/data';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface SalesEntryFormProps {
  onSaleAdded?: (newSale: Sale) => void;
}

type PaymentMethodSelection = 'Cash' | 'Digital' | 'Due' | 'Hybrid';

interface LocalSaleItemInForm {
  tempId: string;
  selectedCategory: ProductType | '';
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

// Helper function to calculate current stock for a product within this form
const calculateCurrentStockForSaleForm = (product: Product | undefined, allSales: Sale[]): number => {
  if (!product || !product.acquisitionHistory) return 0;
  const totalAcquired = product.acquisitionHistory.reduce((sum, batch) => sum + batch.quantityAdded, 0);

  const totalSold = allSales
    .flatMap(sale => sale.items)
    .filter(item => item.productId === product.id)
    .reduce((sum, item) => sum + item.quantity, 0);

  return totalAcquired - totalSold - (product.damagedQuantity || 0) - (product.testerQuantity || 0);
};


export default function SalesEntryForm({ onSaleAdded }: SalesEntryFormProps) {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [saleOrigin, setSaleOrigin] = useState<'store' | 'online' | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerContact, setCustomerContact] = useState('');
  const [selectedItems, setSelectedItems] = useState<LocalSaleItemInForm[]>([]);

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
    mockLogEntries.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.date).getTime());
  };

  const handleAddItem = () => {
    setSelectedItems([
      ...selectedItems,
      {
        tempId: `item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        selectedCategory: '',
        productId: '',
        productName: '',
        quantity: 0,
        unitPrice: 0,
        totalPrice: 0,
      },
    ]);
  };

  const handleItemCategoryChange = (index: number, category: ProductType | '') => {
    const newItems = [...selectedItems];
    newItems[index].selectedCategory = category;
    newItems[index].productId = '';
    newItems[index].productName = '';
    newItems[index].quantity = 0;
    newItems[index].unitPrice = 0;
    newItems[index].totalPrice = 0;
    setSelectedItems(newItems);
  };

  const handleItemProductChange = (index: number, productId: string) => {
    const newItems = [...selectedItems];
    const item = newItems[index];
    const product = allGlobalProducts.find(p => p.id === productId);

    if (product) {
      item.productId = product.id;
      item.productName = product.name;
      item.unitPrice = product.currentSellingPrice;
      item.quantity = 1;
      const currentStock = calculateCurrentStockForSaleForm(product, mockSales);
      if (currentStock < 1) {
        toast({ title: "Out of Stock", description: `${product.name} is out of stock. Quantity set to 0.`, variant: "destructive" });
        item.quantity = 0;
      }
      item.totalPrice = item.quantity * item.unitPrice;
      newItems[index] = item;
      setSelectedItems(newItems);
    }
  };

  const handleItemQuantityChange = (index: number, quantityStr: string) => {
    const newItems = [...selectedItems];
    const item = newItems[index];
    const quantity = parseInt(quantityStr, 10);

    if (isNaN(quantity) || quantity < 0) {
      item.quantity = 0;
    } else {
      const productDetails = allGlobalProducts.find(p => p.id === item.productId);
      const stockToCheck = calculateCurrentStockForSaleForm(productDetails, mockSales);
      if (quantity > stockToCheck) {
        toast({ title: "Stock limit", description: `${item.productName} has only ${stockToCheck} items in stock.`, variant: "destructive" });
        item.quantity = stockToCheck;
      } else {
        item.quantity = quantity;
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
     if (selectedItems.some(item => item.productId === '' || item.quantity <= 0 || isNaN(item.quantity))) {
      toast({ title: "Invalid Item", description: "One or more items are incomplete or have zero/invalid quantity. Please select a product and set a valid quantity.", variant: "destructive" });
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
        case 'Digital':
          finalDigitalPaid = totalAmount;
          break;
        case 'Due':
          finalAmountDue = totalAmount;
          break;
      }
    }

    const saleStatus = finalAmountDue > 0 ? 'Due' : 'Paid';

    const saleItemsToSave: SaleItem[] = selectedItems.map(item => ({
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
    }));

    const newSale: Sale = {
      id: `sale-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      customerName,
      customerContact: customerContact.trim() || undefined,
      items: saleItemsToSave,
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
    newSale.items.forEach(item => {
      const productIndex = updatedGlobalProducts.findIndex(p => p.id === item.productId);
      if (productIndex !== -1) {
        const currentStock = calculateCurrentStockForSaleForm(updatedGlobalProducts[productIndex], mockSales);
        if (currentStock >= item.quantity) {
          // This part is tricky with mock data.
          // For a real DB, you'd decrement. For mock, we assume the calculation was pre-validated.
          // The actual 'mockProducts' array is updated based on the fact that this sale will be added to mockSales.
        } else {
          toast({ title: "Stock Error", description: `Not enough stock for ${item.productName} during final processing. Available: ${currentStock}. Needed: ${item.quantity}`, variant: "destructive" });
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

    mockSales.unshift(newSale); // Add sale to mockSales *before* potentially re-calculating stock for other components

    // Re-calculate stock for allGlobalProducts AFTER the sale is recorded
    // This is more for other components that might re-render and use allGlobalProducts directly for stock display
    // Note: This direct mutation of allGlobalProducts is a mock data pattern.
    allGlobalProducts.forEach(p => {
      const saleProductIndex = updatedGlobalProducts.findIndex(up => up.id === p.id);
      if(saleProductIndex !== -1) {
        const itemSold = newSale.items.find(si => si.productId === p.id);
        // The actual stock reduction is implicit because calculateCurrentStockForSaleForm
        // will now include this newSale when it's called again.
      }
    });


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


  return (
    <Card className="w-full max-w-3xl mx-auto shadow-xl">
      <CardHeader className="p-4">
        <CardTitle className="text-xl font-headline flex items-center gap-2"><ShoppingCart /> New Sale Entry</CardTitle>
        <CardDescription className="text-sm">Enter customer details and products for the new sale.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4 p-4">
          <div className="space-y-1.5">
            <Label className="text-base font-medium">Sale Origin (Required)</Label>
            <RadioGroup
              value={saleOrigin ?? ""}
              onValueChange={(value) => setSaleOrigin(value as 'store' | 'online')}
              className="flex items-center space-x-4 pt-1"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="store" id="storeVisit" />
                <Label htmlFor="storeVisit" className="font-normal flex items-center gap-1.5 text-sm">
                  <Store className="h-4 w-4 text-primary" /> Store Visit
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="online" id="onlineSale" />
                <Label htmlFor="onlineSale" className="font-normal flex items-center gap-1.5 text-sm">
                  <Globe className="h-4 w-4 text-primary" /> Online
                </Label>
              </div>
            </RadioGroup>
            {!saleOrigin && (
                <p className="text-xs text-destructive pt-1">Please select a sale origin to continue.</p>
            )}
          </div>

          <fieldset disabled={!saleOrigin} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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

            <div className="space-y-3">
              <Label className="text-base">Selected Items</Label>
              {selectedItems.map((item, index) => (
                <div key={item.tempId} className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,2fr)_auto_auto_auto] items-end gap-2 p-2.5 border rounded-lg bg-card">

                  <div className="space-y-1">
                    <Label htmlFor={`category-${index}`} className="text-xs">Category</Label>
                    <Select
                      value={item.selectedCategory}
                      onValueChange={(value) => handleItemCategoryChange(index, value as ProductType | '')}
                    >
                      <SelectTrigger id={`category-${index}`} className="h-9 text-xs">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {ALL_PRODUCT_TYPES.map(type => (
                          <SelectItem key={type} value={type} className="text-xs">{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor={`product-${index}`} className="text-xs">Product</Label>
                    <Select
                      value={item.productId}
                      onValueChange={(value) => handleItemProductChange(index, value)}
                      disabled={!item.selectedCategory}
                    >
                      <SelectTrigger id={`product-${index}`} disabled={!item.selectedCategory} className="h-9 text-xs">
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {item.selectedCategory && allGlobalProducts
                          .filter(p => p.category === item.selectedCategory)
                          .map(p => {
                            const currentStock = calculateCurrentStockForSaleForm(p, mockSales);
                            const isCurrentItemSelected = item.productId && p.id === item.productId;
                            const isAlreadySelectedInOtherRows = selectedItems.some(
                              (otherItem, otherIndex) => otherIndex !== index && otherItem.productId === p.id
                            );
                            const isDisabled = (currentStock === 0 && !isCurrentItemSelected) || (!isCurrentItemSelected && isAlreadySelectedInOtherRows);

                            return (
                              <SelectItem key={p.id} value={p.id} disabled={isDisabled} className="text-xs">
                                {p.name} (Stock: {currentStock}, Price: NRP {p.currentSellingPrice.toFixed(2)})
                              </SelectItem>
                            );
                          })
                          .sort((a,b) => {
                            // Ensure product name is available for sorting if item is fully formed
                            const nameA = allGlobalProducts.find(p => p.id === a.props.value)?.name || '';
                            const nameB = allGlobalProducts.find(p => p.id === b.props.value)?.name || '';
                            return nameA.localeCompare(nameB);
                          })
                        }
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="w-20 space-y-1">
                    <Label htmlFor={`quantity-${index}`} className="text-xs">Quantity</Label>
                    <Input
                      id={`quantity-${index}`}
                      type="number"
                      min="0"
                      value={item.quantity}
                      onChange={(e) => handleItemQuantityChange(index, e.target.value)}
                      className="text-center h-9 text-xs"
                      disabled={!item.productId}
                    />
                  </div>

                  <div className="text-right w-24 space-y-1">
                      <Label className="text-xs">Subtotal</Label>
                      <p className="font-semibold text-base h-9 flex items-center justify-end">NRP {item.totalPrice.toFixed(2)}</p>
                  </div>

                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={() => handleRemoveItem(index)}
                    className="shrink-0 self-center h-8 w-8"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={handleAddItem} className="w-full h-9">
                <PlusCircle className="mr-2 h-4 w-4" /> Add Item
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              <div>
                <Label htmlFor="paymentMethod" className="text-base">Payment Method</Label>
                <Select value={formPaymentMethod} onValueChange={(value) => setFormPaymentMethod(value as PaymentMethodSelection)}>
                  <SelectTrigger id="paymentMethod" className="mt-1">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Digital">Digital Payment</SelectItem>
                    <SelectItem value="Hybrid">Hybrid Payment</SelectItem>
                    <SelectItem value="Due">Full Amount Due</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Total Sale Amount</p>
                <p className="text-2xl font-bold font-headline">NRP {totalAmount.toFixed(2)}</p>
              </div>
            </div>

            {isHybridPayment && (
              <Card className="p-3 border-primary/50 bg-primary/5">
                <CardHeader className="p-1.5 pt-0">
                  <CardTitle className="text-base font-semibold">Hybrid Payment Details</CardTitle>
                   <CardDescription className="text-xs">Amounts must sum to total sale amount.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 p-1.5">
                  <div>
                    <Label htmlFor="hybridCashPaid" className="text-xs">Cash Paid (NRP)</Label>
                    <Input
                      id="hybridCashPaid"
                      type="number"
                      value={hybridCashPaid}
                      onChange={(e) => setHybridCashPaid(e.target.value)}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="mt-0.5 h-9 text-xs"
                    />
                  </div>
                  <div>
                    <Label htmlFor="hybridDigitalPaid" className="text-xs">Digital Payment Paid (NRP)</Label>
                    <Input
                      id="hybridDigitalPaid"
                      type="number"
                      value={hybridDigitalPaid}
                      onChange={(e) => setHybridDigitalPaid(e.target.value)}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="mt-0.5 h-9 text-xs"
                    />
                  </div>
                  <div>
                    <Label htmlFor="hybridAmountLeftDue" className="text-xs">Amount Left Due (NRP)</Label>
                    <Input
                      id="hybridAmountLeftDue"
                      type="number"
                      value={hybridAmountLeftDue}
                      onChange={(e) => setHybridAmountLeftDue(e.target.value)}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="mt-0.5 h-9 text-xs"
                    />
                  </div>
                  {validationError && (
                      <Alert variant="destructive" className="mt-1.5 p-2.5">
                          <Info className="h-3.5 w-3.5" />
                          <AlertTitle className="text-xs">Payment Error</AlertTitle>
                          <AlertDescription className="text-xs">{validationError}</AlertDescription>
                      </Alert>
                  )}
                </CardContent>
              </Card>
            )}
          </fieldset>
        </CardContent>
        <CardFooter className="p-4">
          <Button type="submit" size="lg" className="w-full text-base py-2.5" disabled={!saleOrigin || (!!validationError && isHybridPayment)}>
            <Landmark className="mr-2 h-4 w-4" /> Record Sale
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
