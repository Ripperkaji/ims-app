
import type { Product, Sale, Expense, LogEntry, ProductType } from '@/types';

export const mockProducts: Product[] = [
  { 
    id: 'prod1', 
    name: 'Vape Juice - Mango Tango', 
    category: 'E-liquid Nic Salt',
    sellingPrice: 15.99, 
    costPrice: 9.50,
    totalAcquiredStock: 70,
    damagedQuantity: 2,
    stock: 50  // Remaining: 70 - (sold: example 18) - 2 = 50
  },
  { 
    id: 'prod2', 
    name: 'Vape Mod - Smok X', 
    category: 'POD/MOD Devices',
    sellingPrice: 49.99, 
    costPrice: 30.00,
    totalAcquiredStock: 35,
    damagedQuantity: 1,
    stock: 25  // Remaining: 35 - (sold: example 9) - 1 = 25
  },
  { 
    id: 'prod3', 
    name: 'Coils - Pack of 5', 
    category: 'Coils',
    sellingPrice: 9.99, 
    costPrice: 5.00,
    totalAcquiredStock: 120,
    damagedQuantity: 0,
    stock: 100 // Remaining: 120 - (sold: example 20) - 0 = 100
  },
  { 
    id: 'prod4', 
    name: 'Disposable Vape - Blueberry Ice', 
    category: 'Disposables',
    sellingPrice: 7.50, 
    costPrice: 3.75,
    totalAcquiredStock: 100,
    damagedQuantity: 5,
    stock: 75  // Remaining: 100 - (sold: example 20) - 5 = 75
  },
  { 
    id: 'prod5', 
    name: 'Vape Pen Kit - Starter', 
    category: 'POD/MOD Devices',
    sellingPrice: 29.99, 
    costPrice: 18.00,
    totalAcquiredStock: 40,
    damagedQuantity: 0,
    stock: 30  // Remaining: 40 - (sold: example 10) - 0 = 30
  },
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
    saleOrigin: 'store',
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
    flaggedComment: 'Customer claims price was different for one item. Resolved by Admin Eve on Oct 10, 2023 10:30: Adjusted item price and confirmed with customer.',
    saleOrigin: 'store',
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
    saleOrigin: 'online',
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
    saleOrigin: 'store',
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
    details: 'Sale ID sale4-hybrid for Hybrid Harry (96ZZZZZZZZ), Total: NRP 45.98. Paid NRP 20.00 by cash, NRP 15.98 by digital, NRP 10.00 due. Status: Due. Origin: store.' 
  },
  { 
    id: 'log1', 
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 5*60*1000).toISOString(), 
    user: 'Staff Alice', 
    action: 'Sale Created', 
    details: 'Sale ID sale1 for John Doe (98XXXXXXXX), Total: NRP 41.97. Payment: Credit Card. Status: Paid. Origin: store.' 
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
    details: 'Sale ID sale2 for Jane Smith (97YYYYYYYY), Total: NRP 37.50. Payment: Due. Status: Due. Origin: store.' 
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

// Initialize new product fields for existing sales if not present
mockSales.forEach(sale => {
  if (sale.isFlagged === undefined) {
    sale.isFlagged = false;
  }
  if (sale.flaggedComment === undefined) {
    sale.flaggedComment = '';
  }
  if (sale.saleOrigin === undefined) { 
    sale.saleOrigin = 'store';
  }
});
