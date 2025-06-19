
import { NextRequest, NextResponse } from 'next/server';
import { mockExpenses, addLogEntry } from '@/lib/data';
import type { Expense } from '@/types';
import { z } from 'zod';
import { formatISO, parseISO, startOfDay, endOfDay, isValid } from 'date-fns';

const expenseSchema = z.object({
  date: z.string().refine(val => isValid(parseISO(val)), { message: "Invalid date format. Use ISO string."}),
  description: z.string().min(1, "Description is required."),
  category: z.string().min(1, "Category is required.")
    .refine(val => !["Product Damage", "Tester Allocation"].includes(val), {
      message: "Categories 'Product Damage' and 'Tester Allocation' are reserved for system entries."
    }),
  amount: z.number().positive("Amount must be a positive number."),
  recordedBy: z.string().min(1, "Recorded by user is required."),
  paymentDetails: z.object({ // For logging purposes
    method: z.string(),
    cashPaidForLog: z.number().min(0),
    digitalPaidForLog: z.number().min(0),
    dueAmountForLog: z.number().min(0),
  })
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get('date');
  const categoryParam = searchParams.get('category');
  const recordedByParam = searchParams.get('recordedBy');

  let filteredExpenses = [...mockExpenses];

  if (dateParam) {
    try {
      const filterDate = parseISO(dateParam);
      if (isValid(filterDate)) {
        const startDate = startOfDay(filterDate);
        const endDate = endOfDay(filterDate);
        filteredExpenses = filteredExpenses.filter(expense => {
          const expenseDate = parseISO(expense.date);
          return isValid(expenseDate) && expenseDate >= startDate && expenseDate <= endDate;
        });
      }
    } catch (e) { /* Ignore invalid date */ }
  }

  if (categoryParam) {
    filteredExpenses = filteredExpenses.filter(expense =>
      expense.category.toLowerCase().includes(categoryParam.toLowerCase())
    );
  }

  if (recordedByParam) {
    filteredExpenses = filteredExpenses.filter(expense =>
      expense.recordedBy.toLowerCase().includes(recordedByParam.toLowerCase())
    );
  }

  return NextResponse.json(filteredExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = expenseSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: "Invalid input", details: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { date, description, category, amount, recordedBy, paymentDetails } = validation.data;

    const newExpense: Expense = {
      id: `exp-${Date.now()}-${Math.random().toString(36).substring(2,7)}`,
      date: formatISO(parseISO(date)), // Ensure stored date is consistent ISO string
      description,
      category,
      amount,
      recordedBy,
    };

    mockExpenses.unshift(newExpense);
    mockExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

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
    
    addLogEntry(recordedBy, "Expense Recorded via API", `Expense for '${description}' (Category: ${category}), Amount: NRP ${amount.toFixed(2)}. ${paymentLogString}`);

    return NextResponse.json(newExpense, { status: 201 });

  } catch (e) {
    console.error("Error in POST /api/expenses:", e);
    const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred.";
    return NextResponse.json({ error: "Failed to create expense.", details: errorMessage }, { status: 500 });
  }
}

    