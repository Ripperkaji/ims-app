
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle as DialogCardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Landmark, Package, Tag, Layers, DollarSign, Users, Hash, CalendarDays } from 'lucide-react';
import type { NewProductData } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { cn } from "@/lib/utils";
import { format } from 'date-fns';

interface AddProductSummaryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  productData: NewProductData | null;
}

export default function AddProductSummaryDialog({ isOpen, onClose, onConfirm, productData }: AddProductSummaryDialogProps) {
  const [confirmationText, setConfirmationText] = useState('');

  const handleConfirmClick = () => {
    if (isConfirmationValid) {
      onConfirm();
    }
  };

  const handleDialogClose = () => {
    setConfirmationText(''); // Reset on close
    onClose();
  };
  
  if (!isOpen || !productData) return null;
  
  const { name, modelName, category, sellingPrice, costPrice, supplierName, flavors, acquisitionDate, acquisitionPaymentDetails } = productData;
  const { method, cashPaid, digitalPaid, dueAmount, totalAcquisitionCost } = acquisitionPaymentDetails;

  const isConfirmationValid = confirmationText.trim().toUpperCase() === 'YES';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleDialogClose(); }}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Package className="h-6 w-6 text-primary" /> Product Summary
          </DialogTitle>
          <DialogDescription>
            Please review the details below before confirming.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-grow overflow-y-auto pr-3 space-y-4">
          <Card>
            <CardHeader>
              <DialogCardTitle className="text-lg">Product Details</DialogCardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-2"><Tag /> Company Name</span>
                <span className="font-semibold">{name}</span>
              </div>
              {modelName && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground flex items-center gap-2"><Hash /> Model</span>
                  <span className="font-semibold">{modelName}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-2"><Layers /> Category</span>
                <span className="font-semibold">{category}</span>
              </div>
               {supplierName && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground flex items-center gap-2"><Users /> Vendor/Supplier</span>
                  <span className="font-semibold">{supplierName}</span>
                </div>
              )}
               <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-2"><CalendarDays /> Acquisition Date</span>
                <span className="font-semibold">{format(acquisitionDate, 'PPP')}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <DialogCardTitle className="text-lg">Variants & Stock</DialogCardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Variant/Flavor</TableHead>
                    <TableHead className="text-right">Initial Stock</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {flavors.map((flavor, index) => (
                    <TableRow key={index}>
                      <TableCell>{flavor.flavorName || "Base Variant"}</TableCell>
                      <TableCell className="text-right">{flavor.totalAcquiredStock}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <DialogCardTitle className="text-lg">Pricing & Payment</DialogCardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-2"><DollarSign /> Cost per Unit</span>
                <span className="font-semibold">NRP {formatCurrency(costPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-2"><DollarSign /> Selling Price (MRP)</span>
                <span className="font-semibold">NRP {formatCurrency(sellingPrice)}</span>
              </div>
              <Separator className="my-3"/>
              <div className="flex justify-between text-base">
                <span className="text-muted-foreground">Total Acquisition Cost</span>
                <span className="font-bold text-primary">NRP {formatCurrency(totalAcquisitionCost)}</span>
              </div>
              <Separator className="my-3"/>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Method</span>
                <span className="font-semibold">{method}</span>
              </div>
              {method === 'Hybrid' && (
                <>
                  <div className="flex justify-between pl-4">
                    <span className="text-muted-foreground">Cash Paid</span>
                    <span className="font-semibold">NRP {formatCurrency(cashPaid)}</span>
                  </div>
                  <div className="flex justify-between pl-4">
                    <span className="text-muted-foreground">Digital Paid</span>
                    <span className="font-semibold">NRP {formatCurrency(digitalPaid)}</span>
                  </div>
                </>
              )}
               {(method === 'Due' || (method === 'Hybrid' && dueAmount > 0)) && (
                <div className="flex justify-between text-destructive font-bold">
                  <span className="">Amount Due to Vendor/Supplier</span>
                  <span>NRP {formatCurrency(dueAmount)}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="pt-4 border-t flex-col sm:flex-col sm:space-x-0 gap-4">
          <div className="space-y-1.5 w-full">
            <Label htmlFor="confirm-phrase">To confirm, please type "<strong>YES</strong>" in the box below.</Label>
            <Input
              id="confirm-phrase"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder='Type YES here'
              autoFocus
            />
          </div>
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 w-full">
            <Button type="button" variant="outline" onClick={handleDialogClose}>Back</Button>
            <Button
              type="button"
              onClick={handleConfirmClick}
              disabled={!isConfirmationValid}
              className={cn(!isConfirmationValid && "bg-primary/50 cursor-not-allowed")}
            >
              <Landmark className="mr-2 h-4 w-4" /> Confirm & Add Product
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
