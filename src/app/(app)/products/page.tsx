
"use client";

import { useState, useMemo, useEffect } from "react";
import { mockProducts, mockLogEntries, mockSales } from "@/lib/data"; 
import { useAuthStore } from "@/stores/authStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button, buttonVariants } from "@/components/ui/button";
import { Edit, PlusCircle, Filter, InfoIcon, PackageSearch, AlertCircle, ChevronsUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { Product, LogEntry, ProductType, AcquisitionPaymentMethod, AcquisitionBatch, ResolutionData, AttemptedProductData } from '@/types'; // Removed Sale
import { ALL_PRODUCT_TYPES } from '@/types';
import AddProductDialog from "@/components/products/AddProductDialog";
import EditProductDialog from "@/components/products/EditProductDialog";
import HandleExistingProductDialog from "@/components/products/HandleExistingProductDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { format, parseISO } from 'date-fns';
import { cn } from "@/lib/utils";
import { calculateCurrentStock } from "@/lib/productUtils";
import { addLogEntry as globalAddLog } from "@/lib/data"; // Use the updated addLogEntry


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

  const displayedProducts = useMemo(() => {
    return productsWithCalculatedStock
      .filter(product => selectedCategoryFilter === '' || product.category === selectedCategoryFilter);
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
    category: ProductType;
    sellingPrice: number;
    costPrice: number;
  }) => {
    const productIndexGlobal = mockProducts.findIndex(p => p.id === updatedDetails.id);
    if (productIndexGlobal !== -1 && user) {
      const originalProduct = mockProducts[productIndexGlobal];
      
      if (updatedDetails.name.toLowerCase() !== originalProduct.name.toLowerCase()) {
        const existingProductWithNewName = mockProducts.find(p => p.name.toLowerCase() === updatedDetails.name.toLowerCase() && p.id !== updatedDetails.id);
        if (existingProductWithNewName) {
          toast({ title: "Name Conflict", description: `Another product already exists with the name '${updatedDetails.name}'. Please choose a different name.`, variant: "destructive" });
          return;
        }
      }

      mockProducts[productIndexGlobal].name = updatedDetails.name;
      mockProducts[productIndexGlobal].category = updatedDetails.category;
      mockProducts[productIndexGlobal].currentSellingPrice = updatedDetails.sellingPrice;
      mockProducts[productIndexGlobal].currentCostPrice = updatedDetails.costPrice;
      
      setRefreshTrigger(prev => prev + 1);

      addLog("Product Details Updated", `Details for product '${updatedDetails.name}' (ID: ${updatedDetails.id.substring(0,8)}...) updated by ${user.name}. Name: ${updatedDetails.name}, Cat: ${updatedDetails.category}, Cost: ${updatedDetails.costPrice.toFixed(2)}, MRP: ${updatedDetails.sellingPrice.toFixed(2)}.`);
      toast({
        title: "Product Updated",
        description: `Details for ${updatedDetails.name} have been successfully updated.`,
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

  const handleConfirmAddProduct = (newProductData: {
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
  }) => {
    if (!user) {
       toast({ title: "Error", description: "User not available.", variant: "destructive"});
       return;
    }
    const existingProductByName = mockProducts.find(p => p.name.toLowerCase() === newProductData.name.toLowerCase());

    if (existingProductByName) {
      setProductConflictData({
        existingProduct: existingProductByName,
        attemptedData: {
            name: newProductData.name,
            category: newProductData.category,
            sellingPrice: newProductData.sellingPrice,
            costPrice: newProductData.costPrice,
            totalAcquiredStock: newProductData.totalAcquiredStock 
        }
      });
      setIsHandleExistingProductDialogOpen(true);
      setIsAddProductDialogOpen(false); 
      return; 
    }

    const newProductId = `prod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const firstBatch: AcquisitionBatch = {
      batchId: `batch-${newProductId}-${Date.now()}`,
      date: new Date().toISOString(),
      condition: "Product Added", 
      supplierName: newProductData.supplierName,
      quantityAdded: newProductData.totalAcquiredStock,
      costPricePerUnit: newProductData.costPrice,
      sellingPricePerUnitAtAcquisition: newProductData.sellingPrice,
      paymentMethod: newProductData.acquisitionPaymentDetails.method,
      totalBatchCost: newProductData.acquisitionPaymentDetails.totalAcquisitionCost,
      cashPaid: newProductData.acquisitionPaymentDetails.cashPaid,
      digitalPaid: newProductData.acquisitionPaymentDetails.digitalPaid,
      dueToSupplier: newProductData.acquisitionPaymentDetails.dueAmount,
    };

    const newProduct: Product = {
      id: newProductId,
      name: newProductData.name,
      category: newProductData.category,
      currentSellingPrice: newProductData.sellingPrice,
      currentCostPrice: newProductData.costPrice,
      acquisitionHistory: [firstBatch],
      damagedQuantity: 0,
      testerQuantity: 0, 
    };
    
    mockProducts.push(newProduct);
    setRefreshTrigger(prev => prev + 1);

    let logDetails = `Product '${newProduct.name}' added by ${user.name}. Current Cost: NRP ${newProduct.currentCostPrice.toFixed(2)}, Current MRP: NRP ${newProduct.currentSellingPrice.toFixed(2)}. Initial Batch Qty: ${newProductData.totalAcquiredStock}.`;
    if (newProductData.supplierName) logDetails += ` Supplier: ${newProductData.supplierName}.`;
    if (firstBatch.totalBatchCost > 0) {
      logDetails += ` Batch Cost: NRP ${firstBatch.totalBatchCost.toFixed(2)} via ${firstBatch.paymentMethod}.`;
      if (firstBatch.paymentMethod === 'Hybrid') {
        logDetails += ` (Cash: ${firstBatch.cashPaid.toFixed(2)}, Digital: ${firstBatch.digitalPaid.toFixed(2)}, Due: ${firstBatch.dueToSupplier.toFixed(2)})`;
      } else if (firstBatch.paymentMethod === 'Due') {
        logDetails += ` (Due: ${firstBatch.dueToSupplier.toFixed(2)})`;
      }
    }
    addLog("Product Added", logDetails);
    toast({ title: "Product Added", description: `${newProduct.name} successfully added.`});
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
    let logDetails = `Product '${productToUpdate.name}' restocked by ${user.name}. `;
    
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
      logDetails += `Using existing cost: NRP ${productToUpdate.currentCostPrice.toFixed(2)}. `;
      logAction = newBatch.condition;
    } else if (resolutionData.condition === 'condition2') { 
      newBatch.condition = "Restock (Same Supplier, New Price)";
      productToUpdate.currentCostPrice = costPriceFromDialog!;
      productToUpdate.currentSellingPrice = sellingPriceFromDialog!;
      newBatch.costPricePerUnit = costPriceFromDialog!; 
      newBatch.sellingPricePerUnitAtAcquisition = sellingPriceFromDialog!;
      logDetails += `Prices updated - New Current Cost: NRP ${costPriceFromDialog!.toFixed(2)}, New Current MRP: NRP ${sellingPriceFromDialog!.toFixed(2)}. Batch Cost: NRP ${costPriceFromDialog!.toFixed(2)}. `;
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
          logDetails += `Prices updated - New Current Cost: NRP ${costPriceFromDialog.toFixed(2)}, New Current MRP: NRP ${sellingPriceFromDialog.toFixed(2)}. `;
      } else {
          newBatch.costPricePerUnit = productToUpdate.currentCostPrice;
          newBatch.sellingPricePerUnitAtAcquisition = productToUpdate.currentSellingPrice;
      }
      logDetails += `New Supplier: ${resolutionData.newSupplierName}. Batch Cost: NRP ${newBatch.costPricePerUnit.toFixed(2)}. `;
      if (!mainPricesUpdated) {
          logDetails += `Main product prices remain unchanged. `;
      }
      logAction = newBatch.condition;
    }
    
    if (newBatch.totalBatchCost > 0 && newBatch.quantityAdded > 0) {
        logDetails += `Batch Total Cost: NRP ${newBatch.totalBatchCost.toFixed(2)} via ${newBatch.paymentMethod}.`;
        if (newBatch.paymentMethod === 'Hybrid') {
            logDetails += ` (Cash: ${newBatch.cashPaid.toFixed(2)}, Digital: ${newBatch.digitalPaid.toFixed(2)}, Due: ${newBatch.dueToSupplier.toFixed(2)})`;
        } else if (newBatch.paymentMethod === 'Due') {
            logDetails += ` (Due: ${newBatch.dueToSupplier.toFixed(2)})`;
        }
    }
    
    productToUpdate.acquisitionHistory.push(newBatch);
    setRefreshTrigger(prev => prev + 1);
    
    addLog(logAction, logDetails);
    toast({ title: "Product Update Successful", description: `${productToUpdate.name} has been updated.` });
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
        {user.role === 'admin' ? (
            <>
            <CardHeader>
                <CardTitle>Product List &amp; Acquisition History</CardTitle>
                <CardDescription>
                    Overview of products. Expand <ChevronsUpDown className="inline-block h-3 w-3 text-muted-foreground mx-0.5"/> to see acquisition history and edit options.
                    {selectedCategoryFilter && ` (Showing: ${selectedCategoryFilter})`}
                </CardDescription>
            </CardHeader>
            <CardContent className="p-0 sm:p-2">
            {displayedProducts.length > 0 ? (
                <Accordion type="multiple" className="w-full">
                {displayedProducts.map((product) => (
                    <AccordionItem value={product.id} key={product.id} className="border-b">
                    <AccordionTrigger className="hover:bg-muted/30 data-[state=open]:bg-muted/50 px-2 py-2.5 text-sm rounded-t-md">
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-[auto_2fr_1.5fr_1fr_1fr_1fr_auto] gap-x-3 gap-y-1 items-center text-left">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <InfoIcon className="h-3.5 w-3.5 text-muted-foreground mr-1.5 inline-block cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-xs max-w-xs z-50">
                                    <p className="font-semibold">Last Acquisition Details:</p>
                                    <p>Condition: {formatAcquisitionConditionForDisplay(product.acquisitionHistory.at(-1)?.condition)}</p>
                                    <p>Supplier: {product.acquisitionHistory.at(-1)?.supplierName || 'N/A'}</p>
                                    <p>Batch Qty: {product.acquisitionHistory.at(-1)?.quantityAdded}</p>
                                    <p>Batch Cost: NRP {(product.acquisitionHistory.at(-1)?.costPricePerUnit || 0).toFixed(2)}</p>
                                    <p>Batch MRP: NRP {(product.acquisitionHistory.at(-1)?.sellingPricePerUnitAtAcquisition || product.currentSellingPrice).toFixed(2)}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        <span className="font-medium truncate col-span-full sm:col-span-1">
                            {product.name}
                        </span>
                        <span className="text-xs text-muted-foreground ">{product.category}</span>
                        <span className="text-xs">MRP: {product.currentSellingPrice.toFixed(2)}</span>
                        <span className="text-xs">Cost: {product.currentCostPrice.toFixed(2)}</span>
                        <span className="text-xs font-semibold">
                            Stock: {product.currentDisplayStock}
                            {(product.currentDisplayStock) > 0 && product.currentDisplayStock <= 10 && <Badge variant="secondary" className="ml-1.5 text-xs bg-yellow-500 text-black px-1.5 py-0.5">Low</Badge>}
                            {(product.currentDisplayStock) === 0 && <Badge variant="destructive" className="ml-1.5 text-xs px-1.5 py-0.5">Empty</Badge>}
                        </span>
                        {user.role === 'admin' && (
                            <div 
                                className="justify-self-end sm:justify-self-auto hidden sm:block"
                                onClick={(e) => e.stopPropagation()} 
                            > 
                                <div
                                role="button"
                                tabIndex={0}
                                className={cn(
                                    buttonVariants({ variant: "outline", size: "icon" }),
                                    "h-7 w-7"
                                )}
                                onClick={(e) => {
                                    e.stopPropagation(); 
                                    handleOpenEditProductDialog(product.id);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleOpenEditProductDialog(product.id);
                                    }
                                }}
                                title="Edit Product Details"
                                >
                                    <Edit className="h-3.5 w-3.5" />
                                </div>
                            </div>
                        )}
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-1.5 pt-2 pb-3 bg-muted/20 rounded-b-md">
                        <div className="flex justify-between items-center mb-1.5 px-2">
                            <h4 className="text-xs font-semibold text-muted-foreground">Acquisition History ({product.acquisitionHistory.length} batches):</h4>
                            {user.role === 'admin' && (
                                <div
                                    role="button"
                                    tabIndex={0}
                                    className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-7 sm:hidden")}
                                    onClick={() => {
                                        handleOpenEditProductDialog(product.id);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        handleOpenEditProductDialog(product.id);
                                        }
                                    }}
                                    title="Edit Product Details"
                                >
                                    <Edit className="mr-1.5 h-3.5 w-3.5" /> Edit Main
                                </div>
                            )}
                        </div>
                        {product.acquisitionHistory.length > 0 ? (
                        <div className="overflow-x-auto">
                            <Table className="text-xs min-w-[600px]">
                                <TableHeader>
                                <TableRow>
                                    <TableHead className="h-7 px-2 py-1">Date</TableHead>
                                    <TableHead className="h-7 px-2 py-1">Condition</TableHead>
                                    <TableHead className="h-7 px-2 py-1">Supplier</TableHead>
                                    <TableHead className="h-7 px-2 py-1 text-center">Qty</TableHead>
                                    <TableHead className="h-7 px-2 py-1 text-right">Cost/U</TableHead>
                                    <TableHead className="h-7 px-2 py-1 text-right">Batch MRP</TableHead>
                                    <TableHead className="h-7 px-2 py-1">Payment</TableHead>
                                </TableRow>
                                </TableHeader>
                                <TableBody>
                                {product.acquisitionHistory.slice().sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((batch) => (
                                    <TableRow key={batch.batchId}>
                                    <TableCell className="px-2 py-1">{format(parseISO(batch.date), 'MMM dd, yy')}</TableCell>
                                    <TableCell className="px-2 py-1">{formatAcquisitionConditionForDisplay(batch.condition)}</TableCell>
                                    <TableCell className="px-2 py-1 truncate max-w-[100px]">{batch.supplierName || 'N/A'}</TableCell>
                                    <TableCell className="px-2 py-1 text-center">{batch.quantityAdded}</TableCell>
                                    <TableCell className="px-2 py-1 text-right">NRP {batch.costPricePerUnit.toFixed(2)}</TableCell>
                                    <TableCell className="px-2 py-1 text-right">NRP {(batch.sellingPricePerUnitAtAcquisition || product.currentSellingPrice).toFixed(2)}</TableCell>
                                    <TableCell className="px-2 py-1">
                                        <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                            <Badge 
                                                variant={batch.dueToSupplier > 0 ? "destructive" : "default"}
                                                className={cn(
                                                    batch.dueToSupplier > 0 ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600",
                                                    "text-xs cursor-default px-1.5 py-0.5"
                                                )}
                                            >
                                                {batch.dueToSupplier > 0 ? "Due" : "Paid"}
                                                {(batch.dueToSupplier) > 0 && <AlertCircle className="ml-1 h-2.5 w-2.5"/>}
                                            </Badge>
                                            </TooltipTrigger>
                                            <TooltipContent side="top" className="text-xs max-w-xs z-50">
                                            <p>Method: {batch.paymentMethod}</p>
                                            <p>Batch Total: NRP {batch.totalBatchCost.toFixed(2)}</p>
                                            {batch.paymentMethod === 'Hybrid' && (
                                                <>
                                                <p>Cash: NRP {batch.cashPaid.toFixed(2)}</p>
                                                <p>Digital: NRP {batch.digitalPaid.toFixed(2)}</p>
                                                </>
                                            )}
                                            {batch.dueToSupplier > 0 && <p className="font-semibold">Outstanding: NRP {batch.dueToSupplier.toFixed(2)}</p>}
                                            </TooltipContent>
                                        </Tooltip>
                                        </TooltipProvider>
                                    </TableCell>
                                    </TableRow>
                                ))}
                                </TableBody>
                            </Table>
                        </div>
                        ) : (
                        <p className="text-xs text-muted-foreground px-2 py-4 text-center">No acquisition history recorded for this product.</p>
                        )}
                    </AccordionContent>
                    </AccordionItem>
                ))}
                </Accordion>
            ) : (
                <div className="text-center py-8 text-muted-foreground">
                {selectedCategoryFilter ? "No products found matching this category." : "No products found."}
                </div>
            )}
            </CardContent>
            </>
        ) : ( 
            <>
            <CardHeader>
                <CardTitle>Product List</CardTitle>
                <CardDescription>
                    Overview of available products.
                    {selectedCategoryFilter && ` (Showing: ${selectedCategoryFilter})`}
                </CardDescription>
            </CardHeader>
            <CardContent className="p-0 sm:p-2">
                {displayedProducts.length > 0 ? (
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Product Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>MRP</TableHead>
                        <TableHead className="text-center">Stock</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {displayedProducts.map((product) => (
                        <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.category}</TableCell>
                        <TableCell>NRP {product.currentSellingPrice.toFixed(2)}</TableCell>
                        <TableCell className="text-center">
                            {product.currentDisplayStock}
                            {(product.currentDisplayStock) > 0 && product.currentDisplayStock <= 10 && <Badge variant="secondary" className="ml-1.5 text-xs bg-yellow-500 text-black px-1.5 py-0.5">Low</Badge>}
                            {(product.currentDisplayStock) === 0 && <Badge variant="destructive" className="ml-1.5 text-xs px-1.5 py-0.5">Empty</Badge>}
                        </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
                ) : (
                <div className="text-center py-8 text-muted-foreground">
                    {selectedCategoryFilter ? "No products found matching this category." : "No products found."}
                </div>
                )}
            </CardContent>
            </>
        )}
      </Card>
      
      {isAddProductDialogOpen && (
        <AddProductDialog
          isOpen={isAddProductDialogOpen}
          onClose={() => setIsAddProductDialogOpen(false)}
          onConfirmAddProduct={handleConfirmAddProduct}
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
