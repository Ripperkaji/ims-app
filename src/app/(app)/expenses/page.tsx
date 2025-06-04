
"use client";

import ExpensesForm from "@/components/expenses/ExpensesForm";
import { useAuth } from "@/contexts/AuthContext";
import { mockExpenses } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { format } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useMemo } from 'react';
import type { Expense } from '@/types';
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function ExpensesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [refreshTrigger, setRefreshTrigger] = useState(0); // To force re-render when mockExpenses changes

  useEffect(() => {
    if (user && user.role !== 'admin') {
      toast({ title: "Access Denied", description: "You do not have permission to view this page.", variant: "destructive"});
      router.push('/dashboard');
    }
  }, [user, router, toast]);

  // Derive displayedExpenses from the global mockExpenses and sort it
  // refreshTrigger is used to ensure this useMemo re-runs when we manually update mockExpenses
  const displayedExpenses = useMemo(() => {
    return [...mockExpenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [refreshTrigger]); // mockExpenses is not in deps as direct mutation won't trigger useMemo

  useEffect(() => {
    // This effect listens for changes in the length of mockExpenses as a proxy
    // for external updates (like system-generated expenses).
    // This is a workaround for not having a global state manager.
    setRefreshTrigger(prev => prev + 1);
  }, [mockExpenses.length]);


  const handleExpenseAdded = (newExpense: Expense) => {
    // The ExpensesForm will call this after validating and creating the newExpense object
    // We add it to the global mockExpenses array
    mockExpenses.unshift(newExpense); // Add to the beginning
    mockExpenses.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Re-sort
    setRefreshTrigger(prev => prev + 1); // Trigger re-render
    toast({ title: "Expense Recorded!", description: `${newExpense.category} expense of NRP ${newExpense.amount.toFixed(2)} recorded.`});
  };

  const handleEditExpense = (expenseId: string) => {
    toast({ title: "Action Required", description: `Editing expense ${expenseId} - (Not Implemented)` });
  };

  const handleDeleteExpense = (expenseId: string) => {
    const expenseIndex = mockExpenses.findIndex(exp => exp.id === expenseId);
    if (expenseIndex > -1) {
      const systemCategories = ["Product Damage", "Tester Allocation"];
      if (systemCategories.includes(mockExpenses[expenseIndex].category)) {
        toast({ title: "Deletion Restricted", description: `System-generated expenses like '${mockExpenses[expenseIndex].category}' cannot be deleted directly.`, variant: "destructive" });
        return;
      }
      mockExpenses.splice(expenseIndex, 1);
      setRefreshTrigger(prev => prev + 1); // Trigger re-render
      toast({ title: "Expense Deleted", description: `Expense ${expenseId.substring(0,8)}... has been deleted.` });
    } else {
      toast({ title: "Error", description: "Expense not found for deletion.", variant: "destructive" });
    }
  };

  if (!user || user.role !== 'admin') {
    return null; 
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold font-headline">Expenses Management</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <ExpensesForm onExpenseAdded={handleExpenseAdded} />
        </div>
        
        <div className="lg:col-span-2">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Recorded Expenses</CardTitle>
              <CardDescription>List of all business expenses.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Recorded By</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>{format(new Date(expense.date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell className="font-medium">{expense.category}</TableCell>
                      <TableCell className="truncate max-w-xs">{expense.description}</TableCell>
                      <TableCell>NRP {expense.amount.toFixed(2)}</TableCell>
                      <TableCell>{expense.recordedBy}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => handleEditExpense(expense.id)}
                            disabled={["Product Damage", "Tester Allocation"].includes(expense.category)}
                            title={["Product Damage", "Tester Allocation"].includes(expense.category) ? "System expenses cannot be edited" : "Edit Expense"}
                        >
                          <Edit className="h-4 w-4" />
                           <span className="sr-only">Edit Expense</span>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                                variant="destructive" 
                                size="icon"
                                disabled={["Product Damage", "Tester Allocation"].includes(expense.category)}
                                title={["Product Damage", "Tester Allocation"].includes(expense.category) ? "System expenses cannot be deleted" : "Delete Expense"}
                            >
                              <Trash2 className="h-4 w-4" />
                               <span className="sr-only">Delete Expense</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the expense record for '{expense.description}'.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteExpense(expense.id)}>
                                Continue
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {displayedExpenses.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No expenses recorded yet.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
