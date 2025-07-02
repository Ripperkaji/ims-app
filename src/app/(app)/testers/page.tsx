
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from "@/stores/authStore";
import { mockProducts, mockLogEntries, addSystemExpense, mockSales } from "@/lib/data"; 
import type { Product, LogEntry, ProductType, Expense } from '@/types';
import { ALL_PRODUCT_TYPES } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FlaskConical, Save, Info } from "lucide-react"; // Removed Edit
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { calculateCurrentStock } from '@/lib/productUtils'; 
import { addLogEntry as globalAddLog } from "@/lib/data"; // Use the updated addLogEntry

interface ProductForTesterCard extends Product {
  stock: number; 
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
              {p.name} (Stock: {p.stock}, Samples: {p.testerQuantity || 0})
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
  
  const [productsForTesterAssignmentCard, setProductsForTesterAssignmentCard] = useState<ProductForTesterCard[]>([]);
  const [productsWithTestersList, setProductsWithTestersList] = useState<ProductForTesterCard[]>([]); 
  const [refreshTrigger, setRefreshTrigger] = useState(0);


  const refreshDerivedProductStates = () => {
      setProductsForTesterAssignmentCard(
        mockProducts.map(p => ({ 
          ...p, 
          stock: calculateCurrentStock(p, mockSales) 
        })).sort((a, b) => a.name.localeCompare(b.name))
      );
      setProductsWithTestersList(
        mockProducts
          .filter(p => (p.testerQuantity || 0) > 0)
          .map(p => ({
            ...p,
            stock: calculateCurrentStock(p, mockSales)
          }))
          .sort((a, b) => a.name.localeCompare(b.name))
      );
  };

  useEffect(() => {
    if (user && user.role !== 'admin') {
      toast({ title: "Access Denied", description: "You do not have permission to view this page.", variant: "destructive" });
      router.push('/dashboard');
      return;
    }
    refreshDerivedProductStates();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, router, toast, refreshTrigger, mockProducts, mockSales]); 


  const addLog = (action: string, details: string) => {
    if (!user) return;
    globalAddLog(user.name, action, details);
  };

  const handleCategoryChangeForTesterCard = (category: ProductType | '') => {
    setSelectedCategoryForTester(category);
    setSelectedProductForTester(null); 
    setNewTesterQuantityInput(''); 
  };
  
  const handleProductChangeForTesterCard = (productId: string) => {
    setSelectedProductForTester(productId);
    const product = mockProducts.find(p => p.id === productId);
    setNewTesterQuantityInput((product?.testerQuantity || 0).toString());
  };


  const handleUpdateTesterQuantityFromCard = () => {
    if (!user || !selectedProductForTester) {
      toast({ title: "Selection Missing", description: "Please select a product.", variant: "destructive" });
      return;
    }

    const selectedProductId = selectedProductForTester;
    const productGlobalIndex = mockProducts.findIndex(p => p.id === selectedProductId);

    if (productGlobalIndex === -1) {
      toast({ title: "Error", description: "Selected product not found in global list.", variant: "destructive" });
      return;
    }
    
    const currentProductGlobal = mockProducts[productGlobalIndex];
    const oldTesterQty = currentProductGlobal.testerQuantity || 0;
    const oldStock = calculateCurrentStock(currentProductGlobal, mockSales); 

    const newDesiredTesterQty = parseInt(newTesterQuantityInput.trim(), 10);

    if (isNaN(newDesiredTesterQty) || newDesiredTesterQty < 0) {
      toast({ title: "Invalid Input", description: "Sample/Tester quantity must be a non-negative number.", variant: "destructive" });
      return;
    }

    if (newDesiredTesterQty === oldTesterQty) {
      toast({ title: "No Change", description: `Sample quantity for ${currentProductGlobal.name} is already ${oldTesterQty}.`, variant: "default" });
      return;
    }

    const deltaTesters = newDesiredTesterQty - oldTesterQty;
    let newStockAfterUpdate; 

    if (deltaTesters > 0) { 
      if (oldStock < deltaTesters) {
        toast({
          title: "Insufficient Stock",
          description: `Not enough sellable stock to convert to ${deltaTesters} new sample(s) for ${currentProductGlobal.name}. Available: ${oldStock}. Max new total samples: ${oldTesterQty + oldStock}.`,
          variant: "destructive",
          duration: 7000
        });
        setNewTesterQuantityInput(oldTesterQty.toString()); 
        return;
      }
      
      const testerExpense: Omit<Expense, 'id'> = {
        date: new Date().toISOString(),
        description: `Sample/Demo Allocation: ${deltaTesters}x ${currentProductGlobal.name}`,
        category: "Sample/Demo Allocation",
        amount: deltaTesters * currentProductGlobal.currentCostPrice,
        recordedBy: user.name,
      };
      addSystemExpense(testerExpense, user.name);
      
      mockProducts[productGlobalIndex].testerQuantity = newDesiredTesterQty;
      newStockAfterUpdate = calculateCurrentStock(mockProducts[productGlobalIndex], mockSales);

      toast({
        title: "Sample Quantity Updated & Expense Logged",
        description: `Sample units for ${currentProductGlobal.name} set to ${newDesiredTesterQty}. Sellable stock is now ${newStockAfterUpdate}. Expense of NRP ${(deltaTesters * currentProductGlobal.currentCostPrice).toFixed(2)} logged.`,
      });

    } else { 
      mockProducts[productGlobalIndex].testerQuantity = newDesiredTesterQty;
      newStockAfterUpdate = calculateCurrentStock(mockProducts[productGlobalIndex], mockSales);
      toast({
        title: "Sample Quantity Updated",
        description: `Sample units for ${currentProductGlobal.name} set to ${newDesiredTesterQty}. Sellable stock is now ${newStockAfterUpdate}.`,
      });
    }
    
    addLog(
      "Sample/Demo Quantity Updated",
      `Sample/Demo quantity for '${currentProductGlobal.name}' (ID: ${selectedProductId.substring(0,8)}...) changed from ${oldTesterQty} to ${newDesiredTesterQty} by ${user.name}. Sellable stock adjusted from ${oldStock} to ${newStockAfterUpdate}.`
    );
    
    setRefreshTrigger(prev => prev + 1); 
    
    setSelectedCategoryForTester('');
    setSelectedProductForTester(null);
    setNewTesterQuantityInput('');
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
                products={productsForTesterAssignmentCard} 
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
                  <TableCell className="text-center">{product.stock}</TableCell> 
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {productsWithTestersList.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No products are currently assigned as samples, testers, or demos. Use the form above to assign them.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
