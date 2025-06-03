
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle as DialogCardTitle, CardDescription as DialogCardDescription } from '@/components/ui/card'; 
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { Sale, SaleItem, Product } from '@/types';
import { ShieldCheck, PlusCircle, Trash2, Info, Landmark, Edit3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type PaymentMethodSelection = 'Cash' | 'Credit Card' | 'Debit Card' | 'Due' | 'Hybrid';

interface ResolveFlagDialogProps {
  sale: Sale;
  isOpen: boolean;
  onClose: () => void;
  onFlagResolved: (
    originalSaleId: string, 
    updatedSaleData: Partial<Sale> & { 
        customerName: string;
        customerContact?: string;
        items: SaleItem[];
        totalAmount: number;
        formPaymentMethod: PaymentMethodSelection;
        cashPaid: number;
        digitalPaid: number;
        amountDue: number;
    }, 
    resolutionComment: string
  ) => void;
  allGlobalProducts: Product[]; 
}


export default function ResolveFlagDialog({ sale, isOpen, onClose, onFlagResolved, allGlobalProducts }: ResolveFlagDialogProps) {
  const { toast } = useToast();

  const [editedCustomerName, setEditedCustomerName] = useState(sale.customerName);
  const [editedCustomerContact, setEditedCustomerContact] = useState(sale.customerContact || '');
  const [editedItems, setEditedItems] = useState<SaleItem[]>(() => JSON.parse(JSON.stringify(sale.items))); 

  const [editedFormPaymentMethod, setEditedFormPaymentMethod] = useState<PaymentMethodSelection>(sale.formPaymentMethod);
  const [isHybridPayment, setIsHybridPayment] = useState(sale.formPaymentMethod === 'Hybrid');
  const [hybridCashPaid, setHybridCashPaid] = useState(sale.cashPaid.toString());
  const [hybridDigitalPaid, setHybridDigitalPaid] = useState(sale.digitalPaid.toString());
  const [hybridAmountLeftDue, setHybridAmountLeftDue] = useState(sale.amountDue.toString());
  
  const [resolutionComment, setResolutionComment] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const currentTotalAmount = useMemo(() => {
    return editedItems.reduce((sum, item) => sum + item.totalPrice, 0);
  }, [editedItems]);

  useEffect(() => {
    if (isOpen) {
      setEditedCustomerName(sale.customerName);
      setEditedCustomerContact(sale.customerContact || '');
      setEditedItems(JSON.parse(JSON.stringify(sale.items))); 
      setEditedFormPaymentMethod(sale.formPaymentMethod);
      setIsHybridPayment(sale.formPaymentMethod === 'Hybrid');
      setHybridCashPaid(sale.cashPaid > 0 ? sale.cashPaid.toFixed(2) : '');
      setHybridDigitalPaid(sale.digitalPaid > 0 ? sale.digitalPaid.toFixed(2) : '');
      setHybridAmountLeftDue(sale.amountDue > 0 ? sale.amountDue.toFixed(2) : '');
      setResolutionComment('');
      setValidationError(null);
    }
  }, [sale, isOpen]);

 useEffect(() => {
    if (editedFormPaymentMethod === 'Hybrid') {
      setIsHybridPayment(true);
    } else {
      setIsHybridPayment(false);
    }
    setValidationError(null);
  }, [editedFormPaymentMethod]);

  useEffect(() => {
    if (!isHybridPayment) {
      if (validationError && validationError.startsWith("Hybrid payments")) {
           setValidationError(null);
      }
      return;
    }
    if (currentTotalAmount === 0 && !hybridCashPaid && !hybridDigitalPaid && !hybridAmountLeftDue) {
        setValidationError(null);
        return;
    }

    const cash = parseFloat(hybridCashPaid) || 0;
    const digital = parseFloat(hybridDigitalPaid) || 0;
    const due = parseFloat(hybridAmountLeftDue) || 0;
    const filledFields = [hybridCashPaid, hybridDigitalPaid, hybridAmountLeftDue].filter(val => val && val !== '').length;

    if (filledFields === 2 && currentTotalAmount > 0) {
      if (hybridCashPaid !== '' && hybridDigitalPaid !== '' && hybridAmountLeftDue === '') {
        const remainingForDue = currentTotalAmount - cash - digital;
         if (parseFloat(hybridAmountLeftDue || "0").toFixed(2) !== remainingForDue.toFixed(2)) {
            setHybridAmountLeftDue(remainingForDue >= 0 ? remainingForDue.toFixed(2) : '0.00');
         }
      } else if (hybridCashPaid !== '' && hybridAmountLeftDue !== '' && hybridDigitalPaid === '') {
        const remainingForDigital = currentTotalAmount - cash - due;
         if (parseFloat(hybridDigitalPaid || "0").toFixed(2) !== remainingForDigital.toFixed(2)) {
            setHybridDigitalPaid(remainingForDigital >= 0 ? remainingForDigital.toFixed(2) : '0.00');
         }
      } else if (hybridDigitalPaid !== '' && hybridAmountLeftDue !== '' && hybridCashPaid === '') {
        const calculatedCash = currentTotalAmount - digital - due;
        if (parseFloat(hybridCashPaid || "0").toFixed(2) !== calculatedCash.toFixed(2)) {
            setHybridCashPaid(calculatedCash >= 0 ? calculatedCash.toFixed(2) : '0.00');
        }
      }
    }
    
    const currentCashForValidation = parseFloat(hybridCashPaid) || 0;
    const currentDigitalForValidation = parseFloat(hybridDigitalPaid) || 0;
    const currentDueForValidation = parseFloat(hybridAmountLeftDue) || 0;
    const sumOfPayments = currentCashForValidation + currentDigitalForValidation + currentDueForValidation;

    if (Math.abs(sumOfPayments - currentTotalAmount) > 0.001 && (sumOfPayments > 0 || currentTotalAmount > 0)) {
        setValidationError(`Hybrid payments (NRP ${sumOfPayments.toFixed(2)}) must sum up to Total Amount (NRP ${currentTotalAmount.toFixed(2)}).`);
    } else {
        setValidationError(null);
    }

  }, [hybridCashPaid, hybridDigitalPaid, hybridAmountLeftDue, currentTotalAmount, isHybridPayment, validationError]);


  const handleAddItem = () => {
    const firstAvailableProduct = allGlobalProducts.find(p => p.stock > 0 && !editedItems.find(si => si.productId === p.id));
    if (firstAvailableProduct) {
      setEditedItems([
        ...editedItems,
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
    const newItems = [...editedItems];
    const item = newItems[index];

    if (field === 'productId') {
      const newProduct = allGlobalProducts.find(p => p.id === value as string);
      if (newProduct) {
        item.productId = newProduct.id;
        item.productName = newProduct.name;
        item.unitPrice = newProduct.price;
        item.quantity = 1; 
        if (newProduct.stock < 1) {
            toast({ title: "Out of Stock", description: `${newProduct.name} is out of stock. Quantity set to 0.`, variant: "destructive" });
            item.quantity = 0;
        }
      }
    } else if (field === 'quantity') {
      const quantity = Number(value);
      const productDetails = allGlobalProducts.find(p => p.id === item.productId);
      const stockToCheck = productDetails?.stock || 0;
      
      // For adjustments, we consider stock *plus* what was originally in the sale
      const originalItem = sale.items.find(i => i.productId === item.productId);
      const quantityAlreadyInSale = originalItem ? originalItem.quantity : 0;

      if (quantity > (stockToCheck + quantityAlreadyInSale)) { 
        toast({ title: "Stock limit", description: `${item.productName} has only ${stockToCheck + quantityAlreadyInSale} items available for this adjustment.`, variant: "destructive" });
        item.quantity = stockToCheck + quantityAlreadyInSale;
      } else {
        item.quantity = quantity >= 0 ? quantity : 0; 
      }
    }
    
    item.totalPrice = item.quantity * item.unitPrice;
    newItems[index] = item;
    setEditedItems(newItems);
  };

  const handleRemoveItem = (index: number) => {
    setEditedItems(editedItems.filter((_, i) => i !== index));
  };

  const handleConfirmResolution = () => {
    if (!resolutionComment.trim()) {
      toast({ title: "Resolution Comment Required", description: "Please provide a comment explaining the resolution.", variant: "destructive"});
      return;
    }
    if (!editedCustomerName.trim()) {
      toast({ title: "Customer Name Required", description: "Customer name cannot be empty.", variant: "destructive"});
      return;
    }
    if (editedItems.length === 0) {
      toast({ title: "No Items", description: "Please add at least one product.", variant: "destructive" });
      return;
    }
    if (editedItems.some(item => item.quantity <= 0 || isNaN(item.quantity))) {
      toast({ title: "Invalid Quantity", description: "One or more items have zero or invalid quantity.", variant: "destructive" });
      return;
    }
    if (currentTotalAmount <= 0 && editedItems.length > 0){
       toast({ title: "Invalid Sale Amount", description: "Total amount must be positive if items are selected.", variant: "destructive" });
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
      if (Math.abs(finalCashPaid + finalDigitalPaid + finalAmountDue - currentTotalAmount) > 0.001) {
        setValidationError(`Hybrid payments must sum to Total Amount (NRP ${currentTotalAmount.toFixed(2)}).`);
        toast({ title: "Payment Mismatch", description: `Hybrid payments (NRP ${(finalCashPaid + finalDigitalPaid + finalAmountDue).toFixed(2)}) must sum to Total Amount (NRP ${currentTotalAmount.toFixed(2)}).`, variant: "destructive" });
        return;
      }
    } else {
      switch (editedFormPaymentMethod) {
        case 'Cash': finalCashPaid = currentTotalAmount; break;
        case 'Credit Card': case 'Debit Card': finalDigitalPaid = currentTotalAmount; break;
        case 'Due': finalAmountDue = currentTotalAmount; break;
      }
    }
     if (validationError && isHybridPayment) {
        toast({ title: "Payment Error", description: validationError, variant: "destructive" });
        return;
    }

    const updatedSalePortion = {
        customerName: editedCustomerName,
        customerContact: editedCustomerContact.trim() || undefined,
        items: editedItems,
        totalAmount: currentTotalAmount,
        formPaymentMethod: editedFormPaymentMethod,
        cashPaid: finalCashPaid,
        digitalPaid: finalDigitalPaid,
        amountDue: finalAmountDue,
    };

    onFlagResolved(sale.id, updatedSalePortion, resolutionComment);
    onClose(); 
  };

  const handleDialogClose = () => {
    // Reset state to original sale values when dialog is closed without saving
    setEditedCustomerName(sale.customerName);
    setEditedCustomerContact(sale.customerContact || '');
    setEditedItems(JSON.parse(JSON.stringify(sale.items)));
    setEditedFormPaymentMethod(sale.formPaymentMethod);
    setHybridCashPaid(sale.cashPaid > 0 ? sale.cashPaid.toFixed(2) : '');
    setHybridDigitalPaid(sale.digitalPaid > 0 ? sale.digitalPaid.toFixed(2) : '');
    setHybridAmountLeftDue(sale.amountDue > 0 ? sale.amountDue.toFixed(2) : '');
    setResolutionComment('');
    setValidationError(null);
    onClose();
  }

  if (!isOpen) return null;

  const availableProductsForDropdown = (currentItemId?: string) => 
    allGlobalProducts.filter(p => 
      // Product has stock OR it's the item currently selected in this row OR it was part of the original sale
      (p.stock > 0) || 
      (currentItemId && p.id === currentItemId) || 
      (sale.items.find(si => si.productId === p.id)) 
    ).sort((a, b) => a.name.localeCompare(b.name));


  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleDialogClose(); }}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-green-600" /> Resolve Flag & Adjust Sale
          </DialogTitle>
          <DialogDescription>
            Reviewing flagged sale <strong>{sale.id.substring(0,8)}...</strong>. Make necessary adjustments and provide a resolution comment.
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable content area */}
        <div className="flex-grow overflow-y-auto space-y-4 p-1 pr-3"> {/* Added p-1 and pr-3 for scrollbar space */}
            {/* Customer Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                <Label htmlFor="editedCustomerName">Customer Name</Label>
                <Input id="editedCustomerName" value={editedCustomerName} onChange={(e) => setEditedCustomerName(e.target.value)} />
                </div>
                <div>
                <Label htmlFor="editedCustomerContact">Contact (Optional)</Label>
                <Input id="editedCustomerContact" value={editedCustomerContact} onChange={(e) => setEditedCustomerContact(e.target.value)} />
                </div>
            </div>

            {/* Items Section */}
            <Label className="text-base font-medium">Items</Label>
            {editedItems.map((item, index) => (
            <div key={index} className="flex items-end gap-3 p-3 border rounded-lg bg-card">
                <div className="flex-1 space-y-1">
                <Label htmlFor={`product-${index}-edit`}>Product</Label>
                <Select
                    value={item.productId}
                    onValueChange={(value) => handleItemChange(index, 'productId', value)}
                >
                    <SelectTrigger id={`product-${index}-edit`}>
                    <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                    {availableProductsForDropdown(item.productId).map((p) => (
                        <SelectItem key={p.id} value={p.id} 
                                    disabled={p.stock === 0 && p.id !== item.productId && !(sale.items.find(si => si.productId === p.id)) } // Disable if no stock unless it's current or was in original
                        >
                        {p.name} (Stock: {allGlobalProducts.find(agp => agp.id === p.id)?.stock || 0}, Price: NRP {p.price.toFixed(2)})
                        </SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                </div>
                <div className="w-24 space-y-1">
                <Label htmlFor={`quantity-${index}-edit`}>Quantity</Label>
                <Input
                    id={`quantity-${index}-edit`}
                    type="number"
                    min="0" 
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                    className="text-center"
                />
                </div>
                <div className="text-right w-28 space-y-1">
                    <Label>Subtotal</Label>
                    <p className="font-semibold text-lg h-9 flex items-center justify-end">NRP {item.totalPrice.toFixed(2)}</p>
                </div>
                <Button type="button" variant="destructive" size="icon" onClick={() => handleRemoveItem(index)} className="shrink-0">
                <Trash2 className="h-4 w-4" />
                </Button>
            </div>
            ))}
            <Button type="button" variant="outline" onClick={handleAddItem} className="w-full">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Item
            </Button>

            {/* Payment & Total Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start pt-2">
                <div>
                <Label htmlFor="editedPaymentMethod">Payment Method</Label>
                <Select value={editedFormPaymentMethod} onValueChange={(value) => setEditedFormPaymentMethod(value as PaymentMethodSelection)}>
                    <SelectTrigger id="editedPaymentMethod" className="mt-1">
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
                <p className="text-sm text-muted-foreground">New Total Sale Amount</p>
                <p className="text-3xl font-bold">NRP {currentTotalAmount.toFixed(2)}</p>
                </div>
            </div>

            {/* Hybrid Payment Details */}
            {isHybridPayment && (
                <DialogCard className="p-4 border-primary/50 bg-primary/5">
                <DialogCardHeader className="p-2 pt-0">
                    <DialogCardTitle className="text-lg font-semibold">Hybrid Payment Details</DialogCardTitle>
                    <DialogCardDescription>Amounts must sum to new total.</DialogCardDescription>
                </DialogCardHeader>
                <CardContent className="space-y-3 p-2">
                    <div>
                    <Label htmlFor="hybridCashPaid-edit">Cash Paid (NRP)</Label>
                    <Input id="hybridCashPaid-edit" type="number" value={hybridCashPaid} onChange={(e) => setHybridCashPaid(e.target.value)} placeholder="0.00" className="mt-1" />
                    </div>
                    <div>
                    <Label htmlFor="hybridDigitalPaid-edit">Digital Payment (NRP)</Label>
                    <Input id="hybridDigitalPaid-edit" type="number" value={hybridDigitalPaid} onChange={(e) => setHybridDigitalPaid(e.target.value)} placeholder="0.00" className="mt-1" />
                    </div>
                    <div>
                    <Label htmlFor="hybridAmountLeftDue-edit">Amount Left Due (NRP)</Label>
                    <Input id="hybridAmountLeftDue-edit" type="number" value={hybridAmountLeftDue} onChange={(e) => setHybridAmountLeftDue(e.target.value)} placeholder="0.00" className="mt-1" />
                    </div>
                    {validationError && (<Alert variant="destructive" className="mt-2"><Info className="h-4 w-4" /><AlertTitle>Payment Error</AlertTitle><AlertDescription>{validationError}</AlertDescription></Alert>)}
                </CardContent>
                </DialogCard>
            )}

            {/* Original Flag Comment */}
            <div className="pt-2">
                <Label htmlFor="originalFlagComment">Original Flag Comment:</Label>
                <p id="originalFlagComment" className="text-sm p-2 bg-muted rounded-md border min-h-[40px] whitespace-pre-wrap">
                {sale.flaggedComment || "No original comment provided."}
                </p>
            </div>

            {/* Resolution Comment */}
            <div>
                <Label htmlFor="resolutionComment">Resolution Comment (Required)</Label>
                <Textarea
                id="resolutionComment"
                value={resolutionComment}
                onChange={(e) => setResolutionComment(e.target.value)}
                placeholder="Explain the resolution or action taken..."
                rows={3}
                />
            </div>
        </div>
        
        <DialogFooter className="pt-4 border-t"> {/* Added border-t for separation */}
          <Button type="button" variant="outline" onClick={handleDialogClose}>Cancel</Button>
          <Button 
            type="button" 
            onClick={handleConfirmResolution} 
            disabled={!resolutionComment.trim() || (isHybridPayment && !!validationError) || editedItems.some(item => item.quantity <=0 && item.totalPrice > 0) || (editedItems.length > 0 && currentTotalAmount <= 0) }
            className={(!resolutionComment.trim() || (isHybridPayment && !!validationError)) ? "bg-primary/50" : "bg-primary hover:bg-primary/90"}
          >
            <Landmark className="mr-2 h-5 w-5" /> Confirm & Resolve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
