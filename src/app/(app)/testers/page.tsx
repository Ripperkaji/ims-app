
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from "@/stores/authStore";
import type { Product, ProductType } from '@/types';
import { ALL_PRODUCT_TYPES } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FlaskConical, Save, Info, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { calculateCurrentStock } from '@/lib/productUtils';
import { mockProducts, mockSales } from '@/lib/data'; // Keep for stock calculation on the client

interface ProductForTesterCard extends Product {
  stock: number; 
}

interface TesterProductInfo {
  id: string;
  name: string;
  category: string;
  testerQuantity: number;
  currentStock: number;
}


const ProductInfoDisplay = ({ productId }: { productId: string | null }) => {
    const productDetails = productId ? mockProducts.find(p => p.id === productId) : null;
    if (!productDetails) {
        return <p className="text-sm text-muted-foreground h-10 flex items-center">Select a product to see details.</p>;
    }
    const currentStock = calculateCurrentStock(productDetails, mockSales); 
    return (
        <div className="text-sm space-y-1 h-10">
            <p>Current Sellable Stock: <span className="font-semibold">{currentStock}</span></p>
            <p>Current Sample/Tester/Demo Units: <span className="font-semibold">{productDetails.testerQuantity || 0}</span></p>
        </div>
    );
};

const ProductSelect = ({
  selectedCategory,
  selectedValue,
  onChange,
  products,
  disabled,
}: {
  selectedCategory: ProductType | '';
  selectedValue: string | null;
  onChange: (value: string) => void;
  products: ProductForTesterCard[];
  disabled: boolean;
}) => {
  const filteredProducts = useMemo(() => {
    if (!selectedCategory) return [];
    return products
      .filter(p => p.category === selectedCategory)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [selectedCategory, products]);

  return (
    <Select
      value={selectedValue || ''}
      onValueChange={onChange}
      disabled={disabled || filteredProducts.length === 0}
    >
      <SelectTrigger>
        <SelectValue placeholder={disabled ? "First select category" : "Select product"} />
      </SelectTrigger>
      <SelectContent>
        {filteredProducts.length > 0 ? (
          filteredProducts.map(p => ( 
            <SelectItem key={p.id} value={p.id} disabled={p.stock <= 0 && (p.testerQuantity || 0) <= 0 && p.id !== selectedValue}>
              {`${p.name}${p.modelName ? ` (${p.modelName})` : ''}${p.flavorName ? ` - ${p.flavorName}` : ''}`} (Stock: {p.stock}, Samples: {p.testerQuantity || 0})
            </SelectItem>
          ))
        ) : (
          <SelectItem value="no-products" disabled>
            No products in this category
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  );
};


export default function TestersPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { toast } = useToast();

  const [selectedCategoryForTester, setSelectedCategoryForTester] = useState<ProductType | ''>('');
  const [selectedProductForTester, setSelectedProductForTester] = useState<string | null>(null);
  const [newTesterQuantityInput, setNewTesterQuantityInput] = useState<string>('');
  
  const [allProducts, setAllProducts] = useState<ProductForTesterCard[]>([]);
  const [productsWithTestersList, setProductsWithTestersList] = useState<TesterProductInfo[]>([]); 
  const [isLoading, setIsLoading] = useState(true);

  const fetchTesterData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/products/testers');
      if (!res.ok) throw new Error('Failed to fetch data');
      const data = await res.json();
      setProductsWithTestersList(data);
    } catch (error) {
      toast({ title: "Error", description: "Could not fetch products with testers.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role !== 'admin') {
      toast({ title: "Access Denied", description: "You do not have permission to view this page.", variant: "destructive" });
      router.push('/dashboard');
      return;
    }
    
    // Set all products for the dropdowns
    setAllProducts(
      mockProducts.map(p => ({
        ...p,
        stock: calculateCurrentStock(p, mockSales),
      }))
    );
    
    fetchTesterData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, router, toast]); 


  const handleCategoryChangeForTesterCard = (category: ProductType | '') => {
    setSelectedCategoryForTester(category);
    setSelectedProductForTester(null); 
    setNewTesterQuantityInput(''); 
  };
  
  const handleProductChangeForTesterCard = (productId: string) => {
    setSelectedProductForTester(productId);
    const product = allProducts.find(p => p.id === productId);
    setNewTesterQuantityInput((product?.testerQuantity || 0).toString());
  };


  const handleUpdateTesterQuantityFromCard = async () => {
    if (!user || !selectedProductForTester) {
      toast({ title: "Selection Missing", description: "Please select a product.", variant: "destructive" });
      return;
    }

    const newDesiredTesterQty = parseInt(newTesterQuantityInput.trim(), 10);

    if (isNaN(newDesiredTesterQty) || newDesiredTesterQty < 0) {
      toast({ title: "Invalid Input", description: "Sample/Tester quantity must be a non-negative number.", variant: "destructive" });
      return;
    }

    try {
      const response = await fetch(`/api/products/${selectedProductForTester}/testers`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          newTesterQuantity: newDesiredTesterQty,
          actorName: user.name 
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update tester quantity.');
      }
      
      const productToUpdate = allProducts.find(p => p.id === selectedProductForTester);
      toast({ title: "Success", description: `Sample/Demo quantity for ${productToUpdate?.name} updated successfully.`});
      
      // Reset form and refetch data
      setSelectedCategoryForTester('');
      setSelectedProductForTester(null);
      setNewTesterQuantityInput('');
      fetchTesterData(); // Refetch the list of products with testers
      
      // Manually update mock data on client to reflect stock changes instantly
      const productIndex = mockProducts.findIndex(p => p.id === selectedProductForTester);
      if (productIndex !== -1) {
        mockProducts[productIndex].testerQuantity = newDesiredTesterQty;
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({ title: "Update Failed", description: errorMessage, variant: "destructive"});
    }
  };


  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
          <FlaskConical className="h-7 w-7 text-primary" /> Sample / Tester / Demo Management
        </h1>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Assign/Update Sample Units</CardTitle>
          <CardDescription>
            Select a product and set its total sample/tester/demo quantity. This will adjust sellable stock.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="testerCategorySelect">Product Category</Label>
              <Select value={selectedCategoryForTester} onValueChange={handleCategoryChangeForTesterCard}>
                <SelectTrigger id="testerCategorySelect">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {ALL_PRODUCT_TYPES.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="testerProductSelect">Product</Label>
              <ProductSelect
                selectedCategory={selectedCategoryForTester}
                selectedValue={selectedProductForTester}
                onChange={handleProductChangeForTesterCard}
                products={allProducts} 
                disabled={!selectedCategoryForTester}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div>
              <Label htmlFor="newTesterQuantity">New Total Sample/Tester/Demo Quantity</Label>
              <Input
                id="newTesterQuantity"
                type="number"
                value={newTesterQuantityInput}
                onChange={(e) => setNewTesterQuantityInput(e.target.value)}
                placeholder="Enter total sample units"
                min="0"
                disabled={!selectedProductForTester}
              />
            </div>
            <div className="md:mt-auto"> 
                {selectedProductForTester ? <ProductInfoDisplay productId={selectedProductForTester} /> : <div className="h-10"></div>}
            </div>
          </div>
           {selectedProductForTester && parseInt(newTesterQuantityInput) < 0 && (
             <Alert variant="destructive">
                <Info className="h-4 w-4" />
                <AlertTitle>Invalid Input</AlertTitle>
                <AlertDescription>Sample/Tester quantity cannot be negative.</AlertDescription>
            </Alert>
           )}

        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleUpdateTesterQuantityFromCard} 
            disabled={!selectedProductForTester || newTesterQuantityInput.trim() === '' || parseInt(newTesterQuantityInput) < 0 }
            className={(!selectedProductForTester || newTesterQuantityInput.trim() === '' || parseInt(newTesterQuantityInput) < 0) ? "bg-primary/50" : ""}
          >
            <Save className="mr-2 h-4 w-4" /> Update Sample/Tester/Demo Quantity
          </Button>
        </CardFooter>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Products with Sample/Tester/Demo Units</CardTitle>
           <CardDescription>
            List of products with units designated as samples, testers, or demos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-center">Sample/Tester/Demo Units</TableHead>
                  <TableHead className="text-center">Sellable Stock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productsWithTestersList.map((product) => ( 
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell className="text-center">{product.testerQuantity || 0}</TableCell>
                    <TableCell className="text-center">{product.currentStock}</TableCell> 
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {!isLoading && productsWithTestersList.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No products are currently assigned as samples, testers, or demos. Use the form above to assign them.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
