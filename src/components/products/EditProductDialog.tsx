
"use client";

import { useState, useEffect } from 'react';
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
import { Edit, Tag, DollarSignIcon, Layers } from 'lucide-react'; 
import { useToast } from '@/hooks/use-toast';
import type { Product, ProductType } from '@/types';
import { ALL_PRODUCT_TYPES } from '@/types';

interface EditProductDialogProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onConfirmEditProduct: (updatedDetails: {
    id: string;
    name: string;
    category: ProductType;
    sellingPrice: number;
    costPrice: number;
  }) => void;
}

export default function EditProductDialog({ product, isOpen, onClose, onConfirmEditProduct }: EditProductDialogProps) {
  const [name, setName] = useState<string>(product.name);
  const [category, setCategory] = useState<ProductType>(product.category);
  const [sellingPrice, setSellingPrice] = useState<string>(product.sellingPrice.toString());
  const [costPrice, setCostPrice] = useState<string>(product.costPrice.toString());
  const { toast } = useToast();

  useEffect(() => {
    if (product && isOpen) {
      setName(product.name);
      setCategory(product.category);
      setSellingPrice(product.sellingPrice.toString());
      setCostPrice(product.costPrice.toString());
    }
  }, [product, isOpen]);

  const handleConfirm = () => {
    const numSellingPrice = parseFloat(sellingPrice);
    const numCostPrice = parseFloat(costPrice);

    if (!name.trim()) {
      toast({ title: "Invalid Name", description: "Product name cannot be empty.", variant: "destructive" });
      return;
    }
    if (!category) { // Should always be selected as it's pre-filled
      toast({ title: "Invalid Category", description: "Please select a product category.", variant: "destructive" });
      return;
    }
    if (isNaN(numSellingPrice) || numSellingPrice <= 0) {
      toast({ title: "Invalid Selling Price", description: "Please enter a valid positive selling price.", variant: "destructive" });
      return;
    }
    if (isNaN(numCostPrice) || numCostPrice <= 0) {
      toast({ title: "Invalid Cost Price", description: "Please enter a valid positive cost price.", variant: "destructive" });
      return;
    }
    if (numCostPrice > numSellingPrice) {
      toast({ title: "Logical Error", description: "Cost price cannot be greater than selling price.", variant: "destructive" });
      return;
    }

    onConfirmEditProduct({
      id: product.id,
      name,
      category,
      sellingPrice: numSellingPrice,
      costPrice: numCostPrice,
    });
    onClose(); 
  };

  const handleCloseDialog = () => {
    // Reset state to original product values on cancel/close if needed,
    // or simply call onClose which parent handles.
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleCloseDialog}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-6 w-6 text-primary" /> Edit Product Details
          </DialogTitle>
          <DialogDescription>
            Modify the details for '{product.name}'. Click save to apply changes.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="editProductName" className="text-right col-span-1">
              <Tag className="inline-block mr-1 h-4 w-4 text-muted-foreground" /> Name
            </Label>
            <Input
              id="editProductName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              placeholder="E.g., Premium Vape Juice"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="editProductCategory" className="text-right col-span-1">
              <Layers className="inline-block mr-1 h-4 w-4 text-muted-foreground" /> Category
            </Label>
            <Select value={category} onValueChange={(value) => setCategory(value as ProductType)}>
              <SelectTrigger id="editProductCategory" className="col-span-3">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {ALL_PRODUCT_TYPES.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="editProductSellingPrice" className="text-right col-span-1">
              <DollarSignIcon className="inline-block mr-1 h-4 w-4 text-muted-foreground" /> Sell Price
            </Label>
            <Input
              id="editProductSellingPrice"
              type="number"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(e.target.value)}
              className="col-span-3"
              placeholder="NRP (e.g., 25.99)"
              min="0.01"
              step="0.01"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="editProductCostPrice" className="text-right col-span-1">
              <DollarSignIcon className="inline-block mr-1 h-4 w-4 text-muted-foreground" /> Cost Price
            </Label>
            <Input
              id="editProductCostPrice"
              type="number"
              value={costPrice}
              onChange={(e) => setCostPrice(e.target.value)}
              className="col-span-3"
              placeholder="NRP (e.g., 15.50)"
              min="0.01"
              step="0.01"
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={handleCloseDialog}>Cancel</Button>
          </DialogClose>
          <Button type="button" onClick={handleConfirm}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
