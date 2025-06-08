
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle as DialogCardTitleImport } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PackagePlus, Tag, DollarSignIcon, Archive, Layers, UserSquare, Landmark, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ProductType } from '@/types';
import { ALL_PRODUCT_TYPES } from '@/types';

type AcquisitionPaymentMethod = 'Cash' | 'Digital' | 'Due' | 'Hybrid';

interface AddProductDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmAddProduct: (newProductData: {
    name: string;
    category: ProductType;
    sellingPrice: number;
    costPrice: number;
    totalAcquiredStock: number;
    supplierName?: string;
    acquisitionPaymentDetails: {
      method: AcquisitionPaymentMethod;
      cashPaid: number;
      digitalPaid: number;
      dueAmount: number;
      totalAcquisitionCost: number;
    };
  }) => void;
}

const DialogCardTitle = DialogCardTitleImport;

export default function AddProductDialog({ isOpen, onClose, onConfirmAddProduct }: AddProductDialogProps) {
  const [name, setName] = useState<string>('');
  const [category, setCategory] = useState<ProductType | ''>('');
  const [sellingPrice, setSellingPrice] = useState<string>('');
  const [costPrice, setCostPrice] = useState<string>('');
  const [totalAcquiredStock, setTotalAcquiredStock] = useState<string>('');
  const [supplierName, setSupplierName] = useState<string>('');

  const [acquisitionPaymentMethod, setAcquisitionPaymentMethod] = useState<AcquisitionPaymentMethod>('Cash');
  const [isAcquisitionHybridPayment, setIsAcquisitionHybridPayment] = useState(false);
  const [acquisitionCashPaid, setAcquisitionCashPaid] = useState('');
  const [acquisitionDigitalPaid, setAcquisitionDigitalPaid] = useState('');
  const [acquisitionAmountDueToSupplier, setAcquisitionAmountDueToSupplier] = useState('');
  const [acquisitionPaymentValidationError, setAcquisitionPaymentValidationError] = useState<string | null>(null);

  const { toast } = useToast();

  const totalAcquisitionCost = useMemo(() => {
    const numCostPrice = parseFloat(costPrice);
    const numTotalAcquiredStock = parseInt(totalAcquiredStock, 10);
    if (isNaN(numCostPrice) || numCostPrice <= 0 || isNaN(numTotalAcquiredStock) || numTotalAcquiredStock < 0) {
      return 0;
    }
    return numCostPrice * numTotalAcquiredStock;
  }, [costPrice, totalAcquiredStock]);

  useEffect(() => {
    if (acquisitionPaymentMethod === 'Hybrid') {
      setIsAcquisitionHybridPayment(true);
    } else {
      setIsAcquisitionHybridPayment(false);
      setAcquisitionCashPaid('');
      setAcquisitionDigitalPaid('');
      setAcquisitionAmountDueToSupplier('');
    }
    setAcquisitionPaymentValidationError(null);
  }, [acquisitionPaymentMethod]);

  useEffect(() => {
    if (!isAcquisitionHybridPayment) {
      if (acquisitionPaymentValidationError && acquisitionPaymentValidationError.startsWith("Hybrid payments")) {
           setAcquisitionPaymentValidationError(null);
      }
      return;
    }
    if (totalAcquisitionCost === 0 && !acquisitionCashPaid && !acquisitionDigitalPaid && !acquisitionAmountDueToSupplier) {
        setAcquisitionPaymentValidationError(null);
        return;
    }

    const cash = parseFloat(acquisitionCashPaid) || 0;
    const digital = parseFloat(acquisitionDigitalPaid) || 0;
    const due = parseFloat(acquisitionAmountDueToSupplier) || 0;

    const filledFields = [acquisitionCashPaid, acquisitionDigitalPaid, acquisitionAmountDueToSupplier].filter(val => val !== '').length;

    if (filledFields === 2 && totalAcquisitionCost > 0) {
      if (acquisitionCashPaid !== '' && acquisitionDigitalPaid !== '' && acquisitionAmountDueToSupplier === '') {
        const remainingForDue = totalAcquisitionCost - cash - digital;
         if (parseFloat(acquisitionAmountDueToSupplier || "0").toFixed(2) !== remainingForDue.toFixed(2)) {
            setAcquisitionAmountDueToSupplier(remainingForDue >= 0 ? remainingForDue.toFixed(2) : '0.00');
         }
      } else if (acquisitionCashPaid !== '' && acquisitionAmountDueToSupplier !== '' && acquisitionDigitalPaid === '') {
        const remainingForDigital = totalAcquisitionCost - cash - due;
         if (parseFloat(acquisitionDigitalPaid || "0").toFixed(2) !== remainingForDigital.toFixed(2)) {
            setAcquisitionDigitalPaid(remainingForDigital >= 0 ? remainingForDigital.toFixed(2) : '0.00');
         }
      } else if (acquisitionDigitalPaid !== '' && acquisitionAmountDueToSupplier !== '' && acquisitionCashPaid === '') {
        const calculatedCash = totalAcquisitionCost - digital - due;
        if (parseFloat(acquisitionCashPaid || "0").toFixed(2) !== calculatedCash.toFixed(2)) {
            setAcquisitionCashPaid(calculatedCash >= 0 ? calculatedCash.toFixed(2) : '0.00');
        }
      }
    }
    
    const currentCashVal = parseFloat(acquisitionCashPaid) || 0;
    const currentDigitalVal = parseFloat(acquisitionDigitalPaid) || 0;
    const currentDueVal = parseFloat(acquisitionAmountDueToSupplier) || 0;
    const sumOfPayments = currentCashVal + currentDigitalVal + currentDueVal;

    if (Math.abs(sumOfPayments - totalAcquisitionCost) > 0.001 && (sumOfPayments > 0 || totalAcquisitionCost > 0)) {
        setAcquisitionPaymentValidationError(`Hybrid payments (NRP ${sumOfPayments.toFixed(2)}) must sum up to Total Acquisition Cost (NRP ${totalAcquisitionCost.toFixed(2)}).`);
    } else {
        setAcquisitionPaymentValidationError(null);
    }
  }, [acquisitionCashPaid, acquisitionDigitalPaid, acquisitionAmountDueToSupplier, totalAcquisitionCost, isAcquisitionHybridPayment, acquisitionPaymentValidationError]);


  const handleConfirm = () => {
    const numSellingPrice = parseFloat(sellingPrice);
    const numCostPrice = parseFloat(costPrice);
    const numTotalAcquiredStock = parseInt(totalAcquiredStock, 10);

    if (!name.trim()) {
      toast({ title: "Invalid Name", description: "Product name cannot be empty.", variant: "destructive" }); return;
    }
    if (!category) {
      toast({ title: "Invalid Category", description: "Please select a product category.", variant: "destructive" }); return;
    }
    if (isNaN(numSellingPrice) || numSellingPrice <= 0) {
      toast({ title: "Invalid Selling Price", description: "Please enter a valid positive selling price.", variant: "destructive" }); return;
    }
    if (isNaN(numCostPrice) || numCostPrice <= 0) {
      toast({ title: "Invalid Cost Price", description: "Please enter a valid positive cost price.", variant: "destructive" }); return;
    }
    if (numCostPrice > numSellingPrice) {
      toast({ title: "Logical Error", description: "Cost price cannot be greater than selling price.", variant: "destructive" }); return;
    }
    if (isNaN(numTotalAcquiredStock) || numTotalAcquiredStock < 0) {
      toast({ title: "Invalid Stock", description: "Please enter a valid non-negative quantity for initial stock.", variant: "destructive" }); return;
    }
    if (numTotalAcquiredStock > 0 && totalAcquisitionCost <= 0) {
        toast({ title: "Invalid Acquisition Cost", description: "Total acquisition cost must be positive if stock is being added.", variant: "destructive"}); return;
    }


    let finalCashPaid = 0;
    let finalDigitalPaid = 0;
    let finalAmountDue = 0;

    if (isAcquisitionHybridPayment) {
      finalCashPaid = parseFloat(acquisitionCashPaid) || 0;
      finalDigitalPaid = parseFloat(acquisitionDigitalPaid) || 0;
      finalAmountDue = parseFloat(acquisitionAmountDueToSupplier) || 0;

      if (finalCashPaid < 0 || finalDigitalPaid < 0 || finalAmountDue < 0) {
        toast({ title: "Invalid Payment", description: "Acquisition payment amounts cannot be negative.", variant: "destructive" }); return;
      }
      if (Math.abs(finalCashPaid + finalDigitalPaid + finalAmountDue - totalAcquisitionCost) > 0.001 && totalAcquisitionCost > 0) {
        setAcquisitionPaymentValidationError(`Hybrid payments must sum to Total Acquisition Cost (NRP ${totalAcquisitionCost.toFixed(2)}).`);
        toast({ title: "Payment Mismatch", description: `Hybrid payments (NRP ${(finalCashPaid + finalDigitalPaid + finalAmountDue).toFixed(2)}) must sum to Total Acquisition Cost (NRP ${totalAcquisitionCost.toFixed(2)}).`, variant: "destructive" });
        return;
      }
    } else {
      switch (acquisitionPaymentMethod) {
        case 'Cash': finalCashPaid = totalAcquisitionCost; break;
        case 'Digital': finalDigitalPaid = totalAcquisitionCost; break;
        case 'Due': finalAmountDue = totalAcquisitionCost; break;
      }
    }
    if (acquisitionPaymentValidationError && isAcquisitionHybridPayment) {
        toast({ title: "Payment Error", description: acquisitionPaymentValidationError, variant: "destructive" });
        return;
    }


    onConfirmAddProduct({
      name,
      category,
      sellingPrice: numSellingPrice,
      costPrice: numCostPrice,
      totalAcquiredStock: numTotalAcquiredStock,
      supplierName: supplierName.trim() || undefined,
      acquisitionPaymentDetails: {
        method: acquisitionPaymentMethod,
        cashPaid: finalCashPaid,
        digitalPaid: finalDigitalPaid,
        dueAmount: finalAmountDue,
        totalAcquisitionCost: totalAcquisitionCost
      }
    });
    
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setName('');
    setCategory('');
    setSellingPrice('');
    setCostPrice('');
    setTotalAcquiredStock('');
    setSupplierName('');
    setAcquisitionPaymentMethod('Cash');
    setIsAcquisitionHybridPayment(false);
    setAcquisitionCashPaid('');
    setAcquisitionDigitalPaid('');
    setAcquisitionAmountDueToSupplier('');
    setAcquisitionPaymentValidationError(null);
  };

  const handleCloseDialog = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {if(!open) handleCloseDialog()}}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <PackagePlus className="h-6 w-6 text-primary" /> Add New Product
          </DialogTitle>
          <DialogDescription>
            Enter details for the new product and its acquisition.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
          <div className="space-y-1.5">
            <Label htmlFor="productName">Product Name</Label>
            <Input id="productName" value={name} onChange={(e) => setName(e.target.value)} placeholder="E.g., Premium Vape Juice" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="productCategory">Category</Label>
            <Select value={category} onValueChange={(value) => setCategory(value as ProductType)}>
              <SelectTrigger id="productCategory"><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>{ALL_PRODUCT_TYPES.map(type => (<SelectItem key={type} value={type}>{type}</SelectItem>))}</SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="productSellingPrice">Selling Price (MRP)</Label>
              <Input id="productSellingPrice" type="number" value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} placeholder="NRP 0.00" min="0.01" step="0.01"/>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="productCostPrice">Cost Price (Unit)</Label>
              <Input id="productCostPrice" type="number" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} placeholder="NRP 0.00" min="0.01" step="0.01"/>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="productTotalAcquiredStock">Initial Stock Quantity</Label>
            <Input id="productTotalAcquiredStock" type="number" value={totalAcquiredStock} onChange={(e) => setTotalAcquiredStock(e.target.value)} placeholder="Units (e.g., 50)" min="0"/>
          </div>
          
          <div className="space-y-1.5">
            <Label htmlFor="supplierName">Supplier Name (Optional)</Label>
            <Input id="supplierName" value={supplierName} onChange={(e) => setSupplierName(e.target.value)} placeholder="E.g., Vape Supplies Co."/>
          </div>

          { (parseFloat(costPrice) > 0 && parseInt(totalAcquiredStock, 10) > 0) &&
            <div className="p-3 my-2 rounded-md border border-dashed border-primary bg-primary/5">
                <p className="text-sm font-medium text-primary">Total Acquisition Cost for this Batch:</p>
                <p className="text-2xl font-bold text-primary">NRP {totalAcquisitionCost.toFixed(2)}</p>
            </div>
          }

          <div className="space-y-1.5">
            <Label htmlFor="acquisitionPaymentMethod">Acquisition Payment Method</Label>
            <Select value={acquisitionPaymentMethod} onValueChange={(value) => setAcquisitionPaymentMethod(value as AcquisitionPaymentMethod)}>
              <SelectTrigger id="acquisitionPaymentMethod"><SelectValue placeholder="Select payment method" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="Digital">Digital (Card/Bank)</SelectItem>
                <SelectItem value="Due">Due to Supplier</SelectItem>
                <SelectItem value="Hybrid">Hybrid Payment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isAcquisitionHybridPayment && (
            <Card className="p-4 border-primary/50 bg-primary/5">
              <CardHeader className="p-0 pb-2">
                <DialogCardTitle className="text-base font-semibold">Hybrid Acquisition Payment</DialogCardTitle>
              </CardHeader>
              <CardContent className="space-y-2 p-0">
                <div className="space-y-1">
                  <Label htmlFor="acquisitionCashPaid" className="text-xs">Cash Paid (NRP)</Label>
                  <Input id="acquisitionCashPaid" type="number" value={acquisitionCashPaid} onChange={(e) => setAcquisitionCashPaid(e.target.value)} placeholder="0.00" min="0" step="0.01" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="acquisitionDigitalPaid" className="text-xs">Digital Paid (NRP)</Label>
                  <Input id="acquisitionDigitalPaid" type="number" value={acquisitionDigitalPaid} onChange={(e) => setAcquisitionDigitalPaid(e.target.value)} placeholder="0.00" min="0" step="0.01" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="acquisitionAmountDueToSupplier" className="text-xs">Amount Due to Supplier (NRP)</Label>
                  <Input id="acquisitionAmountDueToSupplier" type="number" value={acquisitionAmountDueToSupplier} onChange={(e) => setAcquisitionAmountDueToSupplier(e.target.value)} placeholder="0.00" min="0" step="0.01" />
                </div>
                {acquisitionPaymentValidationError && (
                  <Alert variant="destructive" className="mt-2 p-2.5 text-xs">
                    <Info className="h-4 w-4" />
                    <AlertTitle className="text-xs font-semibold">Payment Error</AlertTitle>
                    <AlertDescription>{acquisitionPaymentValidationError}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild><Button type="button" variant="outline" onClick={handleCloseDialog}>Cancel</Button></DialogClose>
          <Button 
            type="button" 
            onClick={handleConfirm}
            disabled={(isAcquisitionHybridPayment && !!acquisitionPaymentValidationError)}
            className={((isAcquisitionHybridPayment && !!acquisitionPaymentValidationError)) ? "bg-primary/50" : ""}
          >
            <Landmark className="mr-2 h-4 w-4" /> Confirm Add Product
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
