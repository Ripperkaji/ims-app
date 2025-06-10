
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
import type { Sale, SaleItem, Product, ProductType } from '@/types';
import { ALL_PRODUCT_TYPES } from '@/types';
import { calculateCurrentStock } from '@/app/(app)/products/page';

import { ShieldCheck, PlusCircle, Trash2, Info, Landmark, Edit3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type PaymentMethodSelection = 'Cash' | 'Credit Card' | 'Debit Card' | 'Due' | 'Hybrid';

interface EditableSaleItem extends SaleItem {
  selectedCategory: ProductType | '';
}

interface AdjustSaleDialogProps {
  sale: Sale;
  isOpen: boolean;
  onClose: () => void;
  onSaleAdjusted: (
    originalSaleId: string,
    updatedSaleData: Partial<Sale> & {
        customerName: string;
        customerContact?: string;
        items: SaleItem[]; // This should be SaleItem[], not EditableSaleItem[]
        totalAmount: number;
        formPaymentMethod: PaymentMethodSelection;
        cashPaid: number;
        digitalPaid: number;
        amountDue: number;
    },
    adjustmentComment: string
  ) => void;
  allGlobalProducts: Product[];
  isInitiallyFlagged: boolean;
  mockSales: Sale[];
}

const DialogCardTitle = DialogCardTitleImport;
const DialogCardDescription = DialogCardDescriptionImport;

export default function AdjustSaleDialog({ sale, isOpen, onClose, onSaleAdjusted, allGlobalProducts, isInitiallyFlagged, mockSales }: AdjustSaleDialogProps) {
  const { toast } = useToast();

  const [editedCustomerName, setEditedCustomerName] = useState(sale.customerName);
  const [editedCustomerContact, setEditedCustomerContact] = useState(sale.customerContact || '');
  const [editedItems, setEditedItems] = useState<EditableSaleItem[]>([]);

  const [editedFormPaymentMethod, setEditedFormPaymentMethod] = useState<PaymentMethodSelection>(sale.formPaymentMethod);
  const [isHybridPayment, setIsHybridPayment] = useState(sale.formPaymentMethod === 'Hybrid');
  const [hybridCashPaid, setHybridCashPaid] = useState(sale.cashPaid.toString());
  const [hybridDigitalPaid, setHybridDigitalPaid] = useState(sale.digitalPaid.toString());
  const [hybridAmountLeftDue, setHybridAmountLeftDue] = useState(sale.amountDue.toString());
  
  const [adjustmentComment, setAdjustmentComment] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);


  const dialogTotalAmount = useMemo(() => {
    return editedItems.reduce((sum, item) => sum + item.totalPrice, 0);
  }, [editedItems]);

  useEffect(() => {
    if (isOpen) {
      setEditedCustomerName(sale.customerName);
      setEditedCustomerContact(sale.customerContact || '');
      setEditedItems(
        sale.items.map(originalItem => {
          const productDetails = allGlobalProducts.find(p => p.id === originalItem.productId);
          return {
            ...JSON.parse(JSON.stringify(originalItem)), // Deep copy of SaleItem
            selectedCategory: productDetails?.category || '',
          };
        })
      );
      setEditedFormPaymentMethod(sale.formPaymentMethod);
      setIsHybridPayment(sale.formPaymentMethod === 'Hybrid');
      setHybridCashPaid(sale.cashPaid > 0 ? sale.cashPaid.toFixed(2) : '');
      setHybridDigitalPaid(sale.digitalPaid > 0 ? sale.digitalPaid.toFixed(2) : '');
      setHybridAmountLeftDue(sale.amountDue > 0 ? sale.amountDue.toFixed(2) : '');
      setAdjustmentComment('');
      setValidationError(null);
    }
  }, [sale, isOpen, allGlobalProducts]);

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
    if (dialogTotalAmount === 0 && !hybridCashPaid && !hybridDigitalPaid && !hybridAmountLeftDue) {
        setValidationError(null);
        return;
    }

    const cash = parseFloat(hybridCashPaid) || 0;
    const digital = parseFloat(hybridDigitalPaid) || 0;
    const due = parseFloat(hybridAmountLeftDue) || 0;

    const filledFields = [hybridCashPaid, hybridDigitalPaid, hybridAmountLeftDue].filter(val => val !== '').length;

    if (filledFields === 2 && dialogTotalAmount > 0) {
      if (hybridCashPaid !== '' && hybridDigitalPaid !== '' && hybridAmountLeftDue === '') {
        const remainingForDue = dialogTotalAmount - cash - digital;
         if (parseFloat(hybridAmountLeftDue || "0").toFixed(2) !== remainingForDue.toFixed(2)) {
            setHybridAmountLeftDue(remainingForDue >= 0 ? remainingForDue.toFixed(2) : '0.00');
         }
      } else if (hybridCashPaid !== '' && hybridAmountLeftDue !== '' && hybridDigitalPaid === '') {
        const remainingForDigital = dialogTotalAmount - cash - due;
         if (parseFloat(hybridDigitalPaid || "0").toFixed(2) !== remainingForDigital.toFixed(2)) {
            setHybridDigitalPaid(remainingForDigital >= 0 ? remainingForDigital.toFixed(2) : '0.00');
         }
      } else if (hybridDigitalPaid !== '' && hybridAmountLeftDue !== '' && hybridCashPaid === '') {
        const calculatedCash = dialogTotalAmount - digital - due;
        if (parseFloat(hybridCashPaid || "0").toFixed(2) !== calculatedCash.toFixed(2)) {
            setHybridCashPaid(calculatedCash >= 0 ? calculatedCash.toFixed(2) : '0.00');
        }
      }
    }
    
    const currentCashForValidation = parseFloat(hybridCashPaid) || 0;
    const currentDigitalForValidation = parseFloat(hybridDigitalPaid) || 0;
    const currentDueForValidation = parseFloat(hybridAmountLeftDue) || 0;
    const sumOfPayments = currentCashForValidation + currentDigitalForValidation + currentDueForValidation;

    if (Math.abs(sumOfPayments - dialogTotalAmount) > 0.001 && (sumOfPayments > 0 || dialogTotalAmount > 0)) {
        setValidationError(`Hybrid payments (NRP ${sumOfPayments.toFixed(2)}) must sum up to Total Amount (NRP ${dialogTotalAmount.toFixed(2)}).`);
    } else {
        setValidationError(null);
    }

  }, [hybridCashPaid, hybridDigitalPaid, hybridAmountLeftDue, dialogTotalAmount, isHybridPayment, validationError]);


  const handleAddItem = () => {
    setEditedItems([
      ...editedItems,
      {
        productId: '',
        productName: '',
        quantity: 0,
        unitPrice: 0,
        totalPrice: 0,
        selectedCategory: '', // Initialize category
        isFlaggedForDamageExchange: false, // Default for new item
        damageExchangeComment: '',      // Default for new item
      },
    ]);
  };

  const handleItemCategoryChange = (index: number, category: ProductType | '') => {
    const newItems = [...editedItems];
    newItems[index] = {
      ...newItems[index],
      selectedCategory: category,
      productId: '', 
      productName: '',
      quantity: 0,
      unitPrice: 0,
      totalPrice: 0,
    };
    setEditedItems(newItems);
  };

  const handleItemChange = (index: number, field: keyof EditableSaleItem, value: string | number) => {
    const newItems = [...editedItems];
    const item = newItems[index];

    if (field === 'productId') {
      const newProduct = allGlobalProducts.find(p => p.id === value as string);
      if (newProduct) {
        item.productId = newProduct.id;
        item.productName = newProduct.name;
        item.unitPrice = newProduct.currentSellingPrice;
        
        const originalItem = sale.items.find(i => i.productId === newProduct.id);
        const currentGlobalStock = calculateCurrentStock(allGlobalProducts.find(p => p.id === newProduct.id), mockSales) || 0;
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
      const parsedQuantity = parseInt(value as string, 10);
      if (isNaN(parsedQuantity) || parsedQuantity < 0) {
        item.quantity = 0; 
      } else {
        const productDetails = allGlobalProducts.find(p => p.id === item.productId);
        const stockToCheck = calculateCurrentStock(productDetails, mockSales) || 0;
        const originalItem = sale.items.find(i => i.productId === item.productId);
        const quantityAlreadyInSale = originalItem ? originalItem.quantity : 0;

        if (parsedQuantity > (stockToCheck + quantityAlreadyInSale)) { 
          toast({ title: "Stock limit", description: `${item.productName} has only ${stockToCheck + quantityAlreadyInSale} items available for this adjustment.`, variant: "destructive" });
          item.quantity = stockToCheck + quantityAlreadyInSale;
        } else {
          item.quantity = parsedQuantity;
        }
      }
    }
    
    item.totalPrice = item.quantity * item.unitPrice;
    newItems[index] = item;
    setEditedItems(newItems);
  };

  const handleRemoveItem = (index: number) => {
    setEditedItems(editedItems.filter((_, i) => i !== index));
  };

  const handleConfirmChanges = () => {
    if (isInitiallyFlagged && !adjustmentComment.trim()) {
      toast({ title: "Comment Required", description: "Please provide a resolution comment for the flagged sale.", variant: "destructive"});
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
    if (editedItems.some(item => item.productId === '' || item.quantity <= 0 || isNaN(item.quantity))) {
      toast({ title: "Invalid Item", description: "One or more items are incomplete (missing product or category) or have zero/invalid quantity.", variant: "destructive" });
      return;
    }
    if (dialogTotalAmount <= 0 && editedItems.length > 0){
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
      if (Math.abs(finalCashPaid + finalDigitalPaid + finalAmountDue - dialogTotalAmount) > 0.001) {
        setValidationError(`Hybrid payments must sum to Total Amount (NRP ${dialogTotalAmount.toFixed(2)}).`);
        toast({ title: "Payment Mismatch", description: `Hybrid payments (NRP ${(finalCashPaid + finalDigitalPaid + finalAmountDue).toFixed(2)}) must sum to Total Amount (NRP ${dialogTotalAmount.toFixed(2)}).`, variant: "destructive" });
        return;
      }
    } else {
      switch (editedFormPaymentMethod) {
        case 'Cash': finalCashPaid = dialogTotalAmount; break;
        case 'Credit Card': case 'Debit Card': finalDigitalPaid = dialogTotalAmount; break;
        case 'Due': finalAmountDue = dialogTotalAmount; break;
      }
    }
     if (validationError && isHybridPayment) {
        toast({ title: "Payment Error", description: validationError, variant: "destructive" });
        return;
    }

    const itemsToSave: SaleItem[] = editedItems.map(ei => {
      const { selectedCategory, ...saleItem } = ei; // Destructure to remove selectedCategory
      return saleItem;
    });

    const updatedSalePortion = {
        customerName: editedCustomerName,
        customerContact: editedCustomerContact.trim() || undefined,
        items: itemsToSave,
        totalAmount: dialogTotalAmount,
        formPaymentMethod: editedFormPaymentMethod,
        cashPaid: finalCashPaid,
        digitalPaid: finalDigitalPaid,
        amountDue: finalAmountDue,
    };

    onSaleAdjusted(sale.id, updatedSalePortion, adjustmentComment);
    onClose();
  };

  const handleDialogClose = () => {
    setEditedCustomerName(sale.customerName);
    setEditedCustomerContact(sale.customerContact || '');
    setEditedItems(
      sale.items.map(originalItem => {
        const productDetails = allGlobalProducts.find(p => p.id === originalItem.productId);
        return {
          ...JSON.parse(JSON.stringify(originalItem)),
          selectedCategory: productDetails?.category || '',
        };
      })
    );
    setEditedFormPaymentMethod(sale.formPaymentMethod);
    setHybridCashPaid(sale.cashPaid > 0 ? sale.cashPaid.toFixed(2) : '');
    setHybridDigitalPaid(sale.digitalPaid > 0 ? sale.digitalPaid.toFixed(2) : '');
    setHybridAmountLeftDue(sale.amountDue > 0 ? sale.amountDue.toFixed(2) : '');
    setAdjustmentComment('');
    setValidationError(null);
    onClose();
  }

  if (!isOpen) return null;

  const availableProductsForDropdown = (
    currentItemId?: string, 
    currentItemIndex?: number,
    categoryFilter?: ProductType | ''
  ) => {
    let baseProducts = allGlobalProducts;
    if (categoryFilter) {
        baseProducts = baseProducts.filter(p => p.category === categoryFilter);
    }
      
    return baseProducts.filter(p => {
        const productDetails = allGlobalProducts.find(gp => gp.id === p.id);
        const originalSaleItem = sale.items.find(oi => oi.productId === p.id);
        
        const currentGlobalStockValue = calculateCurrentStock(productDetails, mockSales) || 0;
        const quantityInOriginalSaleForThisProduct = (originalSaleItem && originalSaleItem.productId === p.id) ? originalSaleItem.quantity : 0;
        const effectiveStock = currentGlobalStockValue + quantityInOriginalSaleForThisProduct;

        const isCurrentItemForThisRow = p.id === currentItemId;
        
        const alreadySelectedInOtherEditedRows = editedItems.some(
            (otherItem, otherIndex) => otherIndex !== currentItemIndex && otherItem.productId === p.id
        );

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
            {isInitiallyFlagged ? <ShieldCheck className="h-5 w-5 text-green-600" /> : <Edit3 className="h-5 w-5 text-primary" />}
            {isInitiallyFlagged ? "Resolve Flag & Adjust Sale" : "Adjust Sale Details"}
          </DialogTitle>
          <DialogDescription>
            Reviewing sale <strong>{sale.id.substring(0,8)}...</strong>. Adjust details as necessary.
            {isInitiallyFlagged && " Provide a resolution comment."}
            {!isInitiallyFlagged && " Provide an optional adjustment comment."}
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
                <Input id="editedCustomerContact" type="tel" value={editedCustomerContact} onChange={(e) => setEditedCustomerContact(e.target.value)} />
                </div>
            </div>


            <Label className="text-base font-medium">Items</Label>
            {editedItems.map((item, index) => (
            <div key={index} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_auto_auto_auto] items-end gap-2 p-2.5 border rounded-lg bg-card">
                <div className="space-y-1">
                  <Label htmlFor={`category-${index}-adj`} className="text-xs">Category</Label>
                  <Select
                    value={item.selectedCategory}
                    onValueChange={(value) => handleItemCategoryChange(index, value as ProductType | '')}
                  >
                    <SelectTrigger id={`category-${index}-adj`} className="h-9 text-xs">
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
                <Label htmlFor={`product-${index}-edit`}>Product</Label>
                <Select
                    value={item.productId}
                    onValueChange={(value) => handleItemChange(index, 'productId', value)}
                    disabled={!item.selectedCategory}
                >
                    <SelectTrigger id={`product-${index}-edit`} className="h-9 text-xs">
                    <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                    {availableProductsForDropdown(item.productId, index, item.selectedCategory).map((p) => {
                        const productDetails = allGlobalProducts.find(agp => agp.id === p.id);
                        const originalSaleItem = sale.items.find(osi => osi.productId === p.id);
                        const currentGlobalStockValue = calculateCurrentStock(productDetails, mockSales) || 0;
                        const quantityInOriginalSale = (originalSaleItem && originalSaleItem.productId === p.id) ? originalSaleItem.quantity : 0;
                        const effectiveStockDisplay = currentGlobalStockValue + quantityInOriginalSale;
                        return (
                          <SelectItem key={p.id} value={p.id}
                                      disabled={effectiveStockDisplay === 0 && p.id !== item.productId}
                                      className="text-xs"
                          >
                          {p.name} - Eff. Stock: {effectiveStockDisplay}, Price: NRP {p.currentSellingPrice.toFixed(2)}
                          </SelectItem>
                        );
                    })}
                    </SelectContent>
                </Select>
                </div>
                <div className="w-20 space-y-1">
                <Label htmlFor={`quantity-${index}-edit`} className="text-xs">Quantity</Label>
                <Input
                    id={`quantity-${index}-edit`}
                    type="number"
                    min="0"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                    className="text-center h-9 text-xs"
                    disabled={!item.productId}
                />
                </div>
                <div className="text-right w-24 space-y-1">
                    <Label className="text-xs">Subtotal</Label>
                    <p className="font-semibold text-base h-9 flex items-center justify-end">NRP {item.totalPrice.toFixed(2)}</p>
                </div>
                <Button type="button" variant="destructive" size="icon" onClick={() => handleRemoveItem(index)} className="shrink-0 h-8 w-8">
                <Trash2 className="h-3.5 w-3.5" />
                </Button>
            </div>
            ))}
            <Button type="button" variant="outline" onClick={handleAddItem} className="w-full h-9">
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
                <p className="text-3xl font-bold">NRP {dialogTotalAmount.toFixed(2)}</p>
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
                    <Label htmlFor="hybridCashPaid-edit" className="text-xs">Cash Paid (NRP)</Label>
                    <Input id="hybridCashPaid-edit" type="number" value={hybridCashPaid} onChange={(e) => setHybridCashPaid(e.target.value)} placeholder="0.00" min="0" step="0.01" className="mt-1 h-9" />
                    </div>
                    <div>
                    <Label htmlFor="hybridDigitalPaid-edit" className="text-xs">Digital Payment (NRP)</Label>
                    <Input id="hybridDigitalPaid-edit" type="number" value={hybridDigitalPaid} onChange={(e) => setHybridDigitalPaid(e.target.value)} placeholder="0.00" min="0" step="0.01" className="mt-1 h-9" />
                    </div>
                    <div>
                    <Label htmlFor="hybridAmountLeftDue-edit" className="text-xs">Amount Left Due (NRP)</Label>
                    <Input id="hybridAmountLeftDue-edit" type="number" value={hybridAmountLeftDue} onChange={(e) => setHybridAmountLeftDue(e.target.value)} placeholder="0.00" min="0" step="0.01" className="mt-1 h-9" />
                    </div>
                    {validationError && (<Alert variant="destructive" className="mt-2 p-2.5"><Info className="h-4 w-4" /><AlertTitle className="text-sm font-semibold">Payment Error</AlertTitle><AlertDescription className="text-xs">{validationError}</AlertDescription></Alert>)}
                </CardContent>
                </Card>
            )}

            {isInitiallyFlagged && (
              <div className="pt-2">
                  <Label htmlFor="originalFlagComment">Original Flag Comment:</Label>
                  <p id="originalFlagComment" className="text-sm p-2 bg-muted rounded-md border min-h-[40px] whitespace-pre-wrap">
                  {sale.flaggedComment || "No original comment provided."}
                  </p>
              </div>
            )}
            <div>
                <Label htmlFor="adjustmentComment">
                  {isInitiallyFlagged ? "Resolution Comment (Required)" : "Adjustment Comment (Optional)"}
                </Label>
                <Textarea
                id="adjustmentComment"
                value={adjustmentComment}
                onChange={(e) => setAdjustmentComment(e.target.value)}
                placeholder={isInitiallyFlagged ? "Explain the resolution or action taken..." : "Reason for adjustment (e.g., customer request, error correction)..."}
                rows={3}
                className="mt-1"
                />
            </div>
        </div>
        
        <DialogFooter className="pt-4 border-t">
          <Button type="button" variant="outline" onClick={handleDialogClose}>Cancel</Button>
          <Button
            type="button"
            onClick={handleConfirmChanges}
            disabled={ (isInitiallyFlagged && !adjustmentComment.trim()) || (isHybridPayment && !!validationError) || editedItems.some(item => item.productId === '' || (item.quantity <=0 && item.totalPrice > 0)) || (editedItems.length > 0 && dialogTotalAmount <= 0) }
            className={((isInitiallyFlagged && !adjustmentComment.trim()) || (isHybridPayment && !!validationError)) ? "bg-primary/50" : "bg-primary hover:bg-primary/90"}
          >
            <Landmark className="mr-2 h-5 w-5" /> Confirm Changes & Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    