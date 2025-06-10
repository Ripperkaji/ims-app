
"use client";

import ExpensesForm from "@/components/expenses/ExpensesForm";
import EditExpenseDialog from "@/components/expenses/EditExpenseDialog";
import { useAuthStore } from "@/stores/authStore";
import { mockExpenses, mockLogEntries } from "@/lib/data"; 
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { format } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useMemo } from 'react';
import type { Expense, LogEntry } from '@/types'; 
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

type ExpensePaymentMethod = 'Cash' | 'Digital' | 'Due' | 'Hybrid';

export default function ExpensesPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { toast } = useToast();
  const [refreshTrigger, setRefreshTrigger] = useState(0); 
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  const [isEditExpenseDialogOpen, setIsEditExpenseDialogOpen] = useState(false);

  useEffect(() => {
    if (user && user.role !== 'admin') {
      toast({ title: "Access Denied", description: "You do not have permission to view this page.", variant: "destructive"});
      router.push('/dashboard');
    }
  }, [user, router, toast]);

  const displayedExpenses = useMemo(() => {
    return [...mockExpenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [refreshTrigger]); 

  useEffect(() => {
    setRefreshTrigger(prev => prev + 1);
  }, [mockExpenses.length]);

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

  const handleExpenseAdded = (
    expenseCoreData: Omit<Expense, 'id'>,
    paymentDetails: {
      method: ExpensePaymentMethod;
      cashPaidForLog: number;
      digitalPaidForLog: number;
      dueAmountForLog: number;
    }
  ) => {
    if (!user) return;
    const newExpense: Expense = {
      id: `exp-${Date.now()}-${Math.random().toString(36).substring(2,7)}`,
      ...expenseCoreData,
      recordedBy: user.name,
    };
    
    mockExpenses.unshift(newExpense);
    setRefreshTrigger(prev => prev + 1);

    let paymentLogString = `Paid via ${paymentDetails.method}.`;
    if (paymentDetails.method === 'Hybrid') {
      const parts = [];
      if (paymentDetails.cashPaidForLog > 0) parts.push(`Cash: NRP ${paymentDetails.cashPaidForLog.toFixed(2)}`);
      if (paymentDetails.digitalPaidForLog > 0) parts.push(`Digital: NRP ${paymentDetails.digitalPaidForLog.toFixed(2)}`);
      if (paymentDetails.dueAmountForLog > 0) parts.push(`Due: NRP ${paymentDetails.dueAmountForLog.toFixed(2)}`);
      paymentLogString = `Paid via Hybrid (${parts.join(', ')}).`;
    } else if (paymentDetails.method === 'Due') {
        paymentLogString = `Marked as Due (NRP ${newExpense.amount.toFixed(2)}).`;
    }

    const logDetails = `Expense for '${newExpense.description}' (Category: ${newExpense.category}), Amount: NRP ${newExpense.amount.toFixed(2)} recorded by ${user.name}. ${paymentLogString}`;
    addLog("Expense Recorded", logDetails);

    toast({ title: "Expense Recorded!", description: `${newExpense.category} expense of NRP ${newExpense.amount.toFixed(2)} recorded.`});
  };

  const openEditExpenseDialog = (expense: Expense) => {
    if (["Product Damage", "Tester Allocation"].includes(expense.category)) {
      toast({ title: "Edit Restricted", description: `System-generated expenses like '${expense.category}' cannot be fully edited here. Their amounts are system-derived.`, variant: "default" });
       setExpenseToEdit(expense); 
       setIsEditExpenseDialogOpen(true);
      return;
    }
    setExpenseToEdit(expense);
    setIsEditExpenseDialogOpen(true);
  };

  const handleConfirmEditExpense = (updatedExpense: Expense) => {
    if (!user) return;
    const expenseIndex = mockExpenses.findIndex(exp => exp.id === updatedExpense.id);
    if (expenseIndex > -1) {
      const originalExpense = mockExpenses[expenseIndex];
      mockExpenses[expenseIndex] = updatedExpense;
      setRefreshTrigger(prev => prev + 1);

      let changesSummary = `Expense ID ${updatedExpense.id.substring(0,8)}... edited by ${user.name}.`;
      if (originalExpense.description !== updatedExpense.description) changesSummary += ` Desc: '${originalExpense.description}' -> '${updatedExpense.description}'.`;
      if (originalExpense.category !== updatedExpense.category) changesSummary += ` Cat: '${originalExpense.category}' -> '${updatedExpense.category}'.`;
      if (originalExpense.amount !== updatedExpense.amount) changesSummary += ` Amt: NRP ${originalExpense.amount.toFixed(2)} -> NRP ${updatedExpense.amount.toFixed(2)}.`;
      if (new Date(originalExpense.date).toDateString() !== new Date(updatedExpense.date).toDateString()) changesSummary += ` Date: ${format(new Date(originalExpense.date), 'MMM dd, yyyy')} -> ${format(new Date(updatedExpense.date), 'MMM dd, yyyy')}.`;
      
      addLog("Expense Edited", changesSummary);
      toast({ title: "Expense Updated", description: `Expense '${updatedExpense.description}' has been updated.` });
    } else {
      toast({ title: "Error", description: "Expense not found for update.", variant: "destructive" });
    }
    setIsEditExpenseDialogOpen(false);
    setExpenseToEdit(null);
  };

  const handleDeleteExpense = (expenseId: string) => {
    const expenseIndex = mockExpenses.findIndex(exp => exp.id === expenseId);
    if (expenseIndex > -1) {
      const systemCategories = ["Product Damage", "Tester Allocation"];
      if (systemCategories.includes(mockExpenses[expenseIndex].category)) {
        toast({ title: "Deletion Restricted", description: `System-generated expenses like '${mockExpenses[expenseIndex].category}' cannot be deleted directly.`, variant: "destructive" });
        return;
      }
      const deletedExpense = mockExpenses.splice(expenseIndex, 1)[0];
      setRefreshTrigger(prev => prev + 1); 
      addLog("Expense Deleted", `Expense '${deletedExpense.description}' (Amount: NRP ${deletedExpense.amount.toFixed(2)}) deleted by ${user?.name || 'System'}.`);
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
              <CardDescription>List of all business expenses. Payment details are in logs.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Total Amount</TableHead>
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
                            onClick={() => openEditExpenseDialog(expense)}
                            title="Edit Expense"
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
      {expenseToEdit && (
        <EditExpenseDialog
            expense={expenseToEdit}
            isOpen={isEditExpenseDialogOpen}
            onClose={() => { setIsEditExpenseDialogOpen(false); setExpenseToEdit(null); }}
            onConfirmEditExpense={handleConfirmEditExpense}
        />
      )}
    </div>
  );
}
