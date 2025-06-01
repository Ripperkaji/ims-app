
"use client";

import { useState } from "react";
import { mockProducts } from "@/lib/data";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit, PlusCircle, PackagePlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { Product } from '@/types';
import AddStockDialog from "@/components/products/AddStockDialog";
import AddProductDialog from "@/components/products/AddProductDialog"; // Import the new dialog

export default function ProductsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentProducts, setCurrentProducts] = useState<Product[]>(mockProducts);
  const [productToRestock, setProductToRestock] = useState<Product | null>(null);
  const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false);

  const handleEditProduct = (productId: string) => {
    toast({ title: "Action Required", description: `Editing product ${productId} details - (Not Implemented)` });
  };

  const handleAddNewProductClick = () => {
    setIsAddProductDialogOpen(true);
  };

  const handleConfirmAddProduct = (newProductData: { name: string; price: number; stock: number }) => {
    const newProduct: Product = {
      id: `prod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, // More unique ID
      name: newProductData.name,
      price: newProductData.price,
      stock: newProductData.stock,
    };
    setCurrentProducts(prevProducts => [newProduct, ...prevProducts].sort((a,b) => a.name.localeCompare(b.name)));
    toast({
      title: "Product Added",
      description: `${newProduct.name} has been successfully added to the inventory.`,
    });
    setIsAddProductDialogOpen(false); // Close dialog handled by AddProductDialog's onClose
  };


  const handleStockChange = (productId: string, value: number | string) => {
    setCurrentProducts(prevProducts => {
        const product = prevProducts.find(p => p.id === productId);
        if (!product) return prevProducts;

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
                return prevProducts; 
            }
        }
        
        if (product.stock !== stockToSet) {
             toast({
                title: "Stock Updated",
                description: `Stock for ${product.name} set to ${stockToSet} (locally).`,
            });
        }
        return prevProducts.map(p => p.id === productId ? { ...p, stock: stockToSet } : p);
    });
  };

  const handleOpenAddStockDialog = (product: Product) => {
    setProductToRestock(product);
  };

  const handleConfirmAddStock = (productId: string, quantityToAdd: number) => {
    setCurrentProducts(prevProducts => 
      prevProducts.map(p => 
        p.id === productId ? { ...p, stock: p.stock + quantityToAdd } : p
      )
    );
    const updatedProduct = currentProducts.find(p => p.id === productId); // Find after update
     if (updatedProduct) { // Check if product was found
        toast({
        title: "Stock Added",
        description: `${quantityToAdd} units added to ${updatedProduct.name}. New stock: ${updatedProduct.stock + quantityToAdd} (locally).`
        });
    }
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

