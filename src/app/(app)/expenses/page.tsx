
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
import { useState, useEffect } from 'react';
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
  const [expenses, setExpenses] = useState<Expense[]>(mockExpenses);

  useEffect(() => {
    if (user && user.role !== 'admin') {
      toast({ title: "Access Denied", description: "You do not have permission to view this page.", variant: "destructive"});
      router.push('/dashboard');
    }
  }, [user, router, toast]);

  const handleExpenseAdded = (newExpense: Expense) => {
    setExpenses(prevExpenses => [newExpense, ...prevExpenses].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };

  const handleEditExpense = (expenseId: string) => {
    toast({ title: "Action Required", description: `Editing expense ${expenseId} - (Not Implemented)` });
  };

  const handleDeleteExpense = (expenseId: string) => {
    // setExpenses(expenses.filter(exp => exp.id !== expenseId));
    toast({ title: "Action Required", description: `Deleting expense ${expenseId} - (Not Implemented)` });
  };

  if (!user || user.role !== 'admin') {
    // This will be handled by redirect, but good to have a fallback UI or null.
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
                  {expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>{format(new Date(expense.date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell className="font-medium">{expense.category}</TableCell>
                      <TableCell className="truncate max-w-xs">{expense.description}</TableCell>
                      <TableCell>NRP {expense.amount.toFixed(2)}</TableCell>
                      <TableCell>{expense.recordedBy}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="icon" onClick={() => handleEditExpense(expense.id)}>
                          <Edit className="h-4 w-4" />
                           <span className="sr-only">Edit Expense</span>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon">
                              <Trash2 className="h-4 w-4" />
                               <span className="sr-only">Delete Expense</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the expense record. (This is a placeholder, no actual deletion will occur).
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
              {expenses.length === 0 && (
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
