
"use client";

import { useState, useMemo } from "react";
import { mockProducts, mockLogEntries, mockSales } from "@/lib/data";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit, PlusCircle, PackagePlus, AlertOctagon, Filter, Landmark, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { Product, LogEntry, ProductType, AcquisitionPaymentMethod } from '@/types';
import { ALL_PRODUCT_TYPES } from '@/types';
import AddStockDialog from "@/components/products/AddStockDialog";
import AddProductDialog from "@/components/products/AddProductDialog";
import EditProductDialog from "@/components/products/EditProductDialog";
import HandleExistingProductDialog, { type ResolutionData, type AttemptedProductData } from "@/components/products/HandleExistingProductDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";


export default function ProductsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentProducts, setCurrentProducts] = useState<Product[]>(() => [...mockProducts].sort((a,b) => a.name.localeCompare(b.name)));
  const [productToRestock, setProductToRestock] = useState<Product | null>(null);
  const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [isEditProductDialogOpen, setIsEditProductDialogOpen] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<ProductType | ''>('');

  // State for handling product name conflicts
  const [productConflictData, setProductConflictData] = useState<{ existingProduct: Product; attemptedData: AttemptedProductData } | null>(null);
  const [isHandleExistingProductDialogOpen, setIsHandleExistingProductDialogOpen] = useState(false);


  const addLog = (action: string, details: string) => {
    if (!user) return;
    const newLog: LogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      user: user.name,
      action,
      details,
    };
    mockLogEntries.unshift(newLog);
    mockLogEntries.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const calculatedSoldQuantities = useMemo(() => {
    const salesMap = new Map<string, number>();
    mockSales.forEach(sale => {
      sale.items.forEach(item => {
        salesMap.set(item.productId, (salesMap.get(item.productId) || 0) + item.quantity);
      });
    });
    return salesMap;
  }, [mockSales, currentProducts]); 

  const displayedProducts = useMemo(() => {
    return currentProducts
      .filter(product => selectedCategoryFilter === '' || product.category === selectedCategoryFilter);
  }, [currentProducts, selectedCategoryFilter]);

  const handleOpenEditProductDialog = (productId: string) => {
    const product = currentProducts.find(p => p.id === productId);
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
    if (productIndexGlobal !== -1) {
      const originalProduct = mockProducts[productIndexGlobal];
      
      if (updatedDetails.name.toLowerCase() !== originalProduct.name.toLowerCase()) {
        const existingProductWithNewName = mockProducts.find(p => p.name.toLowerCase() === updatedDetails.name.toLowerCase() && p.id !== updatedDetails.id);
        if (existingProductWithNewName) {
          toast({ title: "Name Conflict", description: `Another product already exists with the name '${updatedDetails.name}'. Please choose a different name.`, variant: "destructive" });
          return;
        }
      }

      const updatedProduct = {
        ...originalProduct,
        name: updatedDetails.name,
        category: updatedDetails.category,
        sellingPrice: updatedDetails.sellingPrice,
        costPrice: updatedDetails.costPrice,
      };
      mockProducts[productIndexGlobal] = updatedProduct;
      
      setCurrentProducts(prev =>
        [...mockProducts].sort((a,b) => a.name.localeCompare(b.name))
      );

      addLog("Product Details Updated", `Details for product '${updatedProduct.name}' (ID: ${updatedProduct.id.substring(0,8)}...) updated by ${user?.name || 'N/A'}. Name: ${updatedProduct.name}, Category: ${updatedProduct.category}, Cost: ${updatedProduct.costPrice.toFixed(2)}, Selling: ${updatedProduct.sellingPrice.toFixed(2)}.`);
      toast({
        title: "Product Updated",
        description: `Details for ${updatedProduct.name} have been successfully updated.`,
      });
    } else {
      toast({ title: "Error", description: "Could not find product to update.", variant: "destructive"});
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

    const newProduct: Product = {
      id: `prod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: newProductData.name,
      category: newProductData.category,
      sellingPrice: newProductData.sellingPrice,
      costPrice: newProductData.costPrice,
      totalAcquiredStock: newProductData.totalAcquiredStock,
      stock: newProductData.totalAcquiredStock,
      damagedQuantity: 0,
      testerQuantity: 0, 
      lastAcquisitionPaymentMethod: newProductData.acquisitionPaymentDetails.method,
      lastAcquisitionTotalCost: newProductData.acquisitionPaymentDetails.totalAcquisitionCost,
      lastAcquisitionCashPaid: newProductData.acquisitionPaymentDetails.cashPaid,
      lastAcquisitionDigitalPaid: newProductData.acquisitionPaymentDetails.digitalPaid,
      lastAcquisitionDueToSupplier: newProductData.acquisitionPaymentDetails.dueAmount,
    };
    
    mockProducts.push(newProduct);
    setCurrentProducts(prevProducts => [...mockProducts].sort((a,b) => a.name.localeCompare(b.name)));

    let logDetails = `Product '${newProduct.name}' (ID: ${newProduct.id.substring(0,8)}...) added by ${user?.name || 'N/A'}. Category: ${newProduct.category}, Cost: NRP ${newProduct.costPrice.toFixed(2)}, Selling: NRP ${newProduct.sellingPrice.toFixed(2)}, Initial Stock: ${newProduct.totalAcquiredStock}.`;
    if (newProductData.supplierName) {
      logDetails += ` Supplier: ${newProductData.supplierName}.`;
    }
    if (newProductData.acquisitionPaymentDetails.totalAcquisitionCost > 0 && newProductData.totalAcquiredStock > 0) {
      const { method, cashPaid, digitalPaid, dueAmount, totalAcquisitionCost } = newProductData.acquisitionPaymentDetails;
      logDetails += ` Acquired batch for NRP ${totalAcquisitionCost.toFixed(2)} via ${method}.`;
      if (method === 'Hybrid') {
        logDetails += ` (Cash: NRP ${cashPaid.toFixed(2)}, Digital: NRP ${digitalPaid.toFixed(2)}, Due: NRP ${dueAmount.toFixed(2)})`;
      } else if (method === 'Due') {
        logDetails += ` (Due: NRP ${dueAmount.toFixed(2)})`;
      }
    }
    
    addLog("Product Added", logDetails);
    toast({
      title: "Product Added",
      description: `${newProduct.name} has been successfully added to the inventory.`,
    });
    setIsAddProductDialogOpen(false);
  };
  
  const handleProductConflictResolution = (resolutionData: ResolutionData) => {
    const productIndex = mockProducts.findIndex(p => p.id === resolutionData.existingProductId);
    if (productIndex === -1) {
      toast({ title: "Error", description: "Could not find existing product to update.", variant: "destructive" });
      setIsHandleExistingProductDialogOpen(false);
      return;
    }

    const productToUpdate = { ...mockProducts[productIndex] }; 
    let logAction = "Product Restocked";
    let logDetails = `Product '${productToUpdate.name}' (ID: ${productToUpdate.id.substring(0,8)}...) restocked by ${user?.name || 'N/A'}. `;

    if (resolutionData.quantityAdded > 0) {
        productToUpdate.stock += resolutionData.quantityAdded;
        productToUpdate.totalAcquiredStock += resolutionData.quantityAdded;
        logDetails += `Quantity Added: ${resolutionData.quantityAdded}. New Stock: ${productToUpdate.stock}. `;
    } else {
        logDetails += `No new stock added. `;
    }

    const { paymentDetails } = resolutionData;
    const costForThisBatch = paymentDetails.totalAcquisitionCost / (resolutionData.quantityAdded || 1); 

    if (resolutionData.condition === 'condition1') {
      logAction = "Restock (Same Supplier/Price)";
      logDetails += `Using existing cost price: NRP ${productToUpdate.costPrice.toFixed(2)}. `;
    } else if (resolutionData.condition === 'condition2') {
      logAction = "Restock (Same Supplier, New Price)";
      productToUpdate.costPrice = resolutionData.newCostPrice;
      productToUpdate.sellingPrice = resolutionData.newSellingPrice;
      logDetails += `Prices updated - New Cost: NRP ${resolutionData.newCostPrice.toFixed(2)}, New MRP: NRP ${resolutionData.newSellingPrice.toFixed(2)}. `;
    } else if (resolutionData.condition === 'condition3') {
      logAction = "Restock (New Supplier)";
      logDetails += `New Supplier: ${resolutionData.newSupplierName}. Using existing product cost price for this batch: NRP ${productToUpdate.costPrice.toFixed(2)}. `;
    }

    if (paymentDetails.totalAcquisitionCost > 0 && resolutionData.quantityAdded > 0) {
        logDetails += `Batch acquisition cost: NRP ${paymentDetails.totalAcquisitionCost.toFixed(2)} (NRP ${costForThisBatch.toFixed(2)}/unit). Paid via ${paymentDetails.method}.`;
        if (paymentDetails.method === 'Hybrid') {
            logDetails += ` (Cash: NRP ${paymentDetails.cashPaid.toFixed(2)}, Digital: NRP ${paymentDetails.digitalPaid.toFixed(2)}, Due: NRP ${paymentDetails.dueAmount.toFixed(2)})`;
        } else if (paymentDetails.method === 'Due') {
            logDetails += ` (Due: NRP ${paymentDetails.dueAmount.toFixed(2)})`;
        }
    } else if (resolutionData.quantityAdded > 0) {
        logDetails += `Batch acquired with no cost recorded.`;
    }
    
    productToUpdate.lastAcquisitionPaymentMethod = paymentDetails.method;
    productToUpdate.lastAcquisitionTotalCost = paymentDetails.totalAcquisitionCost;
    productToUpdate.lastAcquisitionCashPaid = paymentDetails.cashPaid;
    productToUpdate.lastAcquisitionDigitalPaid = paymentDetails.digitalPaid;
    productToUpdate.lastAcquisitionDueToSupplier = paymentDetails.dueAmount;

    mockProducts[productIndex] = productToUpdate;
    setCurrentProducts([...mockProducts].sort((a,b) => a.name.localeCompare(b.name)));
    
    addLog(logAction, logDetails);
    toast({ title: "Product Update Successful", description: `${productToUpdate.name} has been updated.` });
    setIsHandleExistingProductDialogOpen(false);
    setProductConflictData(null);
  };


  const handleOpenAddStockDialog = (product: Product) => {
    setProductToRestock(product);
  };

  const handleConfirmAddStock = (productId: string, quantityToAdd: number) => {
    const productIndexGlobal = mockProducts.findIndex(p => p.id === productId);
    if (productIndexGlobal === -1) {
        toast({ title: "Error", description: "Product not found to add stock.", variant: "destructive" });
        return;
    }

    const product = mockProducts[productIndexGlobal];
    const newStockLevel = product.stock + quantityToAdd;
    const newTotalAcquiredStock = product.totalAcquiredStock + quantityToAdd;

    mockProducts[productIndexGlobal].stock = newStockLevel;
    mockProducts[productIndexGlobal].totalAcquiredStock = newTotalAcquiredStock;
    
    // For quick add, assume it was a cash purchase and fully paid for simplicity or mark as unknown
    mockProducts[productIndexGlobal].lastAcquisitionPaymentMethod = 'Cash'; // Or undefined
    mockProducts[productIndexGlobal].lastAcquisitionTotalCost = product.costPrice * quantityToAdd; // Estimate
    mockProducts[productIndexGlobal].lastAcquisitionCashPaid = product.costPrice * quantityToAdd;
    mockProducts[productIndexGlobal].lastAcquisitionDigitalPaid = 0;
    mockProducts[productIndexGlobal].lastAcquisitionDueToSupplier = 0;


    setCurrentProducts(prevProducts =>
      [...mockProducts].sort((a, b) => a.name.localeCompare(b.name))
    );
    
    addLog("Product Stock Added (Quick Add)", `${quantityToAdd} units of stock added to product '${product.name}' (ID: ${productId.substring(0,8)}...) by ${user?.name || 'N/A'}. New Remaining Stock: ${newStockLevel}, New Total Acquired: ${newTotalAcquiredStock}. Cost not specified in this quick add.`);
    toast({
      title: "Stock Added",
      description: `${quantityToAdd} units added to ${product.name}. New Remaining Stock: ${newStockLevel}.`
    });
    setProductToRestock(null);
  };

  const getLastAcquisitionStatus = (product: Product): { badgeText: string; badgeVariant: "default" | "destructive" | "secondary"; tooltipContent: string } => {
    const method = product.lastAcquisitionPaymentMethod;
    const due = product.lastAcquisitionDueToSupplier ?? 0;
    const totalCost = product.lastAcquisitionTotalCost ?? 0;
    const cashPaid = product.lastAcquisitionCashPaid ?? 0;
    const digitalPaid = product.lastAcquisitionDigitalPaid ?? 0;

    let badgeText = "N/A";
    let badgeVariant: "default" | "destructive" | "secondary" = "secondary";
    let tooltipContent = "Last acquisition payment details not available.";

    if (method) { // Only proceed if payment method exists
        if (due > 0) {
            badgeText = "Due";
            badgeVariant = "destructive";
            if (method === 'Hybrid') {
                 tooltipContent = `Paid via Hybrid (Cash: NRP ${cashPaid.toFixed(2)}, Digital: NRP ${digitalPaid.toFixed(2)}, Due: NRP ${due.toFixed(2)}). Batch Cost: NRP ${totalCost.toFixed(2)}.`;
            } else { // Assumed 'Due' method
                tooltipContent = `Paid via Due. Outstanding: NRP ${due.toFixed(2)}. Batch Cost: NRP ${totalCost.toFixed(2)}.`;
            }
        } else { // No due amount
            badgeText = "Paid";
            badgeVariant = "default";
            if (method === 'Hybrid') {
                tooltipContent = `Paid via Hybrid (Cash: NRP ${cashPaid.toFixed(2)}, Digital: NRP ${digitalPaid.toFixed(2)}). Batch Cost: NRP ${totalCost.toFixed(2)}.`;
            } else {
                tooltipContent = `Paid via ${method}. Batch Cost: NRP ${totalCost.toFixed(2)}.`;
            }
        }
    }
    
    return { badgeText, badgeVariant, tooltipContent };
  };


  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">Product Management</h1>
        {user.role === 'admin' && (
          <Button onClick={handleAddNewProductClick}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Product
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
          <CardTitle>Product Inventory Overview</CardTitle>
          <CardDescription>Detailed list of products, stock levels, and related data. {selectedCategoryFilter && `(Showing: ${selectedCategoryFilter})`}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Cost Price</TableHead>
                <TableHead>MRP</TableHead>
                <TableHead>Total Stock</TableHead>
                <TableHead>Remaining</TableHead>
                <TableHead>Stock Status</TableHead>
                <TableHead>Last Batch Pmt.</TableHead>
                {user.role === 'admin' && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedProducts.map((product) => {
                const { badgeText, badgeVariant, tooltipContent } = getLastAcquisitionStatus(product);
                return (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>NRP {product.costPrice.toFixed(2)}</TableCell>
                    <TableCell>NRP {product.sellingPrice.toFixed(2)}</TableCell>
                    <TableCell>{product.totalAcquiredStock}</TableCell>
                    <TableCell>{product.stock}</TableCell>
                    <TableCell>
                      <Badge variant={product.stock > 10 ? 'default' : (product.stock > 0 ? 'secondary' : 'destructive')}
                            className={cn(
                                product.stock > 10 ? 'bg-green-500 hover:bg-green-600' : 
                                (product.stock > 0 ? 'bg-yellow-500 hover:bg-yellow-600 text-black' : 
                                'bg-red-500 hover:bg-red-600'),
                                "text-xs"
                                )}>
                        {product.stock > 10 ? 'In Stock' : (product.stock > 0 ? 'Low Stock' : 'Out of Stock')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                       <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge variant={badgeVariant} className={cn(
                                badgeVariant === "default" ? "bg-green-500 hover:bg-green-600" :
                                badgeVariant === "destructive" ? "bg-red-500 hover:bg-red-600" :
                                "bg-slate-500 hover:bg-slate-600",
                                "text-xs cursor-default"
                            )}>
                              {badgeText}
                               {(product.lastAcquisitionDueToSupplier ?? 0) > 0 && (
                                <AlertTriangle className="ml-1 h-3 w-3" />
                              )}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs whitespace-pre-wrap">{tooltipContent}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    {user.role === 'admin' && (
                      <TableCell className="text-right space-x-1">
                        <Button variant="outline" size="icon" onClick={() => handleOpenAddStockDialog(product)} title="Add Stock (Quick)">
                          <PackagePlus className="h-4 w-4" />
                          <span className="sr-only">Add Stock (Quick)</span>
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => handleOpenEditProductDialog(product.id)} title="Edit Product">
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit Product</span>
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {displayedProducts.length === 0 && (
             <div className="text-center py-8 text-muted-foreground">
              {selectedCategoryFilter ? "No products found matching this category." : "No products found."}
            </div>
          )}
        </CardContent>
      </Card>
      {productToRestock && (
        <AddStockDialog
          product={productToRestock}
          isOpen={!!productToRestock}
          onClose={() => setProductToRestock(null)}
          onConfirmAddStock={handleConfirmAddStock}
        />
      )}
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

    
