"use client";

import { mockProducts } from "@/lib/data";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, PlusCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function ProductsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const handleEditProduct = (productId: string) => {
    toast({ title: "Action Required", description: `Editing product ${productId} - (Not Implemented)` });
    // Placeholder for edit functionality
  };

  const handleAddProduct = () => {
    toast({ title: "Action Required", description: "Adding new product - (Not Implemented)" });
    // Placeholder for add functionality
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">Product Management</h1>
        {user.role === 'admin' && (
          <Button onClick={handleAddProduct}>
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
              {mockProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.id}</TableCell>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>${product.price.toFixed(2)}</TableCell>
                  <TableCell>{product.stock}</TableCell>
                  <TableCell>
                    <Badge variant={product.stock > 10 ? 'default' : (product.stock > 0 ? 'secondary' : 'destructive')}
                           className={product.stock > 10 ? 'bg-green-500 hover:bg-green-600' : (product.stock > 0 ? 'bg-yellow-500 hover:bg-yellow-600 text-black' : 'bg-red-500 hover:bg-red-600')}>
                      {product.stock > 10 ? 'In Stock' : (product.stock > 0 ? 'Low Stock' : 'Out of Stock')}
                    </Badge>
                  </TableCell>
                  {user.role === 'admin' && (
                    <TableCell className="text-right">
                      <Button variant="outline" size="icon" onClick={() => handleEditProduct(product.id)}>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit Product</span>
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {mockProducts.length === 0 && (
             <div className="text-center py-8 text-muted-foreground">
              No products found.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
