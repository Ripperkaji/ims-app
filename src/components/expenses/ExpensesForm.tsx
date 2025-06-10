
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { CalendarDays, FilePenLine, Landmark, ReceiptText, Info } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format } from "date-fns";
import type { Expense } from '@/types';
import { useToast } from '@/hooks/use-toast';

type ExpensePaymentMethod = 'Cash' | 'Digital' | 'Due' | 'Hybrid';

interface ExpensesFormProps {
  onExpenseAdded: (
    expenseCoreData: Omit<Expense, 'id'>,
    paymentDetails: {
      method: ExpensePaymentMethod;
      cashPaidForLog: number;
      digitalPaidForLog: number;
      dueAmountForLog: number;
    }
  ) => void;
}

export default function ExpensesForm({ onExpenseAdded }: ExpensesFormProps) {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [totalExpenseAmount, setTotalExpenseAmount] = useState('');

  const [paymentMethod, setPaymentMethod] = useState<ExpensePaymentMethod>('Cash');
  const [isHybridPayment, setIsHybridPayment] = useState(false);
  const [expenseCashPaid, setExpenseCashPaid] = useState('');
  const [expenseDigitalPaid, setExpenseDigitalPaid] = useState('');
  const [expenseAmountDue, setExpenseAmountDue] = useState('');
  const [paymentValidationError, setPaymentValidationError] = useState<string | null>(null);

  const numericTotalExpenseAmount = useMemo(() => parseFloat(totalExpenseAmount) || 0, [totalExpenseAmount]);

  useEffect(() => {
    if (paymentMethod === 'Hybrid') {
      setIsHybridPayment(true);
    } else {
      setIsHybridPayment(false);
      setExpenseCashPaid('');
      setExpenseDigitalPaid('');
      setExpenseAmountDue('');
    }
    setPaymentValidationError(null);
  }, [paymentMethod]);

  useEffect(() => {
    if (!isHybridPayment) {
      if (paymentValidationError && paymentValidationError.startsWith("Hybrid payments")) {
           setPaymentValidationError(null);
      }
      return;
    }
    if (numericTotalExpenseAmount === 0 && !expenseCashPaid && !expenseDigitalPaid && !expenseAmountDue) {
        setPaymentValidationError(null);
        return;
    }

    const cash = parseFloat(expenseCashPaid) || 0;
    const digital = parseFloat(expenseDigitalPaid) || 0;
    const due = parseFloat(expenseAmountDue) || 0;

    const filledFields = [expenseCashPaid, expenseDigitalPaid, expenseAmountDue].filter(val => val !== '').length;

    if (filledFields === 2 && numericTotalExpenseAmount > 0) {
      if (expenseCashPaid !== '' && expenseDigitalPaid !== '' && expenseAmountDue === '') {
        const remainingForDue = numericTotalExpenseAmount - cash - digital;
         if (parseFloat(expenseAmountDue || "0").toFixed(2) !== remainingForDue.toFixed(2)) {
            setExpenseAmountDue(remainingForDue >= 0 ? remainingForDue.toFixed(2) : '0.00');
         }
      } else if (expenseCashPaid !== '' && expenseAmountDue !== '' && expenseDigitalPaid === '') {
        const remainingForDigital = numericTotalExpenseAmount - cash - due;
         if (parseFloat(expenseDigitalPaid || "0").toFixed(2) !== remainingForDigital.toFixed(2)) {
            setExpenseDigitalPaid(remainingForDigital >= 0 ? remainingForDigital.toFixed(2) : '0.00');
         }
      } else if (expenseDigitalPaid !== '' && expenseAmountDue !== '' && expenseCashPaid === '') {
        const calculatedCash = numericTotalExpenseAmount - digital - due;
        if (parseFloat(expenseCashPaid || "0").toFixed(2) !== calculatedCash.toFixed(2)) {
            setExpenseCashPaid(calculatedCash >= 0 ? calculatedCash.toFixed(2) : '0.00');
        }
      }
    }
    
    const currentCashVal = parseFloat(expenseCashPaid) || 0;
    const currentDigitalVal = parseFloat(expenseDigitalPaid) || 0;
    const currentDueVal = parseFloat(expenseAmountDue) || 0;
    const sumOfPayments = currentCashVal + currentDigitalVal + currentDueVal;

    if (Math.abs(sumOfPayments - numericTotalExpenseAmount) > 0.001 && (sumOfPayments > 0 || numericTotalExpenseAmount > 0)) {
        setPaymentValidationError(`Hybrid payments (NRP ${sumOfPayments.toFixed(2)}) must sum up to Total Expense Amount (NRP ${numericTotalExpenseAmount.toFixed(2)}).`);
    } else {
        setPaymentValidationError(null);
    }
  }, [expenseCashPaid, expenseDigitalPaid, expenseAmountDue, numericTotalExpenseAmount, isHybridPayment, paymentValidationError]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !description.trim() || !category.trim() || !totalExpenseAmount) {
      toast({ title: "Missing Information", description: "Please fill all primary expense fields (Date, Category, Description, Amount).", variant: "destructive" });
      return;
    }
    const numericAmount = parseFloat(totalExpenseAmount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid positive total amount for the expense.", variant: "destructive" });
      return;
    }
    if (["Product Damage", "Tester Allocation"].includes(category.trim())) {
        toast({ title: "Invalid Category", description: `Category '${category.trim()}' is reserved for system entries. Please choose a different one.`, variant: "destructive" });
        return;
    }

    let finalCashPaid = 0;
    let finalDigitalPaid = 0;
    let finalDueAmount = 0;

    if (isHybridPayment) {
      finalCashPaid = parseFloat(expenseCashPaid) || 0;
      finalDigitalPaid = parseFloat(expenseDigitalPaid) || 0;
      finalDueAmount = parseFloat(expenseAmountDue) || 0;

      if (finalCashPaid < 0 || finalDigitalPaid < 0 || finalDueAmount < 0) {
        toast({ title: "Invalid Payment", description: "Expense payment amounts cannot be negative.", variant: "destructive" }); return;
      }
      if (Math.abs(finalCashPaid + finalDigitalPaid + finalAmountDue - numericAmount) > 0.001 && numericAmount > 0) {
        setPaymentValidationError(`Hybrid payments must sum to Total Expense Amount (NRP ${numericAmount.toFixed(2)}).`);
        toast({ title: "Payment Mismatch", description: `Hybrid payments (NRP ${(finalCashPaid + finalDigitalPaid + finalAmountDue).toFixed(2)}) must sum to Total Expense Amount (NRP ${numericAmount.toFixed(2)}).`, variant: "destructive" });
        return;
      }
    } else {
      switch (paymentMethod) {
        case 'Cash': finalCashPaid = numericAmount; break;
        case 'Digital': finalDigitalPaid = numericAmount; break;
        case 'Due': finalDueAmount = numericAmount; break;
      }
    }
     if (paymentValidationError && isHybridPayment) {
        toast({ title: "Payment Error", description: paymentValidationError, variant: "destructive" });
        return;
    }

    const expenseCoreData: Omit<Expense, 'id'> = {
      date: date.toISOString(),
      description,
      category,
      amount: numericAmount,
      recordedBy: user?.name || 'Admin',
    };

    const paymentDetailsForLog = {
      method: paymentMethod,
      cashPaidForLog: finalCashPaid,
      digitalPaidForLog: finalDigitalPaid,
      dueAmountForLog: finalDueAmount,
    };
    
    onExpenseAdded(expenseCoreData, paymentDetailsForLog);

    setDate(new Date());
    setDescription('');
    setCategory('');
    setTotalExpenseAmount('');
    setPaymentMethod('Cash');
    setExpenseCashPaid('');
    setExpenseDigitalPaid('');
    setExpenseAmountDue('');
    setPaymentValidationError(null);
  };

  return (
    <Card className="w-full shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl font-headline flex items-center gap-2"><FilePenLine /> Record New Expense</CardTitle>
        <CardDescription>Enter details for business expenses and how they were paid.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="expenseDate" className="text-base">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className="w-full justify-start text-left font-normal mt-1 h-9"
                  >
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="expenseTotalAmount" className="text-base">Total Amount (NRP)</Label>
              <div className="relative mt-1">
                <ReceiptText className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="expenseTotalAmount" type="number" value={totalExpenseAmount}
                  onChange={(e) => setTotalExpenseAmount(e.target.value)}
                  placeholder="E.g., 50.00" step="0.01" min="0.01" className="pl-10 h-9" required
                />
              </div>
            </div>
          </div>
          
          <div>
            <Label htmlFor="expenseCategory" className="text-base">Category / Heading</Label>
            <Input
              id="expenseCategory" value={category} onChange={(e) => setCategory(e.target.value)}
              placeholder="E.g., Rent, Utilities, Lunch Cost" className="mt-1 h-9" required
            />
          </div>

          <div>
            <Label htmlFor="expenseDescription" className="text-base">Description</Label>
            <Textarea
              id="expenseDescription" value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed description of the expense..." className="mt-1" rows={3} required
            />
          </div>

          <div>
            <Label htmlFor="expensePaymentMethod" className="text-base">Payment Method</Label>
            <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as ExpensePaymentMethod)}>
              <SelectTrigger id="expensePaymentMethod" className="mt-1 h-9">
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="Digital">Digital Payment</SelectItem>
                <SelectItem value="Due">Due (To be paid later)</SelectItem>
                <SelectItem value="Hybrid">Hybrid Payment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isHybridPayment && (
            <Card className="p-3 border-primary/50 bg-primary/5">
              <CardHeader className="p-0 pb-2">
                <CardTitle className="text-base font-semibold">Hybrid Payment Breakdown</CardTitle>
                <CardDescription className="text-xs">Amounts must sum to the total expense amount.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 p-0">
                <div className="space-y-1">
                  <Label htmlFor="expenseCashPaid" className="text-xs">Cash Paid (NRP)</Label>
                  <Input id="expenseCashPaid" type="number" value={expenseCashPaid} onChange={(e) => setExpenseCashPaid(e.target.value)} placeholder="0.00" min="0" step="0.01" className="h-8 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="expenseDigitalPaid" className="text-xs">Digital Paid (NRP)</Label>
                  <Input id="expenseDigitalPaid" type="number" value={expenseDigitalPaid} onChange={(e) => setExpenseDigitalPaid(e.target.value)} placeholder="0.00" min="0" step="0.01" className="h-8 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="expenseAmountDue" className="text-xs">Amount Due for this Expense (NRP)</Label>
                  <Input id="expenseAmountDue" type="number" value={expenseAmountDue} onChange={(e) => setExpenseAmountDue(e.target.value)} placeholder="0.00" min="0" step="0.01" className="h-8 text-xs" />
                </div>
                {paymentValidationError && (
                  <Alert variant="destructive" className="mt-1.5 p-2 text-xs">
                    <Info className="h-3.5 w-3.5" />
                    <AlertTitle className="text-xs font-semibold">Payment Error</AlertTitle>
                    <AlertDescription>{paymentValidationError}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
        <CardFooter>
          <Button 
            type="submit" 
            size="lg" 
            className="w-full text-base py-2.5"
            disabled={isHybridPayment && !!paymentValidationError}
          >
            <Landmark className="mr-2 h-5 w-5" /> Record Expense
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
