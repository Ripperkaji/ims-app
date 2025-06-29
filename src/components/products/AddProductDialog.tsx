
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
import { PackagePlus, Landmark, Info, PlusCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ProductType } from '@/types';
import { ALL_PRODUCT_TYPES } from '@/types';

type AcquisitionPaymentMethod = 'Cash' | 'Digital' | 'Due' | 'Hybrid';
interface FlavorStock {
  id: string; // For React key
  flavorName?: string;
  totalAcquiredStock: string;
}

interface AddProductDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmAddMultipleProducts: (data: {
    name: string;
    modelName?: string;
    category: ProductType;
    sellingPrice: number;
    costPrice: number;
    supplierName?: string;
    flavors: { flavorName?: string; totalAcquiredStock: number }[];
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

export default function AddProductDialog({ isOpen, onClose, onConfirmAddMultipleProducts }: AddProductDialogProps) {
  const [name, setName] = useState<string>('');
  const [modelName, setModelName] = useState<string>('');
  const [category, setCategory] = useState<ProductType | ''>('');
  const [sellingPrice, setSellingPrice] = useState<string>('');
  const [costPrice, setCostPrice] = useState<string>('');
  const [supplierName, setSupplierName] = useState<string>('');

  const [flavors, setFlavors] = useState<FlavorStock[]>([{ id: `flavor-${Date.now()}`, flavorName: '', totalAcquiredStock: '' }]);

  const [acquisitionPaymentMethod, setAcquisitionPaymentMethod] = useState<AcquisitionPaymentMethod>('Cash');
  const [isAcquisitionHybridPayment, setIsAcquisitionHybridPayment] = useState(false);
  const [acquisitionCashPaid, setAcquisitionCashPaid] = useState('');
  const [acquisitionDigitalPaid, setAcquisitionDigitalPaid] = useState('');
  const [acquisitionAmountDueToSupplier, setAcquisitionAmountDueToSupplier] = useState('');
  const [acquisitionPaymentValidationError, setAcquisitionPaymentValidationError] = useState<string | null>(null);

  const { toast } = useToast();

  const totalAcquiredStockForCosting = useMemo(() => {
    return flavors.reduce((sum, f) => sum + (parseInt(f.totalAcquiredStock, 10) || 0), 0);
  }, [flavors]);

  const totalAcquisitionCost = useMemo(() => {
    const numCostPrice = parseFloat(costPrice);
    if (isNaN(numCostPrice) || numCostPrice <= 0 || totalAcquiredStockForCosting <= 0) {
      return 0;
    }
    return numCostPrice * totalAcquiredStockForCosting;
  }, [costPrice, totalAcquiredStockForCosting]);

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

  const handleFlavorChange = (index: number, field: 'flavorName' | 'totalAcquiredStock', value: string) => {
    const newFlavors = [...flavors];
    newFlavors[index] = { ...newFlavors[index], [field]: value };
    setFlavors(newFlavors);
  };

  const addFlavorRow = () => {
    setFlavors([...flavors, { id: `flavor-${Date.now()}`, flavorName: '', totalAcquiredStock: '' }]);
  };

  const removeFlavorRow = (index: number) => {
    if (flavors.length > 1) {
      setFlavors(flavors.filter((_, i) => i !== index));
    } else {
      toast({ title: "Cannot Remove", description: "At least one flavor/variant entry is required.", variant: "default" });
    }
  };

  const handleConfirm = () => {
    const numSellingPrice = parseFloat(sellingPrice);
    const numCostPrice = parseFloat(costPrice);

    if (!name.trim()) { toast({ title: "Invalid Name", description: "Product name cannot be empty.", variant: "destructive" }); return; }
    if (!category) { toast({ title: "Invalid Category", description: "Please select a product category.", variant: "destructive" }); return; }
    if (isNaN(numSellingPrice) || numSellingPrice <= 0) { toast({ title: "Invalid Selling Price", description: "Please enter a valid positive selling price.", variant: "destructive" }); return; }
    if (isNaN(numCostPrice) || numCostPrice <= 0) { toast({ title: "Invalid Cost Price", description: "Please enter a valid positive cost price.", variant: "destructive" }); return; }
    if (numCostPrice > numSellingPrice) { toast({ title: "Logical Error", description: "Cost price cannot be greater than selling price.", variant: "destructive" }); return; }
    if (flavors.some(f => (parseInt(f.totalAcquiredStock, 10) || 0) < 0)) { toast({ title: "Invalid Stock", description: "Stock quantity cannot be negative.", variant: "destructive" }); return; }
    if (flavors.every(f => (parseInt(f.totalAcquiredStock, 10) || 0) === 0)) { toast({ title: "No Stock Added", description: "Please add stock to at least one variant.", variant: "destructive" }); return; }
    if (flavors.some(f => !f.flavorName && flavors.length > 1)) { toast({ title: "Flavor Name Required", description: "Please specify a flavor name for each variant when adding multiple.", variant: "destructive"}); return; }
    
    if (totalAcquiredStockForCosting > 0 && totalAcquisitionCost <= 0) { toast({ title: "Invalid Acquisition Cost", description: "Total acquisition cost must be positive if stock is being added.", variant: "destructive"}); return; }

    let finalCashPaid = 0;
    let finalDigitalPaid = 0;
    let finalAmountDue = 0;

    if (isAcquisitionHybridPayment) {
      finalCashPaid = parseFloat(acquisitionCashPaid) || 0;
      finalDigitalPaid = parseFloat(acquisitionDigitalPaid) || 0;
      finalAmountDue = parseFloat(acquisitionAmountDueToSupplier) || 0;
      if (finalCashPaid < 0 || finalDigitalPaid < 0 || finalAmountDue < 0) { toast({ title: "Invalid Payment", description: "Acquisition payment amounts cannot be negative.", variant: "destructive" }); return; }
      if (Math.abs(finalCashPaid + finalDigitalPaid + finalAmountDue - totalAcquisitionCost) > 0.001 && totalAcquisitionCost > 0) {
        setAcquisitionPaymentValidationError(`Hybrid payments must sum to Total Acquisition Cost (NRP ${totalAcquisitionCost.toFixed(2)}).`);
        toast({ title: "Payment Mismatch", description: `Hybrid payments must sum up.`, variant: "destructive" });
        return;
      }
    } else {
      switch (acquisitionPaymentMethod) {
        case 'Cash': finalCashPaid = totalAcquisitionCost; break;
        case 'Digital': finalDigitalPaid = totalAcquisitionCost; break;
        case 'Due': finalAmountDue = totalAcquisitionCost; break;
      }
    }
    if (acquisitionPaymentValidationError && isAcquisitionHybridPayment && totalAcquisitionCost > 0) { toast({ title: "Payment Error", description: acquisitionPaymentValidationError, variant: "destructive" }); return; }

    onConfirmAddMultipleProducts({
      name: name.trim(),
      modelName: modelName.trim() || undefined,
      category,
      sellingPrice: numSellingPrice,
      costPrice: numCostPrice,
      supplierName: supplierName.trim() || undefined,
      flavors: flavors.map(f => ({
        flavorName: f.flavorName?.trim() || undefined,
        totalAcquiredStock: parseInt(f.totalAcquiredStock, 10) || 0,
      })).filter(f => f.totalAcquiredStock > 0), // Only include variants with stock
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
    setName(''); setModelName(''); setCategory(''); setSellingPrice(''); setCostPrice(''); setSupplierName('');
    setFlavors([{ id: `flavor-${Date.now()}`, flavorName: '', totalAcquiredStock: '' }]);
    setAcquisitionPaymentMethod('Cash'); setIsAcquisitionHybridPayment(false);
    setAcquisitionCashPaid(''); setAcquisitionDigitalPaid(''); setAcquisitionAmountDueToSupplier('');
    setAcquisitionPaymentValidationError(null);
  };

  const handleCloseDialog = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {if(!open) handleCloseDialog()}}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <PackagePlus className="h-6 w-6 text-primary" /> Add New Product
          </DialogTitle>
          <DialogDescription>Enter shared details and add one or more variants.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
          
          <div className="space-y-1.5">
            <Label>Product Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="E.g., Pod Juice, Smok" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={(value) => setCategory(value as ProductType)}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>{ALL_PRODUCT_TYPES.map(type => (<SelectItem key={type} value={type}>{type}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Model Name (Optional)</Label>
              <Input value={modelName} onChange={(e) => setModelName(e.target.value)} placeholder="E.g., RPM 5, BC5000" />
            </div>
          </div>
          
          <div className="space-y-2 pt-2">
            <Label className="font-semibold">Variants (Flavor / Type)</Label>
            {flavors.map((flavor, index) => (
              <div key={flavor.id} className="grid grid-cols-[1fr_auto_auto] gap-2 items-end p-2 border rounded-md">
                <div className="space-y-1">
                  <Label htmlFor={`flavorName-${index}`} className="text-xs">Flavor Name (Optional)</Label>
                  <Input id={`flavorName-${index}`} value={flavor.flavorName} onChange={(e) => handleFlavorChange(index, 'flavorName', e.target.value)} placeholder="E.g., Mango Tango" className="h-9"/>
                </div>
                <div className="space-y-1 w-28">
                  <Label htmlFor={`stock-${index}`} className="text-xs">Initial Stock</Label>
                  <Input id={`stock-${index}`} type="number" value={flavor.totalAcquiredStock} onChange={(e) => handleFlavorChange(index, 'totalAcquiredStock', e.target.value)} placeholder="Units" min="0" className="h-9"/>
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeFlavorRow(index)} className="h-9 w-9 text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4"/>
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addFlavorRow} className="w-full">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Another Variant
            </Button>
          </div>
          
          <div className="space-y-3 pt-3 border-t">
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1.5">
                <Label>Supplier Name (Optional)</Label>
                <Input value={supplierName} onChange={(e) => setSupplierName(e.target.value)} placeholder="E.g., Vape Supplies Co."/>
              </div>
               <div className="space-y-1.5">
                <Label>Cost Price (per Unit)</Label>
                <Input type="number" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} placeholder="NRP 0.00" min="0.01" step="0.01"/>
              </div>
            </div>
             <div className="space-y-1.5">
                <Label>Selling Price (MRP per Unit)</Label>
                <Input type="number" value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} placeholder="NRP 0.00" min="0.01" step="0.01"/>
            </div>

            {totalAcquisitionCost > 0 &&
              <div className="p-3 my-1 rounded-md border border-dashed border-primary bg-primary/5">
                  <p className="text-sm font-medium text-primary">Total Acquisition Cost for this Batch:</p>
                  <p className="text-2xl font-bold text-primary">NRP {totalAcquisitionCost.toFixed(2)}</p>
              </div>
            }

            <div className="space-y-1.5">
              <Label>Acquisition Payment Method</Label>
              <Select value={acquisitionPaymentMethod} onValueChange={(value) => setAcquisitionPaymentMethod(value as AcquisitionPaymentMethod)}>
                <SelectTrigger><SelectValue placeholder="Select payment method" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Digital">Digital Payment</SelectItem>
                  <SelectItem value="Due">Due to Supplier</SelectItem>
                  <SelectItem value="Hybrid">Hybrid Payment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isAcquisitionHybridPayment && (
              <Card className="p-4 border-primary/50 bg-primary/5">
                <CardHeader className="p-0 pb-2"><DialogCardTitle className="text-base font-semibold">Hybrid Acquisition Payment</DialogCardTitle></CardHeader>
                <CardContent className="space-y-2 p-0">
                  <div className="space-y-1"><Label className="text-xs">Cash Paid (NRP)</Label><Input type="number" value={acquisitionCashPaid} onChange={(e) => setAcquisitionCashPaid(e.target.value)} placeholder="0.00" min="0" step="0.01" /></div>
                  <div className="space-y-1"><Label className="text-xs">Digital Paid (NRP)</Label><Input type="number" value={acquisitionDigitalPaid} onChange={(e) => setAcquisitionDigitalPaid(e.target.value)} placeholder="0.00" min="0" step="0.01" /></div>
                  <div className="space-y-1"><Label className="text-xs">Amount Due (NRP)</Label><Input type="number" value={acquisitionAmountDueToSupplier} onChange={(e) => setAcquisitionAmountDueToSupplier(e.target.value)} placeholder="0.00" min="0" step="0.01" /></div>
                  {acquisitionPaymentValidationError && (<Alert variant="destructive" className="mt-2 p-2.5 text-xs"><Info className="h-4 w-4" /><AlertTitle className="text-xs font-semibold">Payment Error</AlertTitle><AlertDescription>{acquisitionPaymentValidationError}</AlertDescription></Alert>)}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button type="button" variant="outline" onClick={handleCloseDialog}>Cancel</Button></DialogClose>
          <Button type="button" onClick={handleConfirm} disabled={(isAcquisitionHybridPayment && !!acquisitionPaymentValidationError)} className={((isAcquisitionHybridPayment && !!acquisitionPaymentValidationError)) ? "bg-primary/50" : ""}>
            <Landmark className="mr-2 h-4 w-4" /> Add Products
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
