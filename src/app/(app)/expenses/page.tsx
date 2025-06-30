

"use client";

import ExpensesForm from "@/components/expenses/ExpensesForm";
import EditExpenseDialog from "@/components/expenses/EditExpenseDialog";
import { useAuthStore } from "@/stores/authStore";
import { mockExpenses, mockLogEntries } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, Trash2, CalendarIcon, Filter, X } from "lucide-react";
import { format, parseISO, startOfDay, endOfDay, isValid, parse } from 'date-fns';
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
import { cn, formatCurrency } from "@/lib/utils";

const ALL_MONTHS_FILTER_VALUE = "ALL_MONTHS_FILTER_VALUE";
const ALL_CATEGORIES_FILTER_VALUE = "ALL_CATEGORIES_FILTER_VALUE";
const ALL_USERS_FILTER_VALUE = "ALL_USERS_FILTER_VALUE";


export default function ExpensesPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { toast } = useToast();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  const [isEditExpenseDialogOpen, setIsEditExpenseDialogOpen] = useState(false);

  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [displayedExpenses, setDisplayedExpenses] = useState<Expense[]>([]);

  const [filterDate, setFilterDate] = useState<Date | undefined>(undefined);
  const [filterMonthYear, setFilterMonthYear] = useState<string>(ALL_MONTHS_FILTER_VALUE);
  const [filterCategory, setFilterCategory] = useState<string>(ALL_CATEGORIES_FILTER_VALUE);
  const [filterRecordedBy, setFilterRecordedBy] = useState<string>(ALL_USERS_FILTER_VALUE);
  const [isFilterActive, setIsFilterActive] = useState<boolean>(false);
  const [isCalendarPopoverOpen, setIsCalendarPopoverOpen] = useState<boolean>(false);

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    allExpenses.forEach(expense => {
      months.add(format(parseISO(expense.date), 'yyyy-MM'));
    });
    return Array.from(months).sort((a, b) => b.localeCompare(a));
  }, [allExpenses]);

  const availableCategories = useMemo(() => {
    const categories = new Set(allExpenses.map(expense => expense.category));
    return Array.from(categories).sort();
  }, [allExpenses]);

  const availableUsers = useMemo(() => {
    const users = new Set(allExpenses.map(expense => expense.recordedBy));
    return Array.from(users).sort();
  }, [allExpenses]);

  useEffect(() => {
    const sortedExpenses = [...mockExpenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setAllExpenses(sortedExpenses);
    if (!isFilterActive) {
      setDisplayedExpenses(sortedExpenses);
    } else {
      applyFiltersHandler(sortedExpenses);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger, mockExpenses.length]);


  useEffect(() => {
    if (user && user.role !== 'admin') {
      toast({ title: "Access Denied", description: "You do not have permission to view this page.", variant: "destructive"});
      router.push('/dashboard');
    }
  }, [user, router, toast]);


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
    mockLogEntries.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const applyFiltersHandler = (sourceData = allExpenses) => {
    let tempFilteredExpenses = [...sourceData];

    if (filterDate) {
        const fDateStart = startOfDay(filterDate);
        const fDateEnd = endOfDay(filterDate);
        tempFilteredExpenses = tempFilteredExpenses.filter(expense => {
            const expenseDate = parseISO(expense.date);
            return isValid(expenseDate) && expenseDate >= fDateStart && expenseDate <= fDateEnd;
        });
    } else if (filterMonthYear && filterMonthYear !== ALL_MONTHS_FILTER_VALUE) {
        tempFilteredExpenses = tempFilteredExpenses.filter(expense => {
            return format(parseISO(expense.date), 'yyyy-MM') === filterMonthYear;
        });
    }


    if (filterCategory && filterCategory !== ALL_CATEGORIES_FILTER_VALUE) {
        tempFilteredExpenses = tempFilteredExpenses.filter(expense =>
            expense.category === filterCategory
        );
    }

    if (filterRecordedBy && filterRecordedBy !== ALL_USERS_FILTER_VALUE) {
        tempFilteredExpenses = tempFilteredExpenses.filter(expense =>
            expense.recordedBy === filterRecordedBy
        );
    }
    
    setDisplayedExpenses(tempFilteredExpenses);
    const activeFilters = !!filterDate || (!!filterMonthYear && filterMonthYear !== ALL_MONTHS_FILTER_VALUE) || (!!filterCategory && filterCategory !== ALL_CATEGORIES_FILTER_VALUE) || (!!filterRecordedBy && filterRecordedBy !== ALL_USERS_FILTER_VALUE);
    setIsFilterActive(activeFilters);
    if (activeFilters) {
        toast({ title: "Filters Applied", description: `${tempFilteredExpenses.length} expenses found.`});
    }
  };

  const clearFiltersHandler = () => {
    setFilterDate(undefined);
    setFilterMonthYear(ALL_MONTHS_FILTER_VALUE);
    setFilterCategory(ALL_CATEGORIES_FILTER_VALUE);
    setFilterRecordedBy(ALL_USERS_FILTER_VALUE);
    setDisplayedExpenses(allExpenses);
    setIsFilterActive(false);
    toast({ title: "Filters Cleared", description: "Showing all expenses."});
  };


  const handleExpenseAdded = (expenseData: Omit<Expense, 'id'>) => {
    if (!user) return;
    const newExpense: Expense = {
      id: `exp-${Date.now()}-${Math.random().toString(36).substring(2,7)}`,
      ...expenseData,
    };
    
    mockExpenses.unshift(newExpense);
    setRefreshTrigger(prev => prev + 1);

    let paymentLogString = `Paid via ${newExpense.paymentMethod}.`;
    if (newExpense.paymentMethod === 'Hybrid') {
      const parts = [];
      if (newExpense.cashPaid > 0) parts.push(`Cash: NRP ${formatCurrency(newExpense.cashPaid)}`);
      if (newExpense.digitalPaid > 0) parts.push(`Digital: NRP ${formatCurrency(newExpense.digitalPaid)}`);
      if (newExpense.amountDue > 0) parts.push(`Due: NRP ${formatCurrency(newExpense.amountDue)}`);
      paymentLogString = `Paid via Hybrid (${parts.join(', ')}).`;
    } else if (newExpense.paymentMethod === 'Due') {
        paymentLogString = `Marked as Due (NRP ${formatCurrency(newExpense.amount)}).`;
    }

    const logDetails = `Expense for '${newExpense.description}' (Category: ${newExpense.category}), Amount: NRP ${formatCurrency(newExpense.amount)} recorded by ${user.name}. ${paymentLogString}`;
    addLog("Expense Recorded", logDetails);

    toast({ title: "Expense Recorded!", description: `${newExpense.category} expense of NRP ${formatCurrency(newExpense.amount)} recorded.`});
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
      if (originalExpense.amount !== updatedExpense.amount) changesSummary += ` Amt: NRP ${formatCurrency(originalExpense.amount)} -> NRP ${formatCurrency(updatedExpense.amount)}.`;
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
      addLog("Expense Deleted", `Expense '${deletedExpense.description}' (Amount: NRP ${formatCurrency(deletedExpense.amount)}) deleted by ${user?.name || 'System'}.`);
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
      
      <ExpensesForm onExpenseAdded={handleExpenseAdded} />
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Recorded Expenses</CardTitle>
          <CardDescription>List of all business expenses. Use filters to refine the list.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-3 border rounded-md bg-muted/50">
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-1"><Filter className="h-4 w-4 text-primary"/> Filter Expenses</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                    <Label htmlFor="filterDate" className="text-xs">Date</Label>
                    <Popover open={isCalendarPopoverOpen} onOpenChange={setIsCalendarPopoverOpen}>
                        <PopoverTrigger asChild>
                            <Button
                            variant={"outline"}
                            className={cn(
                                "w-full justify-start text-left font-normal mt-0.5 h-9 text-xs",
                                !filterDate && "text-muted-foreground"
                            )}
                            onClick={() => { setFilterMonthYear(ALL_MONTHS_FILTER_VALUE); setIsCalendarPopoverOpen(!isCalendarPopoverOpen);}}
                            >
                            <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                            {filterDate ? format(filterDate, "PPP") : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                            mode="single"
                            selected={filterDate}
                            onSelect={(date) => {setFilterDate(date); setFilterMonthYear(ALL_MONTHS_FILTER_VALUE); setIsCalendarPopoverOpen(false);}}
                            initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </div>
                <div>
                    <Label htmlFor="filterMonthYear" className="text-xs">Month/Year</Label>
                    <Select
                        value={filterMonthYear || ALL_MONTHS_FILTER_VALUE}
                        onValueChange={(value) => {
                            setFilterMonthYear(value === ALL_MONTHS_FILTER_VALUE ? ALL_MONTHS_FILTER_VALUE : value);
                            setFilterDate(undefined); // Clear specific date if month is chosen
                        }}
                    >
                        <SelectTrigger id="filterMonthYear" className="mt-0.5 h-9 text-xs">
                            <SelectValue placeholder="Select Month/Year" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL_MONTHS_FILTER_VALUE} className="text-xs">All Months</SelectItem>
                            {availableMonths.map(month => (
                            <SelectItem key={month} value={month} className="text-xs">
                                {format(parse(month, 'yyyy-MM', new Date()), 'MMMM yyyy')}
                            </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                  <Label htmlFor="filterCategory" className="text-xs">Category</Label>
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger id="filterCategory" className="mt-0.5 h-9 text-xs">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_CATEGORIES_FILTER_VALUE} className="text-xs">All Categories</SelectItem>
                      {availableCategories.map(cat => (
                        <SelectItem key={cat} value={cat} className="text-xs">{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="filterRecordedBy" className="text-xs">Recorded By</Label>
                  <Select value={filterRecordedBy} onValueChange={setFilterRecordedBy}>
                    <SelectTrigger id="filterRecordedBy" className="mt-0.5 h-9 text-xs">
                      <SelectValue placeholder="Select User" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_USERS_FILTER_VALUE} className="text-xs">All Users</SelectItem>
                      {availableUsers.map(user => (
                        <SelectItem key={user} value={user} className="text-xs">{user}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
            </div>
            <div className="mt-3 flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={clearFiltersHandler} className="text-xs"><X className="mr-1 h-3.5 w-3.5"/>Clear</Button>
                <Button size="sm" onClick={() => applyFiltersHandler()} className="text-xs"><Filter className="mr-1 h-3.5 w-3.5"/>Apply</Button>
            </div>
          </div>

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
                  <TableCell>{format(parseISO(expense.date), 'MMM dd, yyyy')}</TableCell>
                  <TableCell className="font-medium">{expense.category}</TableCell>
                  <TableCell className="truncate max-w-xs">{expense.description}</TableCell>
                  <TableCell>NRP {formatCurrency(expense.amount)}</TableCell>
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
              {isFilterActive ? "No expenses found matching your filters." : "No expenses recorded yet."}
            </div>
          )}
        </CardContent>
      </Card>
      
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
    
