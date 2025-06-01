import type { Product, Sale, Expense, LogEntry } from '@/types';

export const mockProducts: Product[] = [
  { id: 'prod1', name: 'Vape Juice - Mango Tango', price: 15.99, stock: 50 },
  { id: 'prod2', name: 'Vape Mod - Smok X', price: 49.99, stock: 25 },
  { id: 'prod3', name: 'Coils - Pack of 5', price: 9.99, stock: 100 },
  { id: 'prod4', name: 'Disposable Vape - Blueberry Ice', price: 7.50, stock: 75 },
  { id: 'prod5', name: 'Vape Pen Kit - Starter', price: 29.99, stock: 30 },
];

export const mockSales: Sale[] = [
  {
    id: 'sale1',
    customerName: 'John Doe',
    items: [
      { productId: 'prod1', productName: 'Vape Juice - Mango Tango', quantity: 2, unitPrice: 15.99, totalPrice: 31.98 },
      { productId: 'prod3', productName: 'Coils - Pack of 5', quantity: 1, unitPrice: 9.99, totalPrice: 9.99 },
    ],
    totalAmount: 41.97,
    paymentMethod: 'Credit Card',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'Paid',
    createdBy: 'Staff Alice',
  },
  {
    id: 'sale2',
    customerName: 'Jane Smith',
    items: [
      { productId: 'prod4', productName: 'Disposable Vape - Blueberry Ice', quantity: 5, unitPrice: 7.50, totalPrice: 37.50 },
    ],
    totalAmount: 37.50,
    paymentMethod: 'Due',
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'Due',
    createdBy: 'Staff Bob',
  },
  {
    id: 'sale3',
    customerName: 'Mike Johnson',
    items: [
      { productId: 'prod2', productName: 'Vape Mod - Smok X', quantity: 1, unitPrice: 49.99, totalPrice: 49.99 },
    ],
    totalAmount: 49.99,
    paymentMethod: 'Cash',
    date: new Date().toISOString(),
    status: 'Paid',
    createdBy: 'Staff Alice',
  },
];

export const mockExpenses: Expense[] = [
  { 
    id: 'exp1', 
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), 
    description: 'Monthly Rent', 
    category: 'Rent', 
    amount: 1200.00,
    recordedBy: 'Admin Eve' 
  },
  { 
    id: 'exp2', 
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), 
    description: 'Electricity Bill', 
    category: 'Utilities', 
    amount: 150.75,
    recordedBy: 'Admin Eve'
  },
  { 
    id: 'exp3', 
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), 
    description: 'Staff Lunch', 
    category: 'Food', 
    amount: 45.50,
    recordedBy: 'Admin Eve'
  },
];

export const mockLogEntries: LogEntry[] = [
  { 
    id: 'log1', 
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 5*60*1000).toISOString(), 
    user: 'Staff Alice', 
    action: 'Sale Created', 
    details: 'Sale ID sale1 for John Doe, Total: $41.97' 
  },
  { 
    id: 'log2', 
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 - 3*60*1000).toISOString(), 
    user: 'Staff Bob', 
    action: 'Sale Created (Due)', 
    details: 'Sale ID sale2 for Jane Smith, Total: $37.50, Status: Due' 
  },
  { 
    id: 'log3', 
    timestamp: new Date().toISOString(), 
    user: 'Admin Eve', 
    action: 'Expense Added', 
    details: 'Expense ID exp3, Category: Food, Amount: $45.50' 
  },
];
