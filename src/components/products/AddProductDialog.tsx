
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PackagePlus, Tag, DollarSignIcon, Archive, Layers } from 'lucide-react'; 
import { useToast } from '@/hooks/use-toast';
import { ALL_PRODUCT_TYPES, type ProductType } from '@/types';

interface AddProductDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmAddProduct: (newProductData: { name: string; price: number; stock: number; type: ProductType }) => void;
}

export default function AddProductDialog({ isOpen, onClose, onConfirmAddProduct }: AddProductDialogProps) {
  const [name, setName] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [stock, setStock] = useState<string>('');
  const [productType, setProductType] = useState<ProductType | undefined>(undefined);
  const { toast } = useToast();

  const handleConfirm = () => {
    const numPrice = parseFloat(price);
    const numStock = parseInt(stock, 10);

    if (!name.trim()) {
      toast({ title: "Invalid Name", description: "Product name cannot be empty.", variant: "destructive" });
      return;
    }
    if (isNaN(numPrice) || numPrice <= 0) {
      toast({ title: "Invalid Price", description: "Please enter a valid positive price.", variant: "destructive" });
      return;
    }
    if (isNaN(numStock) || numStock < 0) {
      toast({ title: "Invalid Stock", description: "Please enter a valid non-negative stock quantity.", variant: "destructive" });
      return;
    }
    if (!productType) {
      toast({ title: "Product Type Required", description: "Please select a product type.", variant: "destructive" });
      return;
    }

    onConfirmAddProduct({ name, price: numPrice, stock: numStock, type: productType });
    // Reset fields after successful confirmation
    setName('');
    setPrice('');
    setStock('');
    setProductType(undefined);
    onClose(); // Close the dialog
  };

  // Handler to also reset fields when dialog is closed via X or Cancel
  const handleCloseDialog = () => {
    setName('');
    setPrice('');
    setStock('');
    setProductType(undefined);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleCloseDialog}>
      <DialogContent className="sm:max-w-[480px]">
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
            <Label htmlFor="productType" className="text-right col-span-1">
              <Layers className="inline-block mr-1 h-4 w-4 text-muted-foreground" /> Type
            </Label>
            <Select value={productType} onValueChange={(value) => setProductType(value as ProductType)}>
              <SelectTrigger id="productType" className="col-span-3">
                <SelectValue placeholder="Select product type" />
              </SelectTrigger>
              <SelectContent>
                {ALL_PRODUCT_TYPES.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="productPrice" className="text-right col-span-1">
              <DollarSignIcon className="inline-block mr-1 h-4 w-4 text-muted-foreground" /> Price (NRP)
            </Label>
            <Input
              id="productPrice"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="col-span-3"
              placeholder="E.g., 25.99"
              min="0.01"
              step="0.01"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="productStock" className="text-right col-span-1">
              <Archive className="inline-block mr-1 h-4 w-4 text-muted-foreground" /> Stock
            </Label>
            <Input
              id="productStock"
              type="number"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className="col-span-3"
              placeholder="E.g., 50"
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
