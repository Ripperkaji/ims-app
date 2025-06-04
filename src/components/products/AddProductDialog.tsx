
"use client";

import { useState } from 'react';
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
import { PackagePlus, Tag, DollarSignIcon, Archive, Layers, ChevronsUpDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ProductType } from '@/types';
import { ALL_PRODUCT_TYPES } from '@/types';

interface AddProductDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmAddProduct: (newProductData: {
    name: string;
    category: ProductType;
    sellingPrice: number;
    costPrice: number;
    totalAcquiredStock: number;
  }) => void;
}

export default function AddProductDialog({ isOpen, onClose, onConfirmAddProduct }: AddProductDialogProps) {
  const [name, setName] = useState<string>('');
  const [category, setCategory] = useState<ProductType | ''>('');
  const [sellingPrice, setSellingPrice] = useState<string>('');
  const [costPrice, setCostPrice] = useState<string>('');
  const [totalAcquiredStock, setTotalAcquiredStock] = useState<string>('');
  const { toast } = useToast();

  const handleConfirm = () => {
    const numSellingPrice = parseFloat(sellingPrice);
    const numCostPrice = parseFloat(costPrice);
    const numTotalAcquiredStock = parseInt(totalAcquiredStock, 10);

    if (!name.trim()) {
      toast({ title: "Invalid Name", description: "Product name cannot be empty.", variant: "destructive" });
      return;
    }
    if (!category) {
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
    if (isNaN(numTotalAcquiredStock) || numTotalAcquiredStock < 0) {
      toast({ title: "Invalid Stock", description: "Please enter a valid non-negative quantity for total acquired stock.", variant: "destructive" });
      return;
    }

    onConfirmAddProduct({
      name,
      category,
      sellingPrice: numSellingPrice,
      costPrice: numCostPrice,
      totalAcquiredStock: numTotalAcquiredStock
    });
    
    setName('');
    setCategory('');
    setSellingPrice('');
    setCostPrice('');
    setTotalAcquiredStock('');
    onClose();
  };

  const handleCloseDialog = () => {
    setName('');
    setCategory('');
    setSellingPrice('');
    setCostPrice('');
    setTotalAcquiredStock('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleCloseDialog}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackagePlus className="h-6 w-6 text-primary" /> Add New Product
          </DialogTitle>
          <DialogDescription>
            Enter the details for the new product. Click confirm to add it to the inventory.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="productName" className="text-right col-span-1">
              <Tag className="inline-block mr-1 h-4 w-4 text-muted-foreground" /> Name
            </Label>
            <Input
              id="productName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              placeholder="E.g., Premium Vape Juice"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="productCategory" className="text-right col-span-1">
              <Layers className="inline-block mr-1 h-4 w-4 text-muted-foreground" /> Category
            </Label>
            <Select value={category} onValueChange={(value) => setCategory(value as ProductType)}>
              <SelectTrigger id="productCategory" className="col-span-3">
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
            <Label htmlFor="productSellingPrice" className="text-right col-span-1">
              <DollarSignIcon className="inline-block mr-1 h-4 w-4 text-muted-foreground" /> Sell Price
            </Label>
            <Input
              id="productSellingPrice"
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
            <Label htmlFor="productCostPrice" className="text-right col-span-1">
              <DollarSignIcon className="inline-block mr-1 h-4 w-4 text-muted-foreground" /> Cost Price
            </Label>
            <Input
              id="productCostPrice"
              type="number"
              value={costPrice}
              onChange={(e) => setCostPrice(e.target.value)}
              className="col-span-3"
              placeholder="NRP (e.g., 15.50)"
              min="0.01"
              step="0.01"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="productTotalAcquiredStock" className="text-right col-span-1">
              <Archive className="inline-block mr-1 h-4 w-4 text-muted-foreground" /> Initial Stock
            </Label>
            <Input
              id="productTotalAcquiredStock"
              type="number"
              value={totalAcquiredStock}
              onChange={(e) => setTotalAcquiredStock(e.target.value)}
              className="col-span-3"
              placeholder="Units (e.g., 50)"
              min="0"
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={handleCloseDialog}>Cancel</Button>
          </DialogClose>
          <Button type="button" onClick={handleConfirm}>Confirm Add Product</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
