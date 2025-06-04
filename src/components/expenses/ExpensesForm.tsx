
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { CalendarDays, FilePenLine, Landmark, ReceiptText } from 'lucide-react'; // Using Landmark as generic currency icon
import { useAuth } from '@/contexts/AuthContext';
// Removed useToast here as parent (ExpensesPage) will handle it
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import type { Expense } from '@/types'; // Import Expense type
import { useToast } from '@/hooks/use-toast';


export default function ExpensesForm({ onExpenseAdded }: { onExpenseAdded: (newExpense: Expense) => void }) {
  const { user } = useAuth();
  const { toast } = useToast(); // Keep toast for form-level validation
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !description.trim() || !category.trim() || !amount) {
      toast({ title: "Missing Information", description: "Please fill all expense fields.", variant: "destructive" });
      return;
    }
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid positive amount.", variant: "destructive" });
      return;
    }
    if (["Product Damage", "Tester Allocation"].includes(category.trim())) {
        toast({ title: "Invalid Category", description: `Category '${category.trim()}' is reserved for system entries. Please choose a different one.`, variant: "destructive" });
        return;
    }


    // Create the newExpense object but don't include 'id' as parent (ExpensesPage) will handle it or it will be generated there
    const newExpenseData: Expense = {
      id: `exp-manual-${Date.now()}`, // Manual entries can still generate ID here, or parent can handle
      date: date.toISOString(),
      description,
      category,
      amount: numericAmount,
      recordedBy: user?.name || 'Admin', // Or ensure user is always available
    };
    
    onExpenseAdded(newExpenseData); // Pass the fully formed Expense object

    // Reset form fields
    setDate(new Date());
    setDescription('');
    setCategory('');
    setAmount('');
  };

  return (
    <Card className="w-full shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl font-headline flex items-center gap-2"><FilePenLine /> Record New Expense</CardTitle>
        <CardDescription>Enter details for business expenses.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="expenseDate" className="text-base">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className="w-full justify-start text-left font-normal mt-1"
                  >
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="expenseAmount" className="text-base">Amount (NRP)</Label>
              <div className="relative mt-1">
                <ReceiptText className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="expenseAmount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="E.g., 50.00"
                  step="0.01"
                  min="0.01"
                  className="pl-10"
                  required
                />
              </div>
            </div>
          </div>
          
          <div>
            <Label htmlFor="expenseCategory" className="text-base">Category / Heading</Label>
            <Input
              id="expenseCategory"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="E.g., Rent, Utilities, Lunch Cost"
              className="mt-1"
              required
            />
          </div>

          <div>
            <Label htmlFor="expenseDescription" className="text-base">Description</Label>
            <Textarea
              id="expenseDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed description of the expense..."
              className="mt-1"
              rows={3}
              required
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" size="lg" className="w-full text-lg py-3">
            <Landmark className="mr-2 h-5 w-5" /> Record Expense
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
