
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
import type { ProductType, NewProductData } from '@/types';
import { ALL_PRODUCT_TYPES } from '@/types';
import { formatCurrency } from '@/lib/utils';

type AcquisitionPaymentMethod = 'Cash' | 'Digital' | 'Due' | 'Hybrid';
interface FlavorStock {
  id: string; // For React key
  flavorName?: string;
  totalAcquiredStock: string;
}

interface AddProductDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onContinueToSummary: (data: NewProductData) => void;
}

const DialogCardTitle = DialogCardTitleImport;

export default function AddProductDialog({ isOpen, onClose, onContinueToSummary }: AddProductDialogProps) {
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

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const sanitizedValue = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    setName(sanitizedValue);
  };

  const totalAcquiredStockForCosting = useMemo(() => {
    return flavors.reduce((sum, f) => sum + (parseInt(f.totalAcquiredStock, 10) || 0), 0);
  }, [flavors]);

  const totalAcquisitionCost = useMemo(() => {
    const numCostPrice = parseFloat(costPrice);
    if (isNaN(numCostPrice) || numCostPrice <= 0 || totalAcquiredStockForCosting <= 0) {
      return 0;
    }
    return Math.round((numCostPrice * totalAcquiredStockForCosting) * 100) / 100;
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
         if (parseFloat(acquisitionAmountDueToSupplier || "0").toFixed(2) !== formatCurrency(remainingForDue)) {
            setAcquisitionAmountDueToSupplier(remainingForDue >= 0 ? formatCurrency(remainingForDue) : '0.00');
         }
      } else if (acquisitionCashPaid !== '' && acquisitionAmountDueToSupplier !== '' && acquisitionDigitalPaid === '') {
        const remainingForDigital = totalAcquisitionCost - cash - due;
         if (parseFloat(acquisitionDigitalPaid || "0").toFixed(2) !== formatCurrency(remainingForDigital)) {
            setAcquisitionDigitalPaid(remainingForDigital >= 0 ? formatCurrency(remainingForDigital) : '0.00');
         }
      } else if (acquisitionDigitalPaid !== '' && acquisitionAmountDueToSupplier !== '' && acquisitionCashPaid === '') {
        const calculatedCash = totalAcquisitionCost - digital - due;
        if (parseFloat(acquisitionCashPaid || "0").toFixed(2) !== formatCurrency(calculatedCash)) {
            setAcquisitionCashPaid(calculatedCash >= 0 ? formatCurrency(calculatedCash) : '0.00');
        }
      }
    }
    
    const currentCashVal = parseFloat(acquisitionCashPaid) || 0;
    const currentDigitalVal = parseFloat(acquisitionDigitalPaid) || 0;
    const currentDueVal = parseFloat(acquisitionAmountDueToSupplier) || 0;
    const sumOfPayments = currentCashVal + currentDigitalVal + currentDueVal;

    if (Math.abs(sumOfPayments - totalAcquisitionCost) > 0.001 && (sumOfPayments > 0 || totalAcquisitionCost > 0)) {
        setAcquisitionPaymentValidationError(`Hybrid payments (NRP ${formatCurrency(sumOfPayments)}) must sum up to Total Acquisition Cost (NRP ${formatCurrency(totalAcquisitionCost)}).`);
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
    const numSellingPrice = Math.round(Number(sellingPrice) * 100) / 100;
    const numCostPrice = Math.round(Number(costPrice) * 100) / 100;

    if (!name.trim()) { toast({ title: "Invalid Name", description: "Company name cannot be empty.", variant: "destructive" }); return; }
    if (!category) { toast({ title: "Invalid Category", description: "Please select a product category.", variant: "destructive" }); return; }
    if (isNaN(numSellingPrice) || numSellingPrice <= 0) { toast({ title: "Invalid Selling Price", description: "Please enter a valid positive selling price.", variant: "destructive" }); return; }
    if (isNaN(numCostPrice) || numCostPrice <= 0) { toast({ title: "Invalid Cost Price", description: "Please enter a valid positive cost price.", variant: "destructive" }); return; }
    if (numCostPrice > numSellingPrice) { toast({ title: "Logical Error", description: "Cost price cannot be greater than selling price.", variant: "destructive" }); return; }
    
    if (totalAcquiredStockForCosting <= 0) {
      toast({ title: "No Stock Added", description: "Please add a positive stock quantity to at least one variant.", variant: "destructive" });
      return;
    }
    
    const hasMultipleVariants = flavors.length > 1;
    if (hasMultipleVariants && flavors.some(f => !f.flavorName?.trim())) {
      toast({ title: "Flavor Name Required", description: "When adding multiple variants, each must have a unique flavor name.", variant: "destructive"});
      return;
    }
    
    if (totalAcquisitionCost <= 0) {
      toast({ title: "Invalid Acquisition Cost", description: "Total acquisition cost must be positive if stock is being added.", variant: "destructive"});
      return;
    }

    let finalCashPaid = 0;
    let finalDigitalPaid = 0;
    let finalAmountDue = 0;

    if (isAcquisitionHybridPayment) {
      finalCashPaid = Math.round(Number(acquisitionCashPaid) * 100) / 100;
      finalDigitalPaid = Math.round(Number(acquisitionDigitalPaid) * 100) / 100;
      finalAmountDue = Math.round(Number(acquisitionAmountDueToSupplier) * 100) / 100;

      if (finalCashPaid < 0 || finalDigitalPaid < 0 || finalAmountDue < 0) { toast({ title: "Invalid Payment", description: "Acquisition payment amounts cannot be negative.", variant: "destructive" }); return; }
      if (Math.abs(finalCashPaid + finalDigitalPaid + finalAmountDue - totalAcquisitionCost) > 0.001 && totalAcquisitionCost > 0) {
        setAcquisitionPaymentValidationError(`Hybrid payments must sum to Total Acquisition Cost (NRP ${formatCurrency(totalAcquisitionCost)}).`);
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

    onContinueToSummary({
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
            <Label>Company Name</Label>
            <Input value={name} onChange={handleNameChange} placeholder="E.g., PODJUICE, SMOK" />
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
              <Input value={modelName} onChange={(e) => setModelName(e.target.value)} placeholder="E.g., RPM5, BC5000" />
            </div>
          </div>
          
          <div className="space-y-2 pt-2">
            <Label className="font-semibold">Variants (Flavor / Type)</Label>
            {flavors.map((flavor, index) => (
              <div key={flavor.id} className="grid grid-cols-[1fr_auto_auto] gap-2 items-end p-2 border rounded-md">
                <div className="space-y-1">
                  <Label htmlFor={`flavorName-${index}`} className="text-xs">Flavor Name (Optional for single variant)</Label>
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
                  <p className="text-2xl font-bold text-primary">NRP {formatCurrency(totalAcquisitionCost)}</p>
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
          <Button type="button" onClick={handleConfirm} disabled={(isAcquisitionHybridPayment && !!acquisitionPaymentValidationError)}>
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    