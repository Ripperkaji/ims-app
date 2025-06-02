
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
    customerContact: '98XXXXXXXX',
    items: [
      { productId: 'prod1', productName: 'Vape Juice - Mango Tango', quantity: 2, unitPrice: 15.99, totalPrice: 31.98 },
      { productId: 'prod3', productName: 'Coils - Pack of 5', quantity: 1, unitPrice: 9.99, totalPrice: 9.99 },
    ],
    totalAmount: 41.97,
    cashPaid: 0,
    digitalPaid: 41.97,
    amountDue: 0,
    formPaymentMethod: 'Credit Card',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'Paid',
    createdBy: 'Staff Alice',
    isFlagged: false,
    flaggedComment: '',
  },
  {
    id: 'sale2',
    customerName: 'Jane Smith',
    customerContact: '97YYYYYYYY',
    items: [
      { productId: 'prod4', productName: 'Disposable Vape - Blueberry Ice', quantity: 5, unitPrice: 7.50, totalPrice: 37.50 },
    ],
    totalAmount: 37.50,
    cashPaid: 0,
    digitalPaid: 0,
    amountDue: 37.50,
    formPaymentMethod: 'Due',
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'Due',
    createdBy: 'Staff Bob',
    isFlagged: true,
    flaggedComment: 'Customer claims price was different for one item.',
  },
  {
    id: 'sale3',
    customerName: 'Mike Johnson',
    items: [
      { productId: 'prod2', productName: 'Vape Mod - Smok X', quantity: 1, unitPrice: 49.99, totalPrice: 49.99 },
    ],
    totalAmount: 49.99,
    cashPaid: 49.99,
    digitalPaid: 0,
    amountDue: 0,
    formPaymentMethod: 'Cash',
    date: new Date().toISOString(),
    status: 'Paid',
    createdBy: 'Staff Alice',
    isFlagged: false,
    flaggedComment: '',
  },
   {
    id: 'sale4-hybrid',
    customerName: 'Hybrid Harry',
    customerContact: '96ZZZZZZZZ',
    items: [
      { productId: 'prod1', productName: 'Vape Juice - Mango Tango', quantity: 1, unitPrice: 15.99, totalPrice: 15.99 },
      { productId: 'prod5', productName: 'Vape Pen Kit - Starter', quantity: 1, unitPrice: 29.99, totalPrice: 29.99 },
    ],
    totalAmount: 45.98,
    cashPaid: 20.00,
    digitalPaid: 15.98,
    amountDue: 10.00,
    formPaymentMethod: 'Hybrid',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'Due',
    createdBy: 'Admin Eve',
    isFlagged: false,
    flaggedComment: '',
  }
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
    id: 'log0', 
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 - 10*60*1000).toISOString(), 
    user: 'Admin Eve', 
    action: 'Sale Created', 
    details: 'Sale ID sale4-hybrid for Hybrid Harry (96ZZZZZZZZ), Total: NRP 45.98. Paid NRP 20.00 by cash, NRP 15.98 by digital, NRP 10.00 due. Status: Due.' 
  },
  { 
    id: 'log1', 
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 5*60*1000).toISOString(), 
    user: 'Staff Alice', 
    action: 'Sale Created', 
    details: 'Sale ID sale1 for John Doe (98XXXXXXXX), Total: NRP 41.97. Payment: Credit Card. Status: Paid.' 
  },
  { 
    id: 'log1b', 
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 - 2*60*1000).toISOString(), 
    user: 'Staff Bob', 
    action: 'Sale Flagged', 
    details: 'Sale ID sale2 for Jane Smith flagged by Staff Bob. Comment: Customer claims price was different for one item.' 
  },
  { 
    id: 'log2', 
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 - 3*60*1000).toISOString(), 
    user: 'Staff Bob', 
    action: 'Sale Created', 
    details: 'Sale ID sale2 for Jane Smith (97YYYYYYYY), Total: NRP 37.50. Payment: Due. Status: Due.' 
  },
  { 
    id: 'log3', 
    timestamp: new Date().toISOString(), 
    user: 'Admin Eve', 
    action: 'Expense Added', 
    details: 'Expense ID exp3, Category: Food, Amount: NRP 45.50' 
  },
  {
    id: 'log4',
    timestamp: new Date(Date.now() - 20*60*1000).toISOString(),
    user: 'Admin Eve',
    action: 'Product Added',
    details: "Product 'Vape Pen Kit - Starter' (ID: prod5...) added with price NRP 29.99 and stock 30."
  }
].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

// Initialize isFlagged and flaggedComment for existing sales if not present
mockSales.forEach(sale => {
  if (sale.isFlagged === undefined) {
    sale.isFlagged = false;
  }
  if (sale.flaggedComment === undefined) {
    sale.flaggedComment = '';
  }
});
