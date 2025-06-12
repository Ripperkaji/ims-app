
import { NextRequest, NextResponse } from 'next/server';
import { mockProducts, mockLogEntries } from '@/lib/data';
import type { Product, LogEntry, AcquisitionPaymentMethod } from '@/types';
import { formatISO } from 'date-fns';

interface SupplierDueItemSummary {
  productId: string;
  productName: string;
  batchId: string;
  acquisitionDate: string; // ISO string
  dueAmount: number;
  supplierName?: string;
  paymentMethod: AcquisitionPaymentMethod;
  totalBatchCost: number;
  cashPaidForBatch: number;
  digitalPaidForBatch: number;
}

interface ExpenseDueItemSummary {
  expenseId: string; // Using log entry ID as expense ID for this context
  description: string;
  category: string;
  totalAmount: number;
  cashPaid?: number;
  digitalPaid?: number;
  dueAmount: number;
  paymentMethod: string; // e.g., "Due", "Hybrid"
  expenseDate: string; // ISO string
}

export async function GET(request: NextRequest) {
  try {
    // Calculate Supplier Dues
    const supplierDueItems: SupplierDueItemSummary[] = [];
    mockProducts.forEach(product => {
      product.acquisitionHistory.forEach(batch => {
        if (batch.dueToSupplier > 0) {
          supplierDueItems.push({
            productId: product.id,
            productName: product.name,
            batchId: batch.batchId,
            acquisitionDate: batch.date, // Assuming batch.date is already ISO string
            dueAmount: batch.dueToSupplier,
            supplierName: batch.supplierName,
            paymentMethod: batch.paymentMethod,
            totalBatchCost: batch.totalBatchCost,
            cashPaidForBatch: batch.cashPaid,
            digitalPaidForBatch: batch.digitalPaid,
          });
        }
      });
    });
    const totalSupplierDue = supplierDueItems.reduce((sum, item) => sum + item.dueAmount, 0);

    // Calculate Expense Dues
    const expenseDueItems: ExpenseDueItemSummary[] = [];
    const expenseRecordedLogs = mockLogEntries.filter(log => log.action === "Expense Recorded");
    expenseRecordedLogs.forEach(log => {
      const mainDetailMatch = log.details.match(/Expense for '([^']*)' \(Category: ([^)]+)\), Amount: NRP ([\d.]+)/i);
      if (!mainDetailMatch) return;

      const description = mainDetailMatch[1];
      const category = mainDetailMatch[2];
      const totalAmount = parseFloat(mainDetailMatch[3]);

      let outstandingDue = 0;
      let cashPaid: number | undefined = undefined;
      let digitalPaid: number | undefined = undefined;
      let paymentMethod = "";

      const hybridEntryMatch = log.details.match(/via Hybrid\s*\(([^)]+)\)/i);
      const directDueMatch = log.details.match(/Marked as Due \(NRP ([\d.]+)\)\./i);

      if (hybridEntryMatch && hybridEntryMatch[1]) {
          const detailsStr = hybridEntryMatch[1];
          const cashMatch = detailsStr.match(/Cash:\s*NRP\s*([\d.]+)/i);
          const digitalMatch = detailsStr.match(/Digital:\s*NRP\s*([\d.]+)/i);
          const duePartMatch = detailsStr.match(/Due:\s*NRP\s*([\d.]+)/i);

          if (duePartMatch && duePartMatch[1]) {
              outstandingDue = parseFloat(duePartMatch[1]);
              paymentMethod = "Hybrid";
              if (cashMatch && cashMatch[1]) cashPaid = parseFloat(cashMatch[1]);
              if (digitalMatch && digitalMatch[1]) digitalPaid = parseFloat(digitalMatch[1]);
          }
      } else if (directDueMatch && directDueMatch[1]) {
          outstandingDue = parseFloat(directDueMatch[1]);
          paymentMethod = "Due";
      }

      if (outstandingDue > 0) {
        expenseDueItems.push({
          expenseId: log.id,
          description,
          category,
          totalAmount,
          cashPaid,
          digitalPaid,
          dueAmount: outstandingDue,
          paymentMethod,
          expenseDate: log.timestamp, // Assuming log.timestamp is ISO string
        });
      }
    });
    const totalExpenseDue = expenseDueItems.reduce((sum, item) => sum + item.dueAmount, 0);

    const summary = {
      supplierDues: {
        totalDue: parseFloat(totalSupplierDue.toFixed(2)),
        items: supplierDueItems.sort((a, b) => new Date(b.acquisitionDate).getTime() - new Date(a.acquisitionDate).getTime()),
      },
      expenseDues: {
        totalDue: parseFloat(totalExpenseDue.toFixed(2)),
        items: expenseDueItems.sort((a, b) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime()),
      },
      totalAccountsPayable: parseFloat((totalSupplierDue + totalExpenseDue).toFixed(2)),
    };

    return NextResponse.json(summary, { status: 200 });

  } catch (error) {
    console.error("Error fetching accounts payable summary:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json({ error: "Failed to fetch accounts payable summary", details: errorMessage }, { status: 500 });
  }
}
