
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
import { Card, CardContent, CardHeader, CardTitle as DialogCardTitleImport, CardDescription as DialogCardDescriptionImport } from '@/components/ui/card'; 
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { Sale, SaleItem, Product } from '@/types';
import { ShieldCheck, PlusCircle, Trash2, Info, Landmark, Edit3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';

type PaymentMethodSelection = 'Cash' | 'Credit Card' | 'Debit Card' | 'Due' | 'Hybrid';

interface ResolveFlagDialogProps {
  sale: Sale;
  isOpen: boolean;
  onClose: () => void;
  onFlagResolved: ( // Renamed to onSaleAdjusted in AdjustSaleDialog
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

const DialogCardTitle = DialogCardTitleImport;
const DialogCardDescription = DialogCardDescriptionImport;


export default function ResolveFlagDialog({ sale, isOpen, onClose, onFlagResolved, allGlobalProducts }: ResolveFlagDialogProps) {
  const { toast } } = useToast();

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
      setHybridCashPaid(sale.cashPaid > 0 ? formatCurrency(sale.cashPaid) : '');
      setHybridDigitalPaid(sale.digitalPaid > 0 ? formatCurrency(sale.digitalPaid) : '');
      setHybridAmountLeftDue(sale.amountDue > 0 ? formatCurrency(sale.amountDue) : '');
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
    // Removed validationError from dependency array to prevent infinite loop
  }, [editedFormPaymentMethod]);

  useEffect(() => {
    if (!isHybridPayment) {
        setValidationError(null); 
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
            setHybridAmountLeftDue(remainingForDue >= 0 ? formatCurrency(remainingForDue) : '0.00');
         }
      } else if (hybridCashPaid !== '' && hybridAmountLeftDue !== '' && hybridDigitalPaid === '') {
        const remainingForDigital = currentTotalAmount - cash - due;
         if (parseFloat(hybridDigitalPaid || "0").toFixed(2) !== remainingForDigital.toFixed(2)) {
            setHybridDigitalPaid(remainingForDigital >= 0 ? formatCurrency(remainingForDigital) : '0.00');
         }
      } else if (hybridDigitalPaid !== '' && hybridAmountLeftDue !== '' && hybridCashPaid === '') {
        const calculatedCash = currentTotalAmount - digital - due;
        if (parseFloat(hybridCashPaid || "0").toFixed(2) !== calculatedCash.toFixed(2)) {
            setHybridCashPaid(calculatedCash >= 0 ? formatCurrency(calculatedCash) : '0.00');
        }
      }
    }
    
    const currentCashForValidation = parseFloat(hybridCashPaid) || 0;
    const currentDigitalForValidation = parseFloat(hybridDigitalPaid) || 0;
    const currentDueForValidation = parseFloat(hybridAmountLeftDue) || 0;
    const sumOfPayments = currentCashForValidation + currentDigitalForValidation + currentDueForValidation;

    if (Math.abs(sumOfPayments - currentTotalAmount) > 0.001 && (sumOfPayments > 0 || currentTotalAmount > 0)) {
        setValidationError(`Hybrid payments (NRP ${formatCurrency(sumOfPayments)}) must sum up to Total Amount (NRP ${formatCurrency(currentTotalAmount)}).`);
    } else {
        setValidationError(null);
    }
  }, [hybridCashPaid, hybridDigitalPaid, hybridAmountLeftDue, currentTotalAmount, isHybridPayment]);


  const handleAddItem = () => {
    const firstAvailableProduct = allGlobalProducts.find(p => {
        const globalProduct = allGlobalProducts.find(gp => gp.id === p.id);
        const originalItem = sale.items.find(oi => oi.productId === p.id);
        const currentStock = globalProduct?.stock || 0;
        const quantityInOriginalSale = originalItem ? originalItem.quantity : 0;
        const effectiveStock = currentStock + quantityInOriginalSale;

        return effectiveStock > 0 && !editedItems.find(si => si.productId === p.id);
    });
    
    if (firstAvailableProduct) {
      setEditedItems([
        ...editedItems,
        {
          productId: firstAvailableProduct.id,
          productName: firstAvailableProduct.name,
          quantity: 1,
          unitPrice: firstAvailableProduct.currentSellingPrice,
          totalPrice: firstAvailableProduct.currentSellingPrice,
        },
      ]);
    } else {
        toast({
            title: "No More Products",
            description: "All available products for adjustment are either out of stock or already added.",
            variant: "destructive"
        });
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
        item.unitPrice = newProduct.currentSellingPrice;
        
        const originalItem = sale.items.find(i => i.productId === newProduct.id);
        const currentGlobalStock = allGlobalProducts.find(p => p.id === newProduct.id)?.stock || 0;
        const quantityInOriginalSale = originalItem ? originalItem.quantity : 0;
        const maxAllowed = currentGlobalStock + quantityInOriginalSale;

        if (maxAllowed < 1) {
            toast({ title: "Out of Stock", description: `${newProduct.name} is effectively out of stock for adjustment. Quantity set to 0.`, variant: "destructive" });
            item.quantity = 0;
        } else {
            item.quantity = 1; 
        }
      }
    } else if (field === 'quantity') {
      const quantity = Number(value);
      const productDetails = allGlobalProducts.find(p => p.id === item.productId);
      const stockToCheck = productDetails?.stock || 0;
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
        setValidationError(`Hybrid payments must sum to Total Amount (NRP ${formatCurrency(currentTotalAmount)}).`);
        toast({ title: "Payment Mismatch", description: `Hybrid payments (NRP ${formatCurrency(finalCashPaid + finalDigitalPaid + finalAmountDue)}) must sum to Total Amount (NRP ${formatCurrency(currentTotalAmount)}).`, variant: "destructive" });
        return;
      }
    } else {
      switch (editedFormPaymentMethod) {
        case 'Cash': finalCashPaid = currentTotalAmount; break;
        case 'Credit Card': case 'Debit Card': finalDigitalPaid = currentTotalAmount; break;
        case 'Due': finalAmountDue = currentTotalAmount; break;
      }
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
    setEditedCustomerName(sale.customerName);
    setEditedCustomerContact(sale.customerContact || '');
    setEditedItems(JSON.parse(JSON.stringify(sale.items)));
    setEditedFormPaymentMethod(sale.formPaymentMethod);
    setHybridCashPaid(sale.cashPaid > 0 ? formatCurrency(sale.cashPaid) : '');
    setHybridDigitalPaid(sale.digitalPaid > 0 ? formatCurrency(sale.digitalPaid) : '');
    setHybridAmountLeftDue(sale.amountDue > 0 ? formatCurrency(sale.amountDue) : '');
    setResolutionComment('');
    setValidationError(null);
    onClose();
  }

  if (!isOpen) return null;

  const availableProductsForDropdown = (currentItemId?: string) => {
    return allGlobalProducts.filter(p => {
        const productInGlobalStock = allGlobalProducts.find(gp => gp.id === p.id);
        const originalItemInSale = sale.items.find(oi => oi.productId === p.id);
        
        const currentGlobalStockValue = productInGlobalStock?.stock || 0;
        const quantityInOriginalSaleForThisProduct = (originalItemInSale && originalItemInSale.productId === p.id) ? originalItemInSale.quantity : 0;
        const effectiveStock = currentGlobalStockValue + quantityInOriginalSaleForThisProduct;

        const isCurrentItemForThisRow = p.id === currentItemId;
        const alreadySelectedInOtherEditedRows = editedItems.some(ei => ei.productId === p.id && ei.productId !== currentItemId);

        if (isCurrentItemForThisRow) return true; 
        if (alreadySelectedInOtherEditedRows) return false; 
        return effectiveStock > 0; 
    }).sort((a, b) => a.name.localeCompare(b.name));
  };


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

        <div className="flex-grow overflow-y-auto space-y-4 p-1 pr-3"> 
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
                    {availableProductsForDropdown(item.productId).map((p) => {
                        const productDetails = allGlobalProducts.find(agp => agp.id === p.id);
                        const originalSaleItem = sale.items.find(osi => osi.productId === p.id);
                        const currentGlobalStockValue = productDetails?.stock || 0;
                        const quantityInOriginalSale = (originalSaleItem && originalSaleItem.productId === p.id) ? originalSaleItem.quantity : 0;
                        const effectiveStockDisplay = currentGlobalStockValue + quantityInOriginalSale;
                        return (
                          <SelectItem key={p.id} value={p.id}
                                      disabled={effectiveStockDisplay === 0 && p.id !== item.productId}
                          >
                          {p.name} - Eff. Stock: {effectiveStockDisplay}, Price: NRP {formatCurrency(p.currentSellingPrice)}
                          </SelectItem>
                        );
                    })}
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
                    <p className="font-semibold text-lg h-9 flex items-center justify-end">NRP {formatCurrency(item.totalPrice)}</p>
                </div>
                <Button type="button" variant="destructive" size="icon" onClick={() => handleRemoveItem(index)} className="shrink-0">
                <Trash2 className="h-4 w-4" />
                </Button>
            </div>
            ))}
            <Button type="button" variant="outline" onClick={handleAddItem} className="w-full">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Item
            </Button>

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
                <p className="text-3xl font-bold">NRP {formatCurrency(currentTotalAmount)}</p>
                </div>
            </div>

            {isHybridPayment && (
                <Card className="p-4 border-primary/50 bg-primary/5">
                <CardHeader className="p-2 pt-0">
                    <DialogCardTitle className="text-lg font-semibold">Hybrid Payment Details</DialogCardTitle>
                    <DialogCardDescription>Amounts must sum to new total.</DialogCardDescription>
                </CardHeader>
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
                </Card>
            )}

            <div className="pt-2">
                <Label htmlFor="originalFlagComment">Original Flag Comment:</Label>
                <p id="originalFlagComment" className="text-sm p-2 bg-muted rounded-md border min-h-[40px] whitespace-pre-wrap">
                {sale.flaggedComment || "No original comment provided."}
                </p>
            </div>

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
        
        <DialogFooter className="pt-4 border-t"> 
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
