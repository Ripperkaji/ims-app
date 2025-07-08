
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { PlusCircle, Trash2, ShoppingCart, Landmark, Phone, Info, Store, Globe, CalendarDays } from 'lucide-react';
import type { Product, SaleItem, Sale, LogEntry, ProductType } from '@/types';
import { ALL_PRODUCT_TYPES } from '@/types';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';
import { mockProducts as allGlobalProducts, mockSales, mockLogEntries } from '@/lib/data';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';

interface SalesEntryFormProps {
  onSaleAdded?: (newSale: Sale) => void;
}

type PaymentMethodSelection = 'Cash' | 'Digital' | 'Due' | 'Hybrid';

interface LocalSaleItemInForm {
  tempId: string;
  selectedCategory: ProductType | '';
  selectedCompanyName: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

const calculateCurrentStockForSaleForm = (product: Product | undefined, allSales: Sale[]): number => {
  if (!product || !product.acquisitionHistory) return 0;
  const totalAcquired = product.acquisitionHistory.reduce((sum, batch) => {
    // Ensure quantityAdded is a number, default to 0 if not
    const quantity = typeof batch.quantityAdded === 'number' ? batch.quantityAdded : 0;
    return sum + quantity;
  }, 0);
  
  const totalSold = allSales
    .flatMap(sale => sale.items || []) // Ensure sale.items exists
    .filter(item => item && item.productId === product.id) // Ensure item exists
    .reduce((sum, item) => {
      // Ensure item.quantity is a number, default to 0 if not
      const quantity = typeof item.quantity === 'number' ? item.quantity : 0;
      return sum + quantity;
    }, 0);
    
  const damaged = typeof product.damagedQuantity === 'number' ? product.damagedQuantity : 0;
  const testers = typeof product.testerQuantity === 'number' ? product.testerQuantity : 0;
    
  return totalAcquired - totalSold - damaged - testers;
};

export default function SalesEntryForm({ onSaleAdded }: SalesEntryFormProps) {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [saleOrigin, setSaleOrigin] = useState<'store' | 'online' | null>(null);
  const [saleDate, setSaleDate] = useState<Date | undefined>(new Date());
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
    const total = selectedItems.reduce((sum, item) => sum + item.totalPrice, 0);
    return Math.round(total * 100) / 100;
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
            setHybridAmountLeftDue(remainingForDue >= 0 ? formatCurrency(remainingForDue) : '0.00');
        }
      } else if (hybridCashPaid !== '' && hybridAmountLeftDue !== '' && hybridDigitalPaid === '') {
        const remainingForDigital = totalAmount - cash - due;
         if (parseFloat(hybridDigitalPaid || "0") !== remainingForDigital) {
            setHybridDigitalPaid(remainingForDigital >= 0 ? formatCurrency(remainingForDigital) : '0.00');
         }
      } else if (hybridDigitalPaid !== '' && hybridAmountLeftDue !== '' && hybridCashPaid === '') {
        const calculatedCash = totalAmount - digital - due;
        if (parseFloat(hybridCashPaid || "0") !== calculatedCash) {
            setHybridCashPaid(calculatedCash >= 0 ? formatCurrency(calculatedCash) : '0.00');
        }
      }
    }
    const currentCashForValidation = parseFloat(hybridCashPaid) || 0;
    const currentDigitalForValidation = parseFloat(hybridDigitalPaid) || 0;
    const currentDueForValidation = parseFloat(hybridAmountLeftDue) || 0;
    if (Math.abs(currentCashForValidation + currentDigitalForValidation + currentDueForValidation - totalAmount) > 0.001 && (currentCashForValidation + currentDigitalForValidation + currentDueForValidation > 0 || totalAmount > 0)) {
        setValidationError(`Hybrid payments (NRP ${formatCurrency(currentCashForValidation + currentDigitalForValidation + currentDueForValidation)}) must sum up to Total Amount (NRP ${formatCurrency(totalAmount)}).`);
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
    mockLogEntries.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const handleAddItem = () => {
    setSelectedItems([
      ...selectedItems,
      {
        tempId: `item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        selectedCategory: '',
        selectedCompanyName: '',
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
    newItems[index] = {
        ...newItems[index],
        selectedCategory: category,
        selectedCompanyName: '',
        productId: '',
        productName: '',
        quantity: 0,
        unitPrice: 0,
        totalPrice: 0,
    };
    setSelectedItems(newItems);
  };

  const handleItemCompanyChange = (index: number, companyName: string) => {
    const newItems = [...selectedItems];
    newItems[index] = {
        ...newItems[index],
        selectedCompanyName: companyName,
        productId: '',
        productName: '',
        quantity: 0,
        unitPrice: 0,
        totalPrice: 0,
    };
    setSelectedItems(newItems);
  };


  const handleItemProductChange = (index: number, productId: string) => {
    const newItems = [...selectedItems];
    const item = newItems[index];
    const product = allGlobalProducts.find(p => p.id === productId);
    if (product) {
      item.productId = product.id;
      item.productName = `${product.name}${product.modelName ? ` (${product.modelName})` : ''}${product.flavorName ? ` - ${product.flavorName}` : ''}`.trim();
      item.unitPrice = product.currentSellingPrice;
      item.quantity = 1;
      const currentStock = calculateCurrentStockForSaleForm(product, mockSales);
      if (currentStock < 1) {
        toast({ title: "Out of Stock", description: `${item.productName} is out of stock. Quantity set to 0.`, variant: "destructive" });
        item.quantity = 0;
      }
      item.totalPrice = Math.round(item.quantity * item.unitPrice * 100) / 100;
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
    item.totalPrice = Math.round(item.quantity * item.unitPrice * 100) / 100;
    newItems[index] = item;
    setSelectedItems(newItems);
  };

  const handleRemoveItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saleOrigin) { toast({ title: "Missing Information", description: "Please select a Sale Origin (Store Visit or Online).", variant: "destructive" }); return; }
    if (!saleDate) { toast({ title: "Missing Information", description: "Please select a sale date.", variant: "destructive" }); return; }
    if (!customerName.trim()) { toast({ title: "Missing Information", description: "Please enter customer name.", variant: "destructive" }); return; }
    if (selectedItems.length === 0) { toast({ title: "No Items", description: "Please add at least one product to the sale.", variant: "destructive" }); return; }
    if (selectedItems.some(item => item.productId === '' || item.quantity <= 0 || isNaN(item.quantity))) { toast({ title: "Invalid Item", description: "One or more items are incomplete or have zero/invalid quantity.", variant: "destructive" }); return; }
    if (totalAmount <= 0 && selectedItems.length > 0){ toast({ title: "Invalid Sale Amount", description: "Total amount cannot be zero or less if items are selected.", variant: "destructive" }); return; }
    let finalCashPaid = 0, finalDigitalPaid = 0, finalAmountDue = 0;
    if (isHybridPayment) {
      finalCashPaid = parseFloat(hybridCashPaid) || 0;
      finalDigitalPaid = parseFloat(hybridDigitalPaid) || 0;
      finalAmountDue = parseFloat(hybridAmountLeftDue) || 0;
      if (finalCashPaid < 0 || finalDigitalPaid < 0 || finalAmountDue < 0) { toast({ title: "Invalid Payment", description: "Payment amounts cannot be negative.", variant: "destructive" }); return; }
      if (Math.abs(finalCashPaid + finalDigitalPaid + finalAmountDue - totalAmount) > 0.001) { toast({ title: "Payment Mismatch", description: `Hybrid payments (NRP ${formatCurrency(finalCashPaid + finalDigitalPaid + finalAmountDue)}) must sum up to Total Amount (NRP ${formatCurrency(totalAmount)}).`, variant: "destructive" }); setValidationError(`Hybrid payments (NRP ${formatCurrency(finalCashPaid + finalDigitalPaid + finalAmountDue)}) must sum up to Total Amount (NRP ${formatCurrency(totalAmount)}).`); return; }
    } else {
      switch (formPaymentMethod) {
        case 'Cash': finalCashPaid = totalAmount; break;
        case 'Digital': finalDigitalPaid = totalAmount; break;
        case 'Due': finalAmountDue = totalAmount; break;
      }
    }
    const saleStatus = finalAmountDue > 0 ? 'Due' : 'Paid';
    const saleItemsToSave: SaleItem[] = selectedItems.map(item => ({ productId: item.productId, productName: item.productName, quantity: item.quantity, unitPrice: item.unitPrice, totalPrice: item.totalPrice, }));
    
    const maxId = mockSales.reduce((max, sale) => {
        const idNum = parseInt(sale.id, 10);
        return !isNaN(idNum) && idNum > max ? idNum : max;
    }, 0);
    const newSaleId = String(maxId + 1).padStart(4, '0');

    const newSale: Sale = { id: newSaleId, customerName, customerContact: customerContact.trim() || undefined, items: saleItemsToSave, totalAmount, cashPaid: finalCashPaid, digitalPaid: finalDigitalPaid, amountDue: finalAmountDue, formPaymentMethod: formPaymentMethod, date: saleDate.toISOString(), status: saleStatus, createdBy: user?.name || 'Unknown', saleOrigin: saleOrigin, isFlagged: false, flaggedComment: '' };
    mockSales.unshift(newSale);
    const contactInfoLog = newSale.customerContact ? ` (${newSale.customerContact})` : '';
    let paymentLogDetails = '';
    if (newSale.formPaymentMethod === 'Hybrid') { const parts = []; if (newSale.cashPaid > 0) parts.push(`NRP ${formatCurrency(newSale.cashPaid)} by cash`); if (newSale.digitalPaid > 0) parts.push(`NRP ${formatCurrency(newSale.digitalPaid)} by digital`); if (newSale.amountDue > 0) parts.push(`NRP ${formatCurrency(newSale.amountDue)} due`); paymentLogDetails = `Payment: ${parts.join(', ')}.`; }
    else { paymentLogDetails = `Payment: ${newSale.formPaymentMethod}.`; }
    const logDetails = `Sale ID ${newSale.id} for ${newSale.customerName}${contactInfoLog}, Total: NRP ${formatCurrency(newSale.totalAmount)}. ${paymentLogDetails} Status: ${newSale.status}. Origin: ${newSale.saleOrigin}. Items: ${newSale.items.map(i => `${i.productName} (x${i.quantity})`).join(', ')}`;
    addLog("Sale Created", logDetails);
    toast({ title: "Sale Recorded!", description: `Sale for ${customerName} totaling NRP ${formatCurrency(totalAmount)} has been recorded.` });
    if (onSaleAdded) { onSaleAdded(newSale); }
    setSaleOrigin(null); setSaleDate(new Date()); setCustomerName(''); setCustomerContact(''); setSelectedItems([]); setFormPaymentMethod('Cash'); setHybridCashPaid(''); setHybridDigitalPaid(''); setHybridAmountLeftDue(''); setValidationError(null);
  };

  return (
    <Card className="w-full shadow-xl">
      <CardHeader className="p-4">
        <CardTitle className="text-xl font-headline flex items-center gap-2"><ShoppingCart /> New Sale Entry</CardTitle>
        <CardDescription className="text-sm">Enter customer details and products for the new sale.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4 p-4">
          <div className="space-y-1.5">
            <Label className="text-base font-medium">Sale Origin (Required)</Label>
            <RadioGroup value={saleOrigin ?? ""} onValueChange={(value) => setSaleOrigin(value as 'store' | 'online')} className="flex items-center space-x-4 pt-1">
              <div className="flex items-center space-x-2"> <RadioGroupItem value="store" id="storeVisit" /> <Label htmlFor="storeVisit" className="font-normal flex items-center gap-1.5 text-sm"> <Store className="h-4 w-4 text-primary" /> Store Visit </Label> </div>
              <div className="flex items-center space-x-2"> <RadioGroupItem value="online" id="onlineSale" /> <Label htmlFor="onlineSale" className="font-normal flex items-center gap-1.5 text-sm"> <Globe className="h-4 w-4 text-primary" /> Online </Label> </div>
            </RadioGroup>
            {!saleOrigin && (<p className="text-xs text-destructive pt-1">Please select a sale origin to continue.</p>)}
          </div>

          <fieldset disabled={!saleOrigin} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
               <div className="md:col-span-1">
                  <Label htmlFor="saleDate" className="text-base">Sale Date</Label>
                  <Popover>
                      <PopoverTrigger asChild>
                          <Button
                          variant={"outline"}
                          className="w-full justify-start text-left font-normal mt-1 h-9"
                          >
                          <CalendarDays className="mr-2 h-4 w-4" />
                          {saleDate ? format(saleDate, "PPP") : <span>Pick a date</span>}
                          </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                          <Calendar mode="single" selected={saleDate} onSelect={setSaleDate} initialFocus />
                      </PopoverContent>
                  </Popover>
              </div>
              <div className="md:col-span-1"> 
                <Label htmlFor="customerName" className="text-base">Customer Name</Label> 
                <Input id="customerName" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="E.g., John Doe" className="mt-1" required /> 
              </div>
              <div className="md:col-span-1"> 
                <Label htmlFor="customerContact" className="text-base">Contact Number (Optional)</Label> 
                <div className="relative mt-1"> <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /> <Input id="customerContact" type="tel" value={customerContact} onChange={(e) => setCustomerContact(e.target.value)} placeholder="E.g., 98XXXXXXXX" className="pl-10" /> </div> 
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-base">Selected Items</Label>
              {selectedItems.map((item, index) => {
                const availableCompanies = Array.from(new Set(allGlobalProducts.filter(p => p.category === item.selectedCategory).map(p => p.name))).sort();
                const availableVariants = allGlobalProducts.filter(p => p.category === item.selectedCategory && p.name === item.selectedCompanyName);

                return (
                  <div key={item.tempId} className="grid grid-cols-[1fr_1fr_1.5fr_auto_auto_auto] items-end gap-2 p-2.5 border rounded-lg bg-card">
                    <div className="space-y-1"> <Label htmlFor={`category-${index}`} className="text-xs">Category</Label> <Select value={item.selectedCategory} onValueChange={(value) => handleItemCategoryChange(index, value as ProductType | '')}> <SelectTrigger id={`category-${index}`} className="h-9 text-xs"> <SelectValue placeholder="Select" /> </SelectTrigger> <SelectContent> {ALL_PRODUCT_TYPES.map(type => (<SelectItem key={type} value={type} className="text-xs">{type}</SelectItem>))} </SelectContent> </Select> </div>
                    <div className="space-y-1"> <Label htmlFor={`company-${index}`} className="text-xs">Company</Label> <Select value={item.selectedCompanyName} onValueChange={(value) => handleItemCompanyChange(index, value)} disabled={!item.selectedCategory}> <SelectTrigger id={`company-${index}`} className="h-9 text-xs"> <SelectValue placeholder="Select" /> </SelectTrigger> <SelectContent> {availableCompanies.length > 0 ? availableCompanies.map(c => (<SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)) : (<SelectItem value="no-companies" disabled>No companies</SelectItem>)} </SelectContent> </Select> </div>
                    <div className="space-y-1">
                      <Label htmlFor={`variant-${index}`} className="text-xs">Variant/Type</Label>
                      <Select value={item.productId} onValueChange={(value) => handleItemProductChange(index, value)} disabled={!item.selectedCompanyName}>
                        <SelectTrigger id={`variant-${index}`} className="h-9 text-xs"> <SelectValue placeholder="Select" /> </SelectTrigger>
                        <SelectContent>
                          {availableVariants.length > 0 ? (
                            availableVariants.map(p => {
                              const currentStock = calculateCurrentStockForSaleForm(p, mockSales);
                              const isSelected = item.productId === p.id || selectedItems.some((si, siIndex) => si.productId === p.id && siIndex !== index);
                              return (
                                <SelectItem key={p.id} value={p.id} disabled={currentStock <= 0 && !isSelected}>
                                  <div className="flex w-full items-center justify-between">
                                    <span className="truncate">
                                      {p.modelName ? (
                                        <>
                                          <span className="font-bold text-base">{p.modelName}</span>
                                          {p.flavorName && <span className="text-muted-foreground"> - {p.flavorName}</span>}
                                        </>
                                      ) : (
                                        <span className="font-semibold">{p.flavorName || 'Base'}</span>
                                      )}
                                    </span>
                                    <span className="font-semibold text-muted-foreground pl-2">Stock: {currentStock}</span>
                                  </div>
                                </SelectItem>
                              );
                            })
                          ) : (
                            <SelectItem value="no-variants" disabled>No variants</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-20 space-y-1"> <Label htmlFor={`quantity-${index}`} className="text-xs">Quantity</Label> <Input id={`quantity-${index}`} type="number" min="0" value={item.quantity} onChange={(e) => handleItemQuantityChange(index, e.target.value)} className="text-center h-9 text-xs" disabled={!item.productId} /> </div>
                    <div className="text-right w-24 space-y-1"> <Label className="text-xs">Subtotal</Label> <p className="font-semibold text-base h-9 flex items-center justify-end">NRP {formatCurrency(item.totalPrice)}</p> </div>
                    <Button type="button" variant="destructive" size="icon" onClick={() => handleRemoveItem(index)} className="shrink-0 self-center h-8 w-8"> <Trash2 className="h-3.5 w-3.5" /> </Button>
                  </div>
                );
              })}
              <Button type="button" variant="outline" onClick={handleAddItem} className="w-full h-9"> <PlusCircle className="mr-2 h-4 w-4" /> Add Item </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start pt-2">
              <div> <Label htmlFor="paymentMethod" className="text-base">Payment Method</Label> <Select value={formPaymentMethod} onValueChange={(value) => setFormPaymentMethod(value as PaymentMethodSelection)}> <SelectTrigger id="paymentMethod" className="mt-1"> <SelectValue placeholder="Select payment method" /> </SelectTrigger> <SelectContent> <SelectItem value="Cash">Cash</SelectItem> <SelectItem value="Digital">Digital Payment</SelectItem> <SelectItem value="Hybrid">Hybrid Payment</SelectItem> <SelectItem value="Due">Full Amount Due</SelectItem> </SelectContent> </Select> </div>
              <div className="text-right"> <p className="text-xs text-muted-foreground">Total Sale Amount</p> <p className="text-2xl font-bold font-headline">NRP {formatCurrency(totalAmount)}</p> </div>
            </div>

            {isHybridPayment && (
              <Card className="p-3 border-primary/50 bg-primary/5">
                <CardHeader className="p-1.5 pt-0"> <CardTitle className="text-base font-semibold">Hybrid Payment Details</CardTitle> <CardDescription className="text-sm">Amounts must sum to total sale amount.</CardDescription> </CardHeader>
                <CardContent className="space-y-2 p-1.5">
                  <div> <Label htmlFor="hybridCashPaid" className="text-xs">Cash Paid (NRP)</Label> <Input id="hybridCashPaid" type="number" value={hybridCashPaid} onChange={(e) => setHybridCashPaid(e.target.value)} placeholder="0.00" min="0" step="0.01" className="mt-0.5 h-9 text-xs" /> </div>
                  <div> <Label htmlFor="hybridDigitalPaid" className="text-xs">Digital Payment Paid (NRP)</Label> <Input id="hybridDigitalPaid" type="number" value={hybridDigitalPaid} onChange={(e) => setHybridDigitalPaid(e.target.value)} placeholder="0.00" min="0" step="0.01" className="mt-0.5 h-9 text-xs" /> </div>
                  <div> <Label htmlFor="hybridAmountLeftDue" className="text-xs">Amount Left Due (NRP)</Label> <Input id="hybridAmountLeftDue" type="number" value={hybridAmountLeftDue} onChange={(e) => setHybridAmountLeftDue(e.target.value)} placeholder="0.00" min="0" step="0.01" className="mt-0.5 h-9 text-xs" /> </div>
                  {validationError && (<Alert variant="destructive" className="mt-1.5 p-2.5"> <Info className="h-3.5 w-3.5" /> <AlertTitle className="text-xs">Payment Error</AlertTitle> <AlertDescription className="text-xs">{validationError}</AlertDescription> </Alert>)}
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
