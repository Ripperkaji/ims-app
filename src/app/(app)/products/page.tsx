
"use client";

import { useState } from "react";
import { mockProducts, mockLogEntries } from "@/lib/data";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit, PlusCircle, PackagePlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { Product, LogEntry, ProductType } from '@/types';
import AddStockDialog from "@/components/products/AddStockDialog";
import AddProductDialog from "@/components/products/AddProductDialog"; 

export default function ProductsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentProducts, setCurrentProducts] = useState<Product[]>(mockProducts.sort((a,b) => a.name.localeCompare(b.name)));
  const [productToRestock, setProductToRestock] = useState<Product | null>(null);
  const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false);

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

  const handleEditProduct = (productId: string) => {
    toast({ title: "Action Required", description: `Editing product ${productId} details - (Not Implemented)` });
  };

  const handleAddNewProductClick = () => {
    setIsAddProductDialogOpen(true);
  };

  const handleConfirmAddProduct = (newProductData: { name: string; price: number; stock: number; type: ProductType }) => {
    const newProduct: Product = {
      id: `prod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: newProductData.name,
      price: newProductData.price,
      stock: newProductData.stock,
      type: newProductData.type,
    };
    // Update local state for this page's table
    setCurrentProducts(prevProducts => [newProduct, ...prevProducts].sort((a,b) => a.name.localeCompare(b.name)));
    
    // Update global mockProducts array
    mockProducts.push(newProduct);
    mockProducts.sort((a,b) => a.name.localeCompare(b.name)); // Keep global array sorted

    addLog("Product Added", `Product '${newProduct.name}' (Type: ${newProduct.type}, ID: ${newProduct.id.substring(0,8)}...) added with price NRP ${newProduct.price.toFixed(2)} and stock ${newProduct.stock}.`);
    toast({
      title: "Product Added",
      description: `${newProduct.name} has been successfully added to the inventory.`,
    });
  };


  const handleStockChange = (productId: string, value: number | string) => {
    const productBeforeChange = currentProducts.find(p => p.id === productId);
    if (!productBeforeChange) return;

    let stockToSet: number;

    if (value === "") { 
        stockToSet = 0;
    } else if (typeof value === 'number' && !isNaN(value)) {
        stockToSet = Math.max(0, value); 
    } else {
        const parsedValue = parseInt(String(value), 10);
        if (!isNaN(parsedValue)) {
            stockToSet = Math.max(0, parsedValue);
        } else {
            toast({ title: "Invalid Stock", description: "Please enter a valid number.", variant: "destructive" });
            return;
        }
    }
    
    if (productBeforeChange.stock !== stockToSet) {
        // Update local state for this page's table
        setCurrentProducts(prevProducts => 
            prevProducts.map(p => p.id === productId ? { ...p, stock: stockToSet } : p)
        );
        // Update global mockProducts array
        const globalProductIndex = mockProducts.findIndex(p => p.id === productId);
        if (globalProductIndex !== -1) {
            mockProducts[globalProductIndex].stock = stockToSet;
        }

        addLog("Product Stock Quantity Set", `Stock for product '${productBeforeChange.name}' (ID: ${productId.substring(0,8)}...) set from ${productBeforeChange.stock} to ${stockToSet}.`);
        toast({
            title: "Stock Updated",
            description: `Stock for ${productBeforeChange.name} set to ${stockToSet}.`,
        });
    }
  };

  const handleOpenAddStockDialog = (product: Product) => {
    setProductToRestock(product);
  };

  const handleConfirmAddStock = (productId: string, quantityToAdd: number) => {
    const product = currentProducts.find(p => p.id === productId);
    if (!product) return;

    const newStockLevel = product.stock + quantityToAdd;
    // Update local state for this page's table
    setCurrentProducts(prevProducts => 
      prevProducts.map(p => 
        p.id === productId ? { ...p, stock: newStockLevel } : p
      )
    );
    // Update global mockProducts array
    const globalProductIndex = mockProducts.findIndex(p => p.id === productId);
    if (globalProductIndex !== -1) {
        mockProducts[globalProductIndex].stock = newStockLevel;
    }
    
    addLog("Product Stock Added", `${quantityToAdd} units of stock added to product '${product.name}' (ID: ${productId.substring(0,8)}...). New stock: ${newStockLevel}.`);
    toast({
      title: "Stock Added",
      description: `${quantityToAdd} units added to ${product.name}. New stock: ${newStockLevel}.`
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
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Product List & Stock</CardTitle>
          <CardDescription>Overview of all available products and their current stock levels.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                {user.role === 'admin' && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.id.substring(0,8)}...</TableCell>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{product.type || 'N/A'}</TableCell>
                  <TableCell>NRP {product.price.toFixed(2)}</TableCell>
                  <TableCell>
                    {user.role === 'admin' ? (
                      <Input
                        type="number"
                        value={product.stock}
                        onChange={(e) => {
                           const val = e.target.value;
                           handleStockChange(product.id, val === "" ? "" : e.target.valueAsNumber);
                        }}
                        className="w-24 h-9"
                        min="0"
                      />
                    ) : (
                      product.stock
                    )}
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
                      <Button variant="outline" size="icon" onClick={() => handleEditProduct(product.id)} title="Edit Product">
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit Product</span>
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {currentProducts.length === 0 && (
             <div className="text-center py-8 text-muted-foreground">
              No products found.
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
    </div>
  );
}

