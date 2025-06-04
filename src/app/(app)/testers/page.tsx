
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { mockProducts, mockLogEntries, addSystemExpense } from "@/lib/data";
import type { Product, LogEntry, ProductType, Expense } from '@/types';
import { ALL_PRODUCT_TYPES } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FlaskConical, Edit, Save, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ProductForTesterCard extends Product {
  // No extra fields needed here now, direct properties from Product will be used
}

// Component to display current stock and tester info for selected product in the card
const ProductInfoDisplay = ({ productId }: { productId: string | null }) => {
    const product = productId ? mockProducts.find(p => p.id === productId) : null;
    if (!product) {
        return <p className="text-sm text-muted-foreground h-10 flex items-center">Select a product to see details.</p>;
    }
    return (
        <div className="text-sm space-y-1 h-10">
            <p>Current Sellable Stock: <span className="font-semibold">{product.stock}</span></p>
            <p>Current Testers: <span className="font-semibold">{product.testerQuantity || 0}</span></p>
        </div>
    );
};

// Component for Product Selection Dropdown
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
            <SelectItem key={p.id} value={p.id} disabled={!p.productId && p.stock <= 0 && p.testerQuantity <=0}>
              {p.name} (Stock: {p.stock}, Testers: {p.testerQuantity || 0})
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
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [selectedCategoryForTester, setSelectedCategoryForTester] = useState<ProductType | ''>('');
  const [selectedProductForTester, setSelectedProductForTester] = useState<string | null>(null);
  const [newTesterQuantityInput, setNewTesterQuantityInput] = useState<string>('');
  
  const [productsForTesterAssignmentCard, setProductsForTesterAssignmentCard] = useState<ProductForTesterCard[]>([]);
  const [productsWithTestersList, setProductsWithTestersList] = useState<Product[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);


  const refreshDerivedProductStates = () => {
      setProductsForTesterAssignmentCard(
        mockProducts.map(p => ({ ...p })).sort((a, b) => a.name.localeCompare(b.name))
      );
      setProductsWithTestersList(
        mockProducts.filter(p => p.testerQuantity > 0).sort((a, b) => a.name.localeCompare(b.name))
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
  }, [user, router, toast, refreshTrigger]); 


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
    const oldStock = currentProductGlobal.stock;

    const newDesiredTesterQty = parseInt(newTesterQuantityInput.trim(), 10);

    if (isNaN(newDesiredTesterQty) || newDesiredTesterQty < 0) {
      toast({ title: "Invalid Input", description: "Tester quantity must be a non-negative number.", variant: "destructive" });
      return;
    }

    if (newDesiredTesterQty === oldTesterQty) {
      toast({ title: "No Change", description: `Tester quantity for ${currentProductGlobal.name} is already ${oldTesterQty}.`, variant: "default" });
      refreshDerivedProductStates();
      setSelectedCategoryForTester('');
      setSelectedProductForTester(null);
      setNewTesterQuantityInput('');
      return;
    }

    const deltaTesters = newDesiredTesterQty - oldTesterQty;
    let newStock = oldStock;

    if (deltaTesters > 0) { 
      if (oldStock < deltaTesters) {
        toast({
          title: "Insufficient Stock",
          description: `Not enough sellable stock to convert to ${deltaTesters} new tester(s) for ${currentProductGlobal.name}. Available: ${oldStock}. Max new total testers: ${oldTesterQty + oldStock}.`,
          variant: "destructive",
          duration: 7000
        });
        setNewTesterQuantityInput(oldTesterQty.toString()); 
        return;
      }
      newStock -= deltaTesters;
      
      // Create expense entry for tester allocation
      const testerExpense: Omit<Expense, 'id'> = {
        date: new Date().toISOString(),
        description: `Tester Allocation: ${deltaTesters}x ${currentProductGlobal.name}`,
        category: "Tester Allocation",
        amount: deltaTesters * currentProductGlobal.costPrice,
        recordedBy: user.name,
      };
      addSystemExpense(testerExpense);
      toast({
        title: "Tester Quantity Updated & Expense Logged",
        description: `Testers for ${currentProductGlobal.name} set to ${newDesiredTesterQty}. Stock is now ${newStock}. Expense of NRP ${(deltaTesters * currentProductGlobal.costPrice).toFixed(2)} logged.`,
      });

    } else { // Decreasing testers
      newStock -= deltaTesters; // e.g., stock - (-1) = stock + 1
      toast({
        title: "Tester Quantity Updated",
        description: `Testers for ${currentProductGlobal.name} set to ${newDesiredTesterQty}. Stock is now ${newStock}.`,
      });
    }
    
    mockProducts[productGlobalIndex].stock = newStock;
    mockProducts[productGlobalIndex].testerQuantity = newDesiredTesterQty;

    addLog(
      "Tester Quantity Updated",
      `Tester quantity for '${currentProductGlobal.name}' (ID: ${selectedProductId.substring(0,8)}...) changed from ${oldTesterQty} to ${newDesiredTesterQty} by ${user.name}. Sellable stock adjusted from ${oldStock} to ${newStock}.`
    );
    
    setRefreshTrigger(prev => prev + 1); // Trigger refresh for all dependent states
    
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
          <FlaskConical className="h-7 w-7 text-primary" /> Tester Product Management
        </h1>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Assign/Update Tester Units</CardTitle>
          <CardDescription>
            Select a product and set its total tester quantity. This will adjust sellable stock.
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
              <Label htmlFor="newTesterQuantity">New Total Tester Quantity</Label>
              <Input
                id="newTesterQuantity"
                type="number"
                value={newTesterQuantityInput}
                onChange={(e) => setNewTesterQuantityInput(e.target.value)}
                placeholder="Enter total testers"
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
                <AlertDescription>Tester quantity cannot be negative.</AlertDescription>
            </Alert>
           )}

        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleUpdateTesterQuantityFromCard} 
            disabled={!selectedProductForTester || newTesterQuantityInput.trim() === '' || parseInt(newTesterQuantityInput) < 0 }
            className={(!selectedProductForTester || newTesterQuantityInput.trim() === '' || parseInt(newTesterQuantityInput) < 0) ? "bg-primary/50" : ""}
          >
            <Save className="mr-2 h-4 w-4" /> Update Tester Quantity
          </Button>
        </CardFooter>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Products Currently Assigned as Testers</CardTitle>
           <CardDescription>
            List of products with one or more units designated as testers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-center">Current Testers</TableHead>
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
              No products are currently assigned as testers. Use the form above to assign them.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

