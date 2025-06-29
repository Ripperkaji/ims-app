
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle as DialogCardTitleImport } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PackageOpen, Edit, DollarSign, Users, Landmark, Info, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Product, ProductType, ResolutionData, AttemptedProductData, AcquisitionPaymentMethod } from '@/types';

const DialogCardTitle = DialogCardTitleImport;

interface HandleExistingProductDialogProps {
  isOpen: boolean;
  onClose: () => void;
  existingProduct: Product;
  attemptedProductData: AttemptedProductData;
  onResolve: (resolutionData: ResolutionData) => void;
}


export default function HandleExistingProductDialog({
  isOpen,
  onClose,
  existingProduct,
  attemptedProductData,
  onResolve,
}: HandleExistingProductDialogProps) {
  const { toast } = useToast();

  const [selectedCondition, setSelectedCondition] = useState<'condition1' | 'condition2' | 'condition3' | null>(null);
  
  const [newCostPrice, setNewCostPrice] = useState<string>('');
  const [newSellingPrice, setNewSellingPrice] = useState<string>('');
  const [newSupplierName, setNewSupplierName] = useState<string>('');

  const [acquisitionPaymentMethod, setAcquisitionPaymentMethod] = useState<AcquisitionPaymentMethod>('Cash');
  const [isAcquisitionHybridPayment, setIsAcquisitionHybridPayment] = useState(false);
  const [acquisitionCashPaid, setAcquisitionCashPaid] = useState('');
  const [acquisitionDigitalPaid, setAcquisitionDigitalPaid] = useState('');
  const [acquisitionAmountDueToSupplier, setAcquisitionAmountDueToSupplier] = useState('');
  const [acquisitionPaymentValidationError, setAcquisitionPaymentValidationError] = useState<string | null>(null);

  const quantityToRestock = attemptedProductData.totalAcquiredStock;

  const currentCostPriceForCalculation = useMemo(() => {
    if ((selectedCondition === 'condition2' || selectedCondition === 'condition3') && parseFloat(newCostPrice) > 0) {
      return parseFloat(newCostPrice);
    }
    return existingProduct.currentCostPrice;
  }, [selectedCondition, newCostPrice, existingProduct.currentCostPrice]);

  const totalAcquisitionCost = useMemo(() => {
    if (quantityToRestock <= 0) return 0;
    return currentCostPriceForCalculation * quantityToRestock;
  }, [currentCostPriceForCalculation, quantityToRestock]);


  useEffect(() => {
    if (isOpen) {
      setSelectedCondition(null);
      setNewCostPrice(existingProduct.currentCostPrice.toString()); 
      setNewSellingPrice(existingProduct.currentSellingPrice.toString()); 
      setNewSupplierName('');
      setAcquisitionPaymentMethod('Cash');
      setIsAcquisitionHybridPayment(false);
      setAcquisitionCashPaid('');
      setAcquisitionDigitalPaid('');
      setAcquisitionAmountDueToSupplier('');
      setAcquisitionPaymentValidationError(null);
    }
  }, [isOpen, existingProduct]);
  
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
    if (!selectedCondition) {
      toast({ title: "Selection Required", description: "Please select how to handle this product.", variant: "destructive" });
      return;
    }
    if (quantityToRestock <= 0) {
        toast({ title: "Invalid Quantity", description: "Quantity to restock must be greater than zero.", variant: "destructive"});
        return;
    }

    let numNewCostPrice = existingProduct.currentCostPrice;
    let numNewSellingPrice = existingProduct.currentSellingPrice;
    let costPriceForPayload: number | undefined = undefined;
    let sellingPriceForPayload: number | undefined = undefined;


    if (selectedCondition === 'condition2' || selectedCondition === 'condition3') {
      numNewCostPrice = parseFloat(newCostPrice);
      numNewSellingPrice = parseFloat(newSellingPrice);
      if (isNaN(numNewCostPrice) || numNewCostPrice <= 0) {
        toast({ title: "Invalid New Cost Price", description: "Please enter a valid positive cost price.", variant: "destructive" }); return;
      }
      if (isNaN(numNewSellingPrice) || numNewSellingPrice <= 0) {
        toast({ title: "Invalid New Selling Price", description: "Please enter a valid positive selling price.", variant: "destructive" }); return;
      }
      if (numNewCostPrice > numNewSellingPrice) {
        toast({ title: "Logical Error", description: "New cost price cannot be greater than new selling price.", variant: "destructive" }); return;
      }
      costPriceForPayload = numNewCostPrice;
      sellingPriceForPayload = numNewSellingPrice;
    }

    if (selectedCondition === 'condition3' && !newSupplierName.trim()) {
      toast({ title: "Supplier Name Required", description: "Please enter the new supplier's name for condition 3.", variant: "destructive" }); return;
    }
    
    let finalCashPaid = 0;
    let finalDigitalPaid = 0;
    let finalAmountDue = 0;

    if (totalAcquisitionCost > 0) { 
        if (isAcquisitionHybridPayment) {
            finalCashPaid = parseFloat(acquisitionCashPaid) || 0;
            finalDigitalPaid = parseFloat(acquisitionDigitalPaid) || 0;
            finalAmountDue = parseFloat(acquisitionAmountDueToSupplier) || 0;

            if (finalCashPaid < 0 || finalDigitalPaid < 0 || finalAmountDue < 0) {
                toast({ title: "Invalid Payment", description: "Acquisition payment amounts cannot be negative.", variant: "destructive" }); return;
            }
            if (Math.abs(finalCashPaid + finalDigitalPaid + finalAmountDue - totalAcquisitionCost) > 0.001) {
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
    }
     if (acquisitionPaymentValidationError && isAcquisitionHybridPayment && totalAcquisitionCost > 0) {
        toast({ title: "Payment Error", description: acquisitionPaymentValidationError, variant: "destructive" });
        return;
    }

    const paymentDetails = {
      method: acquisitionPaymentMethod,
      cashPaid: finalCashPaid,
      digitalPaid: finalDigitalPaid,
      dueAmount: finalAmountDue,
      totalAcquisitionCost: totalAcquisitionCost,
    };

    let resolutionPayload: ResolutionData;

    if (selectedCondition === 'condition1') {
      resolutionPayload = {
        condition: 'condition1',
        existingProductId: existingProduct.id,
        quantityAdded: quantityToRestock,
        paymentDetails,
      };
    } else if (selectedCondition === 'condition2') {
      resolutionPayload = {
        condition: 'condition2',
        existingProductId: existingProduct.id,
        quantityAdded: quantityToRestock,
        newCostPrice: costPriceForPayload as number, // Ensured valid by checks above
        newSellingPrice: sellingPriceForPayload as number, // Ensured valid by checks above
        paymentDetails,
      };
    } else { // condition3
      resolutionPayload = {
        condition: 'condition3',
        existingProductId: existingProduct.id,
        quantityAdded: quantityToRestock,
        newSupplierName: newSupplierName.trim(),
        newCostPrice: costPriceForPayload, // Will be the entered value or undefined if not changed
        newSellingPrice: sellingPriceForPayload, // Will be the entered value or undefined if not changed
        paymentDetails,
      };
    }
    onResolve(resolutionPayload);
    onClose();
  };

  const existingProductName = `${existingProduct.name}${existingProduct.modelName ? ` (${existingProduct.modelName})` : ''}${existingProduct.flavorName ? ` - ${existingProduct.flavorName}` : ''}`;


  return (
    <Dialog open={isOpen} onOpenChange={(open) => {if(!open) onClose()}}>
      <DialogContent className="sm:max-w-lg md:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <PackageOpen className="h-6 w-6 text-primary" /> Product Exists: {existingProductName}
          </DialogTitle>
          <DialogDescription>
            A product matching these details already exists.
            You attempted to add {quantityToRestock} unit(s). How would you like to proceed?
            Current Cost: NRP {existingProduct.currentCostPrice.toFixed(2)}, Current MRP: NRP {existingProduct.currentSellingPrice.toFixed(2)}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4 max-h-[65vh] overflow-y-auto pr-2">
          <RadioGroup value={selectedCondition ?? ""} onValueChange={(value) => setSelectedCondition(value as 'condition1' | 'condition2' | 'condition3' | null)}>
            <div className="space-y-3">
              <Label htmlFor="condition1" className="flex flex-col p-3 border rounded-md hover:border-primary cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-all">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="condition1" id="condition1" />
                  <span className="font-semibold">Restock (Same Supplier/Price)</span>
                </div>
                <p className="text-xs text-muted-foreground ml-6">Add {quantityToRestock} units. Uses existing cost price of NRP {existingProduct.currentCostPrice.toFixed(2)}.</p>
              </Label>

              <Label htmlFor="condition2" className="flex flex-col p-3 border rounded-md hover:border-primary cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-all">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="condition2" id="condition2" />
                   <span className="font-semibold">Restock (Same Supplier, New Price)</span>
                </div>
                 <p className="text-xs text-muted-foreground ml-6">Add {quantityToRestock} units and update product prices.</p>
                {(selectedCondition === 'condition2') && (
                  <div className="ml-6 mt-2 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <Label htmlFor="newCostPriceC2" className="text-xs">New Cost Price/Unit</Label>
                            <Input id="newCostPriceC2" type="number" value={newCostPrice} onChange={(e) => setNewCostPrice(e.target.value)} placeholder="NRP 0.00" min="0.01" step="0.01" className="h-8 text-xs"/>
                        </div>
                        <div>
                            <Label htmlFor="newSellingPriceC2" className="text-xs">New Selling Price (MRP)</Label>
                            <Input id="newSellingPriceC2" type="number" value={newSellingPrice} onChange={(e) => setNewSellingPrice(e.target.value)} placeholder="NRP 0.00" min="0.01" step="0.01" className="h-8 text-xs"/>
                        </div>
                    </div>
                  </div>
                )}
              </Label>

              <Label htmlFor="condition3" className="flex flex-col p-3 border rounded-md hover:border-primary cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-all">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="condition3" id="condition3" />
                  <span className="font-semibold">Restock (New Supplier, Optional New Price)</span>
                </div>
                <p className="text-xs text-muted-foreground ml-6">Add {quantityToRestock} units. Log new supplier. Optionally update product prices for this batch and ongoing.</p>
                {selectedCondition === 'condition3' && (
                  <div className="ml-6 mt-2 space-y-2">
                    <div>
                        <Label htmlFor="newSupplierName" className="text-xs">New Supplier Name</Label>
                        <Input id="newSupplierName" value={newSupplierName} onChange={(e) => setNewSupplierName(e.target.value)} placeholder="Enter supplier name" className="h-8 text-xs"/>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <Label htmlFor="newCostPriceC3" className="text-xs">New Cost Price/Unit (Optional)</Label>
                            <Input id="newCostPriceC3" type="number" value={newCostPrice} onChange={(e) => setNewCostPrice(e.target.value)} placeholder={`NRP ${existingProduct.currentCostPrice.toFixed(2)}`} min="0.01" step="0.01" className="h-8 text-xs"/>
                        </div>
                        <div>
                            <Label htmlFor="newSellingPriceC3" className="text-xs">New Selling Price (MRP) (Optional)</Label>
                            <Input id="newSellingPriceC3" type="number" value={newSellingPrice} onChange={(e) => setNewSellingPrice(e.target.value)} placeholder={`NRP ${existingProduct.currentSellingPrice.toFixed(2)}`} min="0.01" step="0.01" className="h-8 text-xs"/>
                        </div>
                    </div>
                  </div>
                )}
              </Label>
            </div>
          </RadioGroup>

          {selectedCondition && quantityToRestock > 0 && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm font-semibold mb-1">Payment for this Batch (Cost: NRP {totalAcquisitionCost.toFixed(2)})</p>
              <div className="space-y-2">
                <div>
                    <Label htmlFor="resAcqPaymentMethod" className="text-xs">Payment Method</Label>
                    <Select value={acquisitionPaymentMethod} onValueChange={(value) => setAcquisitionPaymentMethod(value as AcquisitionPaymentMethod)}>
                    <SelectTrigger id="resAcqPaymentMethod" className="h-8 text-xs mt-0.5"><SelectValue placeholder="Select method" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="Digital">Digital Payment</SelectItem>
                        <SelectItem value="Due">Due to Supplier</SelectItem>
                        <SelectItem value="Hybrid">Hybrid Payment</SelectItem>
                    </SelectContent>
                    </Select>
                </div>

                {isAcquisitionHybridPayment && (
                    <Card className="p-3 border-primary/50 bg-primary/10">
                    <CardHeader className="p-0 pb-1.5"><DialogCardTitle className="text-sm font-medium">Hybrid Acquisition Payment</DialogCardTitle></CardHeader>
                    <CardContent className="space-y-1.5 p-0">
                        <div>
                            <Label htmlFor="resAcqCashPaid" className="text-xs">Cash Paid (NRP)</Label>
                            <Input id="resAcqCashPaid" type="number" value={acquisitionCashPaid} onChange={(e) => setAcquisitionCashPaid(e.target.value)} placeholder="0.00" min="0" step="0.01" className="h-8 text-xs"/>
                        </div>
                        <div>
                            <Label htmlFor="resAcqDigitalPaid" className="text-xs">Digital Paid (NRP)</Label>
                            <Input id="resAcqDigitalPaid" type="number" value={acquisitionDigitalPaid} onChange={(e) => setAcquisitionDigitalPaid(e.target.value)} placeholder="0.00" min="0" step="0.01" className="h-8 text-xs"/>
                        </div>
                        <div>
                            <Label htmlFor="resAcqAmountDue" className="text-xs">Amount Due to Supplier (NRP)</Label>
                            <Input id="resAcqAmountDue" type="number" value={acquisitionAmountDueToSupplier} onChange={(e) => setAcquisitionAmountDueToSupplier(e.target.value)} placeholder="0.00" min="0" step="0.01" className="h-8 text-xs"/>
                        </div>
                        {acquisitionPaymentValidationError && (
                        <Alert variant="destructive" className="mt-1 p-2 text-xs">
                            <Info className="h-3.5 w-3.5" />
                            <AlertTitle className="text-xs font-semibold">Payment Error</AlertTitle>
                            <AlertDescription>{acquisitionPaymentValidationError}</AlertDescription>
                        </Alert>
                        )}
                    </CardContent>
                    </Card>
                )}
              </div>
            </div>
          )}
           {selectedCondition && quantityToRestock <= 0 && (
             <Alert variant="destructive" className="mt-3">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Zero Quantity</AlertTitle>
                <AlertDescription>
                  The quantity to restock is zero. No stock will be added. You can still update prices or log supplier if applicable.
                </AlertDescription>
              </Alert>
           )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            type="button" 
            onClick={handleConfirm}
            disabled={!selectedCondition || (isAcquisitionHybridPayment && !!acquisitionPaymentValidationError && totalAcquisitionCost > 0)}
          >
            <Landmark className="mr-2 h-4 w-4" /> Confirm Action
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
