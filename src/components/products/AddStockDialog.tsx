
"use client";

import { useState } from 'react';
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
  DialogClose,
} from "@/components/ui/dialog";
import type { Product } from '@/types';
import { PackagePlus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AddStockDialogProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onConfirmAddStock: (productId: string, quantityToAdd: number) => void;
}

export default function AddStockDialog({ product, isOpen, onClose, onConfirmAddStock }: AddStockDialogProps) {
  const [quantityToAdd, setQuantityToAdd] = useState<number | string>('');
  const { toast } = useToast();

  const handleConfirm = () => {
    const numQuantity = Number(quantityToAdd);
    if (isNaN(numQuantity) || numQuantity <= 0) {
      toast({
        title: "Invalid Quantity",
        description: "Please enter a valid positive number for the quantity to add.",
        variant: "destructive",
      });
      return;
    }
    onConfirmAddStock(product.id, numQuantity);
    setQuantityToAdd(''); // Reset for next time
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackagePlus className="h-6 w-6 text-primary" /> Add Stock to {product.name}
          </DialogTitle>
          <DialogDescription>
            Current stock: {product.stock}. Enter the quantity you want to add.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="quantityToAdd" className="text-right col-span-1">
              Quantity
            </Label>
            <Input
              id="quantityToAdd"
              type="number"
              value={quantityToAdd}
              onChange={(e) => setQuantityToAdd(e.target.value === "" ? "" : Number(e.target.value))}
              className="col-span-3"
              placeholder="E.g., 10"
              min="1"
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="button" onClick={handleConfirm}>Confirm Add Stock</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
