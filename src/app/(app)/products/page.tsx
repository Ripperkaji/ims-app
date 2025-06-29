
"use client";

import React, { useState, useMemo, useEffect } from "react";
import { mockProducts, mockLogEntries, mockSales } from "@/lib/data"; 
import { useAuthStore } from "@/stores/authStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button, buttonVariants } from "@/components/ui/button";
import { Edit, PlusCircle, Filter, InfoIcon, PackageSearch, AlertCircle, ChevronsUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { Product, LogEntry, ProductType, AcquisitionPaymentMethod, AcquisitionBatch, ResolutionData, AttemptedProductData } from '@/types';
import { ALL_PRODUCT_TYPES } from '@/types';
import AddProductDialog from "@/components/products/AddProductDialog";
import EditProductDialog from "@/components/products/EditProductDialog";
import HandleExistingProductDialog from "@/components/products/HandleExistingProductDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { format, parseISO } from 'date-fns';
import { cn, formatCurrency } from "@/lib/utils";
import { calculateCurrentStock } from "@/lib/productUtils";
import { addLogEntry as globalAddLog } from "@/lib/data";


export default function ProductsPage() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  
  const [productsWithCalculatedStock, setProductsWithCalculatedStock] = useState<Array<Product & { currentDisplayStock: number }>>([]);
  
  const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [isEditProductDialogOpen, setIsEditProductDialogOpen] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<ProductType | ''>('');

  const [productConflictData, setProductConflictData] = useState<{ existingProduct: Product; attemptedData: AttemptedProductData } | null>(null);
  const [isHandleExistingProductDialogOpen, setIsHandleExistingProductDialogOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const updatedProducts = mockProducts.map(p => ({
      ...p,
      currentDisplayStock: calculateCurrentStock(p, mockSales)
    })).sort((a,b) => a.name.localeCompare(b.name));
    setProductsWithCalculatedStock(updatedProducts);
  }, [refreshTrigger, mockProducts, mockSales]);


  const addLog = (action: string, details: string) => {
    if (!user) return;
    globalAddLog(user.name, action, details);
  };

  const productsByGroup = useMemo(() => {
    const filteredProducts = productsWithCalculatedStock
      .filter(product => selectedCategoryFilter === '' || product.category === selectedCategoryFilter);

    const groups: { [groupKey: string]: { variants: Product[], totalStock: number, category: ProductType } } = {};
    
    filteredProducts.forEach(product => {
      const groupKey = `${product.name}___${product.modelName || 'no-model'}`;
      if (!groups[groupKey]) {
        groups[groupKey] = { variants: [], totalStock: 0, category: product.category };
      }
      groups[groupKey].variants.push(product);
      groups[groupKey].totalStock += product.currentDisplayStock;
    });

    return Object.entries(groups).sort(([keyA], [keyB]) => keyA.localeCompare(keyB));
  }, [productsWithCalculatedStock, selectedCategoryFilter]);
  

  const handleOpenEditProductDialog = (productId: string) => {
    const product = mockProducts.find(p => p.id === productId);
    if (product) {
      setProductToEdit(product);
      setIsEditProductDialogOpen(true);
    } else {
      toast({ title: "Error", description: "Product not found.", variant: "destructive" });
    }
  };

  const handleConfirmEditProduct = (updatedDetails: {
    id: string;
    name: string;
    modelName?: string;
    flavorName?: string;
    category: ProductType;
    sellingPrice: number;
    costPrice: number;
  }) => {
    const productIndexGlobal = mockProducts.findIndex(p => p.id === updatedDetails.id);
    if (productIndexGlobal !== -1 && user) {
      const originalProduct = mockProducts[productIndexGlobal];
      
      const newName = updatedDetails.name.trim();
      const newModelName = updatedDetails.modelName?.trim();
      const newFlavorName = updatedDetails.flavorName?.trim();
      
      const isChangingIdentifier = newName.toLowerCase() !== originalProduct.name.toLowerCase() ||
                                  newModelName?.toLowerCase() !== originalProduct.modelName?.toLowerCase() ||
                                  newFlavorName?.toLowerCase() !== originalProduct.flavorName?.toLowerCase();
      
      if (isChangingIdentifier) {
        const existingProductWithNewIdentifiers = mockProducts.find(p => 
            p.id !== updatedDetails.id &&
            p.name.toLowerCase() === newName.toLowerCase() &&
            p.modelName?.toLowerCase() === newModelName?.toLowerCase() &&
            p.flavorName?.toLowerCase() === newFlavorName?.toLowerCase()
        );
        if (existingProductWithNewIdentifiers) {
          const conflictDisplayName = `${newName}${newModelName ? ` (${newModelName})` : ''}${newFlavorName ? ` - ${newFlavorName}` : ''}`;
          toast({ title: "Name Conflict", description: `Another product variant already exists with the name '${conflictDisplayName}'. Please choose a different combination.`, variant: "destructive" });
          return;
        }
      }

      mockProducts[productIndexGlobal] = {
        ...originalProduct,
        name: newName,
        modelName: newModelName || undefined,
        flavorName: newFlavorName || undefined,
        category: updatedDetails.category,
        currentSellingPrice: updatedDetails.sellingPrice,
        currentCostPrice: updatedDetails.costPrice,
      };
      
      setRefreshTrigger(prev => prev + 1);

      const displayName = `${updatedDetails.name}${updatedDetails.modelName ? ` (${updatedDetails.modelName})` : ''}${updatedDetails.flavorName ? ` - ${updatedDetails.flavorName}` : ''}`;
      addLog("Product Details Updated", `Details for product '${displayName}' (ID: ${updatedDetails.id.substring(0,8)}...) updated by ${user.name}. Cat: ${updatedDetails.category}, Cost: ${formatCurrency(updatedDetails.costPrice)}, MRP: ${formatCurrency(updatedDetails.sellingPrice)}.`);
      toast({
        title: "Product Updated",
        description: `Details for ${displayName} have been successfully updated.`,
      });
    } else {
      toast({ title: "Error", description: "Could not find product to update or user not available.", variant: "destructive"});
    }
    setIsEditProductDialogOpen(false);
    setProductToEdit(null);
  };

  const handleAddNewProductClick = () => {
    setIsAddProductDialogOpen(true);
  };

  const handleConfirmAddMultipleProducts = (data: {
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
  }) => {
    if (!user) {
      toast({ title: "Error", description: "User not available.", variant: "destructive" });
      return;
    }

    if (data.flavors.length === 1) {
      const flavorInfo = data.flavors[0];
      const existingProduct = mockProducts.find(p =>
          p.name.toLowerCase() === data.name.toLowerCase() &&
          p.modelName?.toLowerCase() === data.modelName?.toLowerCase() &&
          p.flavorName?.toLowerCase() === flavorInfo.flavorName?.toLowerCase()
      );

      if (existingProduct) {
          setProductConflictData({
              existingProduct,
              attemptedData: {
                  name: data.name,
                  modelName: data.modelName,
                  flavorName: flavorInfo.flavorName,
                  category: data.category,
                  sellingPrice: data.sellingPrice,
                  costPrice: data.costPrice,
                  totalAcquiredStock: flavorInfo.totalAcquiredStock,
                  supplierName: data.supplierName,
              }
          });
          setIsHandleExistingProductDialogOpen(true);
          setIsAddProductDialogOpen(false); 
          return;
      }
    } else {
      for (const flavorInfo of data.flavors) {
        const existingProduct = mockProducts.find(p =>
          p.name.toLowerCase() === data.name.toLowerCase() &&
          p.modelName?.toLowerCase() === data.modelName?.toLowerCase() &&
          p.flavorName?.toLowerCase() === flavorInfo.flavorName?.toLowerCase()
        );

        if (existingProduct) {
          const conflictDisplayName = `${data.name}${data.modelName ? ` (${data.modelName})` : ''}${flavorInfo.flavorName ? ` - ${flavorInfo.flavorName}` : ''}`;
          toast({
            title: "Batch Add Error: Product Exists",
            description: `The variant '${conflictDisplayName}' already exists. When adding multiple variants, all must be new. Please remove it from the batch.`,
            variant: "destructive",
            duration: 9000,
          });
          return;
        }
      }
    }

    const productsAddedDetails: string[] = [];
    for (const flavorInfo of data.flavors) {
      const newProductId = `prod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const totalAcquiredStock = flavorInfo.totalAcquiredStock;
      const batchTotalCostForVariant = data.costPrice * totalAcquiredStock;
      const proportionOfTotalCost = data.acquisitionPaymentDetails.totalAcquisitionCost > 0 ? batchTotalCostForVariant / data.acquisitionPaymentDetails.totalAcquisitionCost : 0;

      const firstBatch: AcquisitionBatch = {
        batchId: `batch-${newProductId}-${Date.now()}`,
        date: new Date().toISOString(),
        condition: "Product Added",
        supplierName: data.supplierName,
        quantityAdded: totalAcquiredStock,
        costPricePerUnit: data.costPrice,
        sellingPricePerUnitAtAcquisition: data.sellingPrice,
        paymentMethod: data.acquisitionPaymentDetails.method,
        totalBatchCost: batchTotalCostForVariant,
        cashPaid: proportionOfTotalCost * data.acquisitionPaymentDetails.cashPaid,
        digitalPaid: proportionOfTotalCost * data.acquisitionPaymentDetails.digitalPaid,
        dueToSupplier: proportionOfTotalCost * data.acquisitionPaymentDetails.dueAmount,
      };

      const newProduct: Product = {
        id: newProductId,
        name: data.name,
        modelName: data.modelName,
        flavorName: flavorInfo.flavorName,
        category: data.category,
        currentSellingPrice: data.sellingPrice,
        currentCostPrice: data.costPrice,
        acquisitionHistory: [firstBatch],
        damagedQuantity: 0,
        testerQuantity: 0,
      };

      mockProducts.push(newProduct);
      productsAddedDetails.push(`${flavorInfo.flavorName || 'N/A'} (Qty: ${totalAcquiredStock})`);
    }

    setRefreshTrigger(prev => prev + 1);

    const fullProductName = `${data.name}${data.modelName ? ` (${data.modelName})` : ''}`;
    let logDetails = `Batch product add for '${fullProductName}' by ${user.name}. Variants: ${productsAddedDetails.join('; ')}. Cost/Unit: ${formatCurrency(data.costPrice)}, MRP/Unit: ${formatCurrency(data.sellingPrice)}.`;
    if (data.supplierName) logDetails += ` Supplier: ${data.supplierName}.`;
    if (data.acquisitionPaymentDetails.totalAcquisitionCost > 0) {
      logDetails += ` Total Batch Cost: NRP ${formatCurrency(data.acquisitionPaymentDetails.totalAcquisitionCost)} via ${data.acquisitionPaymentDetails.method}.`;
      if (data.acquisitionPaymentDetails.method === 'Hybrid') {
        logDetails += ` (Cash: ${formatCurrency(data.acquisitionPaymentDetails.cashPaid)}, Digital: ${formatCurrency(data.acquisitionPaymentDetails.digitalPaid)}, Due: ${formatCurrency(data.acquisitionPaymentDetails.dueAmount)})`;
      }
    }
    
    addLog("Batch Product Add", logDetails);
    toast({ title: "Products Added", description: `${productsAddedDetails.length} new product variants for ${fullProductName} have been added.` });
    setIsAddProductDialogOpen(false);
  };
  
  const handleProductConflictResolution = (resolutionData: ResolutionData) => {
    const productIndex = mockProducts.findIndex(p => p.id === resolutionData.existingProductId);
    if (productIndex === -1 || !user) {
      toast({ title: "Error", description: "Could not find existing product or user not available.", variant: "destructive" });
      setIsHandleExistingProductDialogOpen(false);
      return;
    }

    const productToUpdate = mockProducts[productIndex];
    let logAction = "Product Restocked"; 
    const fullProductName = `${productToUpdate.name}${productToUpdate.modelName ? ` (${productToUpdate.modelName})` : ''}${productToUpdate.flavorName ? ` - ${productToUpdate.flavorName}` : ''}`;
    let logDetails = `Product '${fullProductName}' restocked by ${user.name}. `;
    
    const costPriceFromDialog = resolutionData.newCostPrice; 
    const sellingPriceFromDialog = resolutionData.newSellingPrice;

    const newBatch: AcquisitionBatch = {
      batchId: `batch-${productToUpdate.id}-${Date.now()}`,
      date: new Date().toISOString(),
      condition: resolutionData.condition, 
      quantityAdded: resolutionData.quantityAdded,
      costPricePerUnit: 0, 
      sellingPricePerUnitAtAcquisition: 0, 
      supplierName: resolutionData.condition === 'condition3' ? resolutionData.newSupplierName : (productToUpdate.acquisitionHistory.length > 0 ? productToUpdate.acquisitionHistory[productToUpdate.acquisitionHistory.length -1].supplierName : undefined),
      paymentMethod: resolutionData.paymentDetails.method,
      totalBatchCost: resolutionData.paymentDetails.totalAcquisitionCost,
      cashPaid: resolutionData.paymentDetails.cashPaid,
      digitalPaid: resolutionData.paymentDetails.digitalPaid,
      dueToSupplier: resolutionData.paymentDetails.dueAmount,
    };

    logDetails += `Qty Added: ${resolutionData.quantityAdded}. `;

    if (resolutionData.condition === 'condition1') { 
      newBatch.condition = "Restock (Same Supplier/Price)";
      newBatch.costPricePerUnit = productToUpdate.currentCostPrice; 
      newBatch.sellingPricePerUnitAtAcquisition = productToUpdate.currentSellingPrice; 
      logDetails += `Using existing cost: NRP ${formatCurrency(productToUpdate.currentCostPrice)}. `;
      logAction = newBatch.condition;
    } else if (resolutionData.condition === 'condition2') { 
      newBatch.condition = "Restock (Same Supplier, New Price)";
      productToUpdate.currentCostPrice = costPriceFromDialog!;
      productToUpdate.currentSellingPrice = sellingPriceFromDialog!;
      newBatch.costPricePerUnit = costPriceFromDialog!; 
      newBatch.sellingPricePerUnitAtAcquisition = sellingPriceFromDialog!;
      logDetails += `Prices updated - New Current Cost: NRP ${formatCurrency(costPriceFromDialog!)}, New Current MRP: NRP ${formatCurrency(sellingPriceFromDialog!)}. Batch Cost: NRP ${formatCurrency(costPriceFromDialog!)}. `;
      logAction = newBatch.condition;
    } else if (resolutionData.condition === 'condition3') { 
      newBatch.condition = "Restock (New Supplier)";
      let mainPricesUpdated = false;
      if (costPriceFromDialog !== undefined && sellingPriceFromDialog !== undefined) {
          productToUpdate.currentCostPrice = costPriceFromDialog;
          productToUpdate.currentSellingPrice = sellingPriceFromDialog;
          newBatch.costPricePerUnit = costPriceFromDialog;
          newBatch.sellingPricePerUnitAtAcquisition = sellingPriceFromDialog;
          mainPricesUpdated = true;
          logDetails += `Prices updated - New Current Cost: NRP ${formatCurrency(costPriceFromDialog)}, New Current MRP: NRP ${formatCurrency(sellingPriceFromDialog)}. `;
      } else {
          newBatch.costPricePerUnit = productToUpdate.currentCostPrice;
          newBatch.sellingPricePerUnitAtAcquisition = productToUpdate.currentSellingPrice;
      }
      logDetails += `New Supplier: ${resolutionData.newSupplierName}. Batch Cost: NRP ${formatCurrency(newBatch.costPricePerUnit)}. `;
      if (!mainPricesUpdated) {
          logDetails += `Main product prices remain unchanged. `;
      }
      logAction = newBatch.condition;
    }
    
    if (newBatch.totalBatchCost > 0 && newBatch.quantityAdded > 0) {
        logDetails += `Batch Total Cost: NRP ${formatCurrency(newBatch.totalBatchCost)} via ${newBatch.paymentMethod}.`;
        if (newBatch.paymentMethod === 'Hybrid') {
            logDetails += ` (Cash: ${formatCurrency(newBatch.cashPaid)}, Digital: ${formatCurrency(newBatch.digitalPaid)}, Due: ${formatCurrency(newBatch.dueToSupplier)})`;
        } else if (newBatch.paymentMethod === 'Due') {
            logDetails += ` (Due: ${formatCurrency(newBatch.dueToSupplier)})`;
        }
    }
    
    productToUpdate.acquisitionHistory.push(newBatch);
    setRefreshTrigger(prev => prev + 1);
    
    addLog(logAction, logDetails);
    toast({ title: "Product Update Successful", description: `${fullProductName} has been updated.` });
    setIsHandleExistingProductDialogOpen(false);
    setProductConflictData(null);
  };

  const formatAcquisitionConditionForDisplay = (conditionKey?: string) => {
    if (!conditionKey) return 'N/A';
    const conditionMap: { [key: string]: string } = {
        'condition1': 'Restock (Same Supplier/Price)',
        'condition2': 'Restock (Same Supplier, New Price)',
        'condition3': 'Restock (New Supplier)',
        'Product Added': 'Product Added',
        'Initial Stock': 'Initial Stock'
    };
    return conditionMap[conditionKey] || conditionKey.replace(/([A-Z])/g, ' $1').trim();
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline flex items-center gap-2"><PackageSearch />Product Inventory</h1>
        {user.role === 'admin' && (
          <Button onClick={handleAddNewProductClick}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Product
          </Button>
        )}
      </div>
      
      <div className="my-4 flex items-center gap-4">
        <Label htmlFor="categoryFilter" className="text-base font-medium flex items-center">
            <Filter className="mr-2 h-4 w-4 text-primary"/> Filter by Category:
        </Label>
        <Select
            value={selectedCategoryFilter}
            onValueChange={(value) => setSelectedCategoryFilter(value === 'ALL_CATEGORIES_FILTER_VALUE' ? '' : value as ProductType)}
        >
            <SelectTrigger id="categoryFilter" className="w-auto min-w-[200px] sm:min-w-[280px]">
            <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
            <SelectItem value="ALL_CATEGORIES_FILTER_VALUE">All Categories</SelectItem>
            {ALL_PRODUCT_TYPES.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
            </SelectContent>
        </Select>
      </div>

      <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>{user.role === 'admin' ? "Product List & Acquisition History" : "Product List"}</CardTitle>
                <CardDescription>
                    {user.role === 'admin' 
                        ? "Overview of products grouped by name and model. Expand groups to see variants and acquisition history."
                        : "Overview of available products."
                    }
                    {selectedCategoryFilter && ` (Showing: ${selectedCategoryFilter})`}
                </CardDescription>
            </CardHeader>
            <CardContent className="p-0 sm:p-2">
              {productsByGroup.length > 0 ? (
                <Accordion type="multiple" className="w-full">
                  {productsByGroup.map(([groupKey, groupData]) => {
                    const [name, modelName] = groupKey.split('___');
                    const groupDisplayName = `${name}${modelName !== 'no-model' ? ` (${modelName})` : ''}`;

                    return (
                      <AccordionItem value={groupKey} key={groupKey} className="border-b">
                        <AccordionTrigger className="hover:bg-muted/30 data-[state=open]:bg-muted/50 px-2 py-2.5 text-sm rounded-t-md">
                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-[2fr_1.5fr_1fr] gap-x-3 gap-y-1 items-center text-left">
                            <span className="font-semibold text-base truncate">{groupDisplayName}</span>
                            <span className="text-xs text-muted-foreground">{groupData.category}</span>
                            <span className="text-sm font-semibold">
                              Total Stock: {groupData.totalStock}
                              {(groupData.totalStock) > 0 && groupData.totalStock <= 10 && <Badge variant="secondary" className="ml-1.5 text-xs bg-yellow-500 text-black px-1.5 py-0.5">Low</Badge>}
                              {(groupData.totalStock) === 0 && <Badge variant="destructive" className="ml-1.5 text-xs px-1.5 py-0.5">Empty</Badge>}
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-1.5 pt-2 pb-3 bg-muted/20 rounded-b-md">
                           {user.role === 'admin' ? (
                                <Accordion type="multiple" className="w-full pl-4">
                                {groupData.variants.sort((a,b) => (a.flavorName || a.id).localeCompare(b.flavorName || b.id)).map((variant) => (
                                    <AccordionItem value={variant.id} key={variant.id} className="border-b last:border-b-0">
                                    <AccordionTrigger className="hover:bg-muted/40 data-[state=open]:bg-muted/60 px-2 py-2 text-xs rounded-md">
                                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr_1fr_auto] gap-x-3 gap-y-1 items-center text-left">
                                            <span className="font-medium truncate">
                                            {variant.flavorName || "Base Variant"}
                                            </span>
                                            <span className="text-xs">MRP: {formatCurrency(variant.currentSellingPrice)}</span>
                                            <span className="text-xs">Cost: {formatCurrency(variant.currentCostPrice)}</span>
                                            <span className="text-xs font-semibold">
                                                Stock: {variant.currentDisplayStock}
                                            </span>
                                            <div onClick={(e) => e.stopPropagation()}>
                                            <div
                                                    role="button"
                                                    tabIndex={0}
                                                    className={cn(buttonVariants({ variant: "outline", size: "icon" }), "h-7 w-7")}
                                                    onClick={(e) => { e.stopPropagation(); handleOpenEditProductDialog(variant.id); }}
                                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); handleOpenEditProductDialog(variant.id); }}}
                                                    title="Edit Product Details"
                                                >
                                                    <Edit className="h-3.5 w-3.5" />
                                                </div>
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pl-4 pr-1 py-2">
                                        <h4 className="text-xs font-semibold text-muted-foreground mb-1">Acquisition History:</h4>
                                        {variant.acquisitionHistory.length > 0 ? (
                                            <div className="overflow-x-auto">
                                            <Table className="text-xs min-w-[550px]">
                                                <TableHeader>
                                                <TableRow><TableHead className="h-6 px-1.5 py-1">Date</TableHead><TableHead className="h-6 px-1.5 py-1">Condition</TableHead><TableHead className="h-6 px-1.5 py-1">Supplier</TableHead><TableHead className="h-6 px-1.5 py-1 text-center">Qty</TableHead><TableHead className="h-6 px-1.5 py-1 text-right">Cost/U</TableHead><TableHead className="h-6 px-1.5 py-1 text-right">Batch MRP</TableHead><TableHead className="h-6 px-1.5 py-1">Payment</TableHead></TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                {variant.acquisitionHistory.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((batch) => (
                                                    <TableRow key={batch.batchId}><TableCell className="px-1.5 py-1">{format(parseISO(batch.date), 'MMM dd, yy')}</TableCell><TableCell className="px-1.5 py-1">{formatAcquisitionConditionForDisplay(batch.condition)}</TableCell><TableCell className="px-1.5 py-1 truncate max-w-[100px]">{batch.supplierName || 'N/A'}</TableCell><TableCell className="px-1.5 py-1 text-center">{batch.quantityAdded}</TableCell><TableCell className="px-1.5 py-1 text-right">NRP {formatCurrency(batch.costPricePerUnit)}</TableCell><TableCell className="px-1.5 py-1 text-right">NRP {formatCurrency(batch.sellingPricePerUnitAtAcquisition || variant.currentSellingPrice)}</TableCell><TableCell className="px-1.5 py-1">
                                                    <TooltipProvider><Tooltip><TooltipTrigger asChild><Badge variant={batch.dueToSupplier > 0 ? "destructive" : "default"} className={cn(batch.dueToSupplier > 0 ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600", "text-xs cursor-default px-1.5 py-0.5")}>{batch.dueToSupplier > 0 ? "Due" : "Paid"}{(batch.dueToSupplier) > 0 && <AlertCircle className="ml-1 h-2.5 w-2.5"/>}</Badge></TooltipTrigger><TooltipContent side="top" className="text-xs max-w-xs z-50"><p>Method: {batch.paymentMethod}</p><p>Batch Total: NRP {formatCurrency(batch.totalBatchCost)}</p>{batch.paymentMethod === 'Hybrid' && (<><p>Cash: NRP {formatCurrency(batch.cashPaid)}</p><p>Digital: NRP {formatCurrency(batch.digitalPaid)}</p></>)}{batch.dueToSupplier > 0 && <p className="font-semibold">Outstanding: NRP {formatCurrency(batch.dueToSupplier)}</p>}</TooltipContent></Tooltip></TooltipProvider>
                                                    </TableCell></TableRow>
                                                ))}
                                                </TableBody>
                                            </Table>
                                            </div>
                                        ) : (<p className="text-xs text-muted-foreground px-2 py-4 text-center">No acquisition history.</p>)}
                                    </AccordionContent>
                                    </AccordionItem>
                                ))}
                                </Accordion>
                           ) : (
                                <Table className="bg-white">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Flavor/Variant</TableHead>
                                            <TableHead>MRP</TableHead>
                                            <TableHead className="text-center">Stock</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {groupData.variants.sort((a,b) => (a.flavorName || '').localeCompare(b.flavorName || '')).map((variant) => (
                                            <TableRow key={variant.id}>
                                                <TableCell className="pl-4 font-medium">{variant.flavorName || 'Base Variant'}</TableCell>
                                                <TableCell>NRP {formatCurrency(variant.currentSellingPrice)}</TableCell>
                                                <TableCell className="text-center">
                                                    {variant.currentDisplayStock}
                                                    {(variant.currentDisplayStock) > 0 && variant.currentDisplayStock <= 10 && <Badge variant="secondary" className="ml-1.5 text-xs bg-yellow-500 text-black px-1.5 py-0.5">Low</Badge>}
                                                    {(variant.currentDisplayStock) === 0 && <Badge variant="destructive" className="ml-1.5 text-xs px-1.5 py-0.5">Empty</Badge>}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                           )}
                        </AccordionContent>
                      </AccordionItem>
                    )
                  })}
                </Accordion>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    {selectedCategoryFilter ? "No products found matching this category." : "No products found."}
                  </div>
                )}
            </CardContent>
      </Card>
      
      {isAddProductDialogOpen && (
        <AddProductDialog
          isOpen={isAddProductDialogOpen}
          onClose={() => setIsAddProductDialogOpen(false)}
          onConfirmAddMultipleProducts={handleConfirmAddMultipleProducts}
        />
      )}
      {productToEdit && isEditProductDialogOpen && (
        <EditProductDialog
          product={productToEdit}
          isOpen={isEditProductDialogOpen}
          onClose={() => { setIsEditProductDialogOpen(false); setProductToEdit(null); }}
          onConfirmEditProduct={handleConfirmEditProduct}
        />
      )}
      {isHandleExistingProductDialogOpen && productConflictData && (
        <HandleExistingProductDialog
            isOpen={isHandleExistingProductDialogOpen}
            onClose={() => {
                setIsHandleExistingProductDialogOpen(false);
                setProductConflictData(null);
            }}
            existingProduct={productConflictData.existingProduct}
            attemptedProductData={productConflictData.attemptedData}
            onResolve={handleProductConflictResolution}
        />
      )}
    </div>
  );
}
