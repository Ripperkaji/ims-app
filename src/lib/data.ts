
import type { Product, Sale, Expense, LogEntry, AcquisitionBatch, AcquisitionPaymentMethod, ExpensePaymentMethod } from '@/types';
import { formatISO } from 'date-fns';
import { calculateCurrentStock as calculateStockShared } from './productUtils'; // For internal use if needed

// Helper to create initial acquisition batch
const createInitialBatch = (
  productId: string,
  date: string, // Expecting ISO string
  qty: number,
  cost: number,
  mrp: number,
  paymentMethod: AcquisitionPaymentMethod,
  cash: number,
  digital: number,
  due: number,
  addedBy: string,
  supplier?: string,
  condition: string = "Initial Stock"
): AcquisitionBatch => ({
  batchId: `batch-${productId}-${new Date(date).getTime()}-${Math.random().toString(36).substring(2,7)}`,
  date,
  condition,
  supplierName: supplier,
  quantityAdded: qty,
  costPricePerUnit: cost,
  sellingPricePerUnitAtAcquisition: mrp,
  paymentMethod,
  totalBatchCost: qty * cost,
  cashPaid: cash,
  digitalPaid: digital,
  dueToSupplier: due,
  addedBy,
});

export const mockProducts: Product[] = []; // Initially empty, populated after initialization or via UI
export const mockSales: Sale[] = []; // Initially empty
export const mockExpenses: Expense[] = []; // Initially empty
export const mockLogEntries: LogEntry[] = []; // Initially empty
export let mockManagedUsers: any[] = []; // Placeholder
export let mockCapital = {
  cashInHand: 0,
  lastUpdated: new Date().toISOString(),
};

// --- Core Data Functions ---

export function addLogEntry(actorName: string, action: string, details: string): LogEntry {
    const newLog: LogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      user: actorName,
      action,
      details,
    };
    mockLogEntries.unshift(newLog);
    return newLog;
}

export function addSystemExpense(expenseData: Omit<Expense, 'id'>, actorName: string = 'System'): Expense {
  const newExpense: Expense = { 
      id: `exp-sys-${Date.now()}-${Math.random().toString(36).substring(2,7)}`, 
      ...expenseData,
      recordedBy: actorName, // Ensure recordedBy is set
      paymentMethod: 'Digital',
      cashPaid: expenseData.amount,
      digitalPaid: 0,
      amountDue: 0,
  };
  mockExpenses.push(newExpense);
  mockExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  addLogEntry(
      actorName, 
      'System Expense Recorded', 
      `Expense Category: ${expenseData.category}, Amount: NRP ${expenseData.amount.toFixed(2)}. Desc: ${expenseData.description}`
  );
  return newExpense;
}

export const updateCashInHand = (newAmount: number, actorName: string): { newAmount: number; lastUpdated: string } => {
  const oldAmount = mockCapital.cashInHand;
  mockCapital.cashInHand = newAmount;
  mockCapital.lastUpdated = new Date().toISOString();
  
  addLogEntry(
    actorName,
    'Capital Updated',
    `Cash in Hand updated by ${actorName}. Old: NRP ${oldAmount.toFixed(2)}, New: NRP ${newAmount.toFixed(2)}.`
  );
  
  return { newAmount: mockCapital.cashInHand, lastUpdated: mockCapital.lastUpdated };
};
