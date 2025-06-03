
"use client";

import { useState, useMemo } from "react";
import { mockProducts, mockLogEntries, mockSales } from "@/lib/data";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit, PlusCircle, PackagePlus, AlertOctagon, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { Product, LogEntry, ProductType } from '@/types';
import { ALL_PRODUCT_TYPES } from '@/types';
import AddStockDialog from "@/components/products/AddStockDialog";
import AddProductDialog from "@/components/products/AddProductDialog"; 
import EditProductDialog from "@/components/products/EditProductDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export default function ProductsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentProducts, setCurrentProducts] = useState<Product[]>(() => mockProducts.sort((a,b) => a.name.localeCompare(b.name)));
  const [productToRestock, setProductToRestock] = useState<Product | null>(null);
  const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [isEditProductDialogOpen, setIsEditProductDialogOpen] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<ProductType | ''>('');

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
  }, [mockSales]); // Added mockSales to dependency array

  const displayedProducts = useMemo(() => {
    return currentProducts
      .filter(product => selectedCategoryFilter === '' || product.category === selectedCategoryFilter);
      // Products in currentProducts are already sorted by name.
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
      const updatedProduct = {
        ...originalProduct, 
        name: updatedDetails.name,
        category: updatedDetails.category,
        sellingPrice: updatedDetails.sellingPrice,
        costPrice: updatedDetails.costPrice,
      };
      mockProducts[productIndexGlobal] = updatedProduct;
      
      setCurrentProducts(prev => 
        prev.map(p => p.id === updatedDetails.id ? updatedProduct : p).sort((a,b) => a.name.localeCompare(b.name))
      );

      addLog("Product Details Updated", `Details for product '${updatedProduct.name}' (ID: ${updatedProduct.id.substring(0,8)}...) updated. Name: ${updatedProduct.name}, Category: ${updatedProduct.category}, Cost: ${updatedProduct.costPrice.toFixed(2)}, Selling: ${updatedProduct.sellingPrice.toFixed(2)}.`);
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
  }) => {
    const newProduct: Product = {
      id: `prod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: newProductData.name,
      category: newProductData.category,
      sellingPrice: newProductData.sellingPrice,
      costPrice: newProductData.costPrice,
      totalAcquiredStock: newProductData.totalAcquiredStock,
      stock: newProductData.totalAcquiredStock, 
      damagedQuantity: 0,
    };
    
    mockProducts.push(newProduct);
    setCurrentProducts(prevProducts => [...prevProducts, newProduct].sort((a,b) => a.name.localeCompare(b.name)));

    addLog("Product Added", `Product '${newProduct.name}' (ID: ${newProduct.id.substring(0,8)}...) added. Category: ${newProduct.category}, Cost: NRP ${newProduct.costPrice.toFixed(2)}, Selling Price: NRP ${newProduct.sellingPrice.toFixed(2)}, Initial Stock: ${newProduct.totalAcquiredStock}.`);
    toast({
      title: "Product Added",
      description: `${newProduct.name} has been successfully added to the inventory.`,
    });
  };
  
  const handleDamageChange = (productId: string, value: number | string) => {
    const productIndexGlobal = mockProducts.findIndex(p => p.id === productId);
    if (productIndexGlobal === -1 || !user) {
        toast({ title: "Error", description: "Product not found or user not available.", variant: "destructive" });
        return;
    }

    const productBeforeChange = { ...mockProducts[productIndexGlobal] }; // Important: shallow copy for comparison

    let damageToSet: number;
    if (value === "") {
        damageToSet = 0;
    } else if (typeof value === 'number' && !isNaN(value)) {
        damageToSet = Math.max(0, value);
    } else {
        const parsedValue = parseInt(String(value), 10);
        if (!isNaN(parsedValue)) {
            damageToSet = Math.max(0, parsedValue);
        } else {
            toast({ title: "Invalid Damage Qty", description: "Please enter a valid number for damage.", variant: "destructive" });
            // Potentially revert UI input to productBeforeChange.damagedQuantity if input is controlled directly
            return;
        }
    }

    if (productBeforeChange.damagedQuantity === damageToSet) {
        // No actual change in damage quantity
        return;
    }

    const damageDifference = damageToSet - productBeforeChange.damagedQuantity;
    const newStockLevel = productBeforeChange.stock - damageDifference;

    if (newStockLevel < 0) {
        toast({
            title: "Stock Error",
            description: `Setting damage to ${damageToSet} would result in negative stock (${newStockLevel}). Current stock is ${productBeforeChange.stock}, current damage ${productBeforeChange.damagedQuantity}. Max possible new damage is ${productBeforeChange.damagedQuantity + productBeforeChange.stock}.`,
            variant: "destructive",
            duration: 7000
        });
        // Revert the input field value to the original if it's a controlled component.
        // This requires the input to reflect currentProducts state rather than local component state.
        // For simplicity, we'll just block the update here. The UI might be out of sync until refresh or manual correction by user.
        // A more robust solution would involve making the input directly reflect `currentProducts[...].damagedQuantity`.
        return;
    }
    
    // Update mockProducts (source of truth)
    mockProducts[productIndexGlobal].damagedQuantity = damageToSet;
    mockProducts[productIndexGlobal].stock = newStockLevel;

    // Update currentProducts state to reflect changes in UI
    setCurrentProducts(prevProducts =>
        prevProducts.map(p =>
            p.id === productId ? { ...mockProducts[productIndexGlobal] } : p
        ).sort((a, b) => a.name.localeCompare(b.name)) // Keep sorting
    );
    
    addLog(
        "Product Damage & Stock Update", 
        `Damage for '${productBeforeChange.name}' (ID: ${productId.substring(0,8)}...) changed from ${productBeforeChange.damagedQuantity} to ${damageToSet}. Stock changed from ${productBeforeChange.stock} to ${newStockLevel}. By ${user.name}.`
    );
    toast({
        title: "Damage & Stock Updated",
        description: `Damage for ${productBeforeChange.name} set to ${damageToSet}. Remaining stock is now ${newStockLevel}.`,
    });
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
    
    setCurrentProducts(prevProducts => 
      prevProducts.map(p => 
        p.id === productId ? { ...p, stock: newStockLevel, totalAcquiredStock: newTotalAcquiredStock } : p
      ).sort((a, b) => a.name.localeCompare(b.name))
    );
    
    addLog("Product Stock Added", `${quantityToAdd} units of stock added to product '${product.name}' (ID: ${productId.substring(0,8)}...). New Remaining Stock: ${newStockLevel}, New Total Acquired: ${newTotalAcquiredStock}.`);
    toast({
      title: "Stock Added",
      description: `${quantityToAdd} units added to ${product.name}. New Remaining Stock: ${newStockLevel}.`
    });
    setProductToRestock(null); 
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
                <TableHead>Total Stock</TableHead>
                <TableHead>Cost Price/Unit</TableHead>
                <TableHead>MRP/Unit</TableHead>
                <TableHead>Sold</TableHead>
                <TableHead>Damage</TableHead>
                <TableHead>Remaining Stock</TableHead>
                <TableHead>Status</TableHead>
                {user.role === 'admin' && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedProducts.map((product) => {
                const soldQty = calculatedSoldQuantities.get(product.id) || 0;
                return (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>{product.totalAcquiredStock}</TableCell>
                    <TableCell>NRP {product.costPrice.toFixed(2)}</TableCell>
                    <TableCell>NRP {product.sellingPrice.toFixed(2)}</TableCell>
                    <TableCell>{soldQty}</TableCell>
                    <TableCell>
                      {user.role === 'admin' ? (
                        <Input
                          type="number"
                          defaultValue={product.damagedQuantity} // Use defaultValue for less direct control, or value for controlled
                          onBlur={(e) => handleDamageChange(product.id, e.target.value === "" ? "" : e.target.valueAsNumber)}
                          // Consider using onChange with debounce if frequent updates are an issue, or onBlur as implemented.
                          className="w-20 h-9"
                          min="0"
                        />
                      ) : (
                        product.damagedQuantity
                      )}
                    </TableCell>
                    <TableCell>
                      {product.stock}
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.stock > 10 ? 'default' : (product.stock > 0 ? 'secondary' : 'destructive')}
                            className={product.stock > 10 ? 'bg-green-500 hover:bg-green-600' : (product.stock > 0 ? 'bg-yellow-500 hover:bg-yellow-600 text-black' : 'bg-red-500 hover:bg-red-600')}>
                        {product.stock > 10 ? 'In Stock' : (product.stock > 0 ? 'Low Stock' : 'Out of Stock')}
                      </Badge>
                    </TableCell>
                    {user.role === 'admin' && (
                      <TableCell className="text-right space-x-1">
                        <Button variant="outline" size="icon" onClick={() => handleOpenAddStockDialog(product)} title="Add Stock">
                          <PackagePlus className="h-4 w-4" />
                          <span className="sr-only">Add Stock</span>
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
    </div>
  );
}

