
import type { Product, Sale, Expense, LogEntry, ProductType } from '@/types';

export const mockProducts: Product[] = [
  // Existing Products (some details might be slightly adjusted for variety)
  {
    id: 'prod1',
    name: 'Vape Juice - Mango Tango',
    category: 'E-liquid Nic Salt',
    sellingPrice: 15.99,
    costPrice: 9.50,
    totalAcquiredStock: 70,
    damagedQuantity: 2,
    stock: 50,
    testerQuantity: 1
  },
  {
    id: 'prod2',
    name: 'Vape Mod - Smok X',
    category: 'POD/MOD Devices',
    sellingPrice: 49.99,
    costPrice: 30.00,
    totalAcquiredStock: 35,
    damagedQuantity: 1,
    stock: 25,
    testerQuantity: 1
  },
  {
    id: 'prod3',
    name: 'Coils - Standard Pack (5pcs)', // Renamed for clarity
    category: 'Coils',
    sellingPrice: 9.99,
    costPrice: 5.00,
    totalAcquiredStock: 120,
    damagedQuantity: 0,
    stock: 100,
    testerQuantity: 0
  },
  {
    id: 'prod4',
    name: 'Disposable Vape - Blueberry Ice',
    category: 'Disposables',
    sellingPrice: 7.50,
    costPrice: 3.75,
    totalAcquiredStock: 100,
    damagedQuantity: 5,
    stock: 75,
    testerQuantity: 1
  },
  {
    id: 'prod5',
    name: 'Vape Pen Kit - Starter',
    category: 'POD/MOD Devices',
    sellingPrice: 29.99,
    costPrice: 18.00,
    totalAcquiredStock: 40,
    damagedQuantity: 0,
    stock: 30,
    testerQuantity: 0
  },

  // Category: Disposables (Ensuring at least 3)
  {
    id: 'disp1',
    name: 'Disposable - Watermelon Chill',
    category: 'Disposables',
    sellingPrice: 8.00,
    costPrice: 4.00,
    totalAcquiredStock: 150,
    damagedQuantity: 3,
    stock: 120,
    testerQuantity: 0
  },
  {
    id: 'disp2',
    name: 'Disposable - Cool Mint Blast',
    category: 'Disposables',
    sellingPrice: 7.75,
    costPrice: 3.80,
    totalAcquiredStock: 120,
    damagedQuantity: 2,
    stock: 90,
    testerQuantity: 0
  },
  // prod4 is already a disposable

  // Category: E-liquid Nic Salt (Ensuring at least 3)
  {
    id: 'nicsalt1',
    name: 'Nic Salt - Strawberry Kiwi',
    category: 'E-liquid Nic Salt',
    sellingPrice: 16.50,
    costPrice: 10.00,
    totalAcquiredStock: 80,
    damagedQuantity: 1,
    stock: 60,
    testerQuantity: 0
  },
  {
    id: 'nicsalt2',
    name: 'Nic Salt - Blue Razz Ice',
    category: 'E-liquid Nic Salt',
    sellingPrice: 16.25,
    costPrice: 9.75,
    totalAcquiredStock: 90,
    damagedQuantity: 4,
    stock: 70,
    testerQuantity: 0
  },
  // prod1 is already a nic salt

  // Category: E-liquid Free Base (Ensuring at least 3)
  {
    id: 'freebase1',
    name: 'Freebase - Classic Tobacco',
    category: 'E-liquid Free Base',
    sellingPrice: 14.00,
    costPrice: 8.00,
    totalAcquiredStock: 60,
    damagedQuantity: 0,
    stock: 45,
    testerQuantity: 0
  },
  {
    id: 'freebase2',
    name: 'Freebase - Vanilla Custard',
    category: 'E-liquid Free Base',
    sellingPrice: 14.50,
    costPrice: 8.50,
    totalAcquiredStock: 75,
    damagedQuantity: 2,
    stock: 55,
    testerQuantity: 0
  },
  {
    id: 'freebase3',
    name: 'Freebase - Green Apple Zing',
    category: 'E-liquid Free Base',
    sellingPrice: 14.25,
    costPrice: 8.25,
    totalAcquiredStock: 65,
    damagedQuantity: 1,
    stock: 50,
    testerQuantity: 0
  },

  // Category: Coils (Ensuring at least 3)
  {
    id: 'coil1',
    name: 'Mesh Coils - 0.4ohm (3 Pk)',
    category: 'Coils',
    sellingPrice: 12.00,
    costPrice: 6.50,
    totalAcquiredStock: 100,
    damagedQuantity: 3,
    stock: 80,
    testerQuantity: 0
  },
  {
    id: 'coil2',
    name: 'MTL Coils - 1.2ohm (5 Pk)',
    category: 'Coils',
    sellingPrice: 11.00,
    costPrice: 6.00,
    totalAcquiredStock: 150,
    damagedQuantity: 5,
    stock: 120,
    testerQuantity: 0
  },
  // prod3 is already a coil

  // Category: POD/MOD Devices (Ensuring at least 3)
  {
    id: 'podmod1',
    name: 'Compact Pod System - Caliburn G',
    category: 'POD/MOD Devices',
    sellingPrice: 35.00,
    costPrice: 22.00,
    totalAcquiredStock: 50,
    damagedQuantity: 2,
    stock: 35,
    testerQuantity: 0
  },
  {
    id: 'podmod2',
    name: 'Advanced Mod - GeekVape Aegis X',
    category: 'POD/MOD Devices',
    sellingPrice: 65.00,
    costPrice: 40.00,
    totalAcquiredStock: 30,
    damagedQuantity: 0,
    stock: 20,
    testerQuantity: 1
  },
  // prod2 and prod5 are already POD/MOD devices, so we have more than 3

  // Category: Cotton (Ensuring at least 3)
  {
    id: 'cotton1',
    name: 'Organic Vape Cotton - Premium Strips',
    category: 'Cotton',
    sellingPrice: 5.00,
    costPrice: 2.50,
    totalAcquiredStock: 200,
    damagedQuantity: 5,
    stock: 150,
    testerQuantity: 0
  },
  {
    id: 'cotton2',
    name: 'Cotton Bacon Bits - V2',
    category: 'Cotton',
    sellingPrice: 6.50,
    costPrice: 3.00,
    totalAcquiredStock: 180,
    damagedQuantity: 3,
    stock: 140,
    testerQuantity: 0
  },
  {
    id: 'cotton3',
    name: 'Shoelace Cotton Agleted (20 Pcs)',
    category: 'Cotton',
    sellingPrice: 7.00,
    costPrice: 3.50,
    totalAcquiredStock: 160,
    damagedQuantity: 2,
    stock: 130,
    testerQuantity: 0
  },

  // Category: Coil Build & Maintenance (Ensuring at least 3)
  {
    id: 'build1',
    name: 'Coil Building Toolkit - Basic',
    category: 'Coil Build & Maintenance',
    sellingPrice: 25.00,
    costPrice: 15.00,
    totalAcquiredStock: 30,
    damagedQuantity: 1,
    stock: 20,
    testerQuantity: 0
  },
  {
    id: 'build2',
    name: 'Wire Spool - Ni80 Clapton 26G*32G',
    category: 'Coil Build & Maintenance',
    sellingPrice: 9.00,
    costPrice: 4.50,
    totalAcquiredStock: 80,
    damagedQuantity: 0,
    stock: 60,
    testerQuantity: 0
  },
  {
    id: 'build3',
    name: 'Precision Screwdriver Set for Vapes',
    category: 'Coil Build & Maintenance',
    sellingPrice: 12.50,
    costPrice: 6.00,
    totalAcquiredStock: 50,
    damagedQuantity: 1,
    stock: 40,
    testerQuantity: 0
  }
];
// Initialize testerQuantity for all products if not present (for safety)
mockProducts.forEach(p => {
  if (p.testerQuantity === undefined) {
    p.testerQuantity = 0;
  }
});


export const mockSales: Sale[] = [
  {
    id: 'sale1',
    customerName: 'John Doe',
    customerContact: '98XXXXXXXX',
    items: [
      { productId: 'prod1', productName: 'Vape Juice - Mango Tango', quantity: 2, unitPrice: 15.99, totalPrice: 31.98 },
      { productId: 'prod3', productName: 'Coils - Standard Pack (5pcs)', quantity: 1, unitPrice: 9.99, totalPrice: 9.99 },
    ],
    totalAmount: 41.97,
    cashPaid: 0,
    digitalPaid: 41.97,
    amountDue: 0,
    formPaymentMethod: 'Credit Card',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    status: 'Paid',
    createdBy: 'staff_user', // Changed from Staff Alice
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
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    status: 'Due',
    createdBy: 'alice', // Changed from Staff Bob
    isFlagged: true,
    flaggedComment: 'Item mismatch, customer called.',
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
    date: new Date().toISOString(), // Today
    status: 'Paid',
    createdBy: 'staff_user', // Changed from Staff Alice
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
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    status: 'Due',
    createdBy: 'admin_user', // Changed from Admin Eve
    isFlagged: false,
    flaggedComment: '',
    saleOrigin: 'store',
  },
  {
    id: 'sale5-staff-user-recent', // Renamed for clarity
    customerName: 'Recent Staff User Customer',
    items: [ { productId: 'nicsalt1', productName: 'Nic Salt - Strawberry Kiwi', quantity: 1, unitPrice: 16.50, totalPrice: 16.50 }],
    totalAmount: 16.50, cashPaid: 16.50, digitalPaid: 0, amountDue: 0,
    formPaymentMethod: 'Cash',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 10000).toISOString(), // 2 days ago + 10s
    status: 'Paid', createdBy: 'staff_user', saleOrigin: 'online',
  },
  {
    id: 'sale6-alice-recent', // Renamed for clarity
    customerName: 'Recent Alice Customer',
    items: [ { productId: 'freebase1', productName: 'Freebase - Classic Tobacco', quantity: 2, unitPrice: 14.00, totalPrice: 28.00 }],
    totalAmount: 28.00, cashPaid: 0, digitalPaid: 28.00, amountDue: 0,
    formPaymentMethod: 'Debit Card',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 - 20000).toISOString(), // 3 days ago + 20s
    status: 'Paid', createdBy: 'alice', saleOrigin: 'store', isFlagged: true, flaggedComment: "Initial flag by alice."
  },
  {
    id: 'sale7-staff-user-due', // Renamed for clarity
    customerName: 'Staff User Due Customer',
    items: [ { productId: 'disp1', productName: 'Disposable - Watermelon Chill', quantity: 3, unitPrice: 8.00, totalPrice: 24.00 }],
    totalAmount: 24.00, cashPaid: 0, digitalPaid: 0, amountDue: 24.00,
    formPaymentMethod: 'Due',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    status: 'Due', createdBy: 'staff_user', saleOrigin: 'store',
  },
  {
    id: 'sale8-alice-old', // Renamed for clarity
    customerName: 'Alice Old Customer',
    items: [ { productId: 'cotton1', productName: 'Organic Vape Cotton - Premium Strips', quantity: 1, unitPrice: 5.00, totalPrice: 5.00 }],
    totalAmount: 5.00, cashPaid: 5.00, digitalPaid: 0, amountDue: 0,
    formPaymentMethod: 'Cash',
    date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days ago (will not show in staff's recent)
    status: 'Paid', createdBy: 'alice', saleOrigin: 'store',
  }
];

export const mockExpenses: Expense[] = [
  {
    id: 'exp1',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'Monthly Rent',
    category: 'Rent',
    amount: 1200.00,
    recordedBy: 'admin_user' // Changed from Admin Eve
  },
  {
    id: 'exp2',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'Electricity Bill',
    category: 'Utilities',
    amount: 150.75,
    recordedBy: 'admin_user' // Changed from Admin Eve
  },
  {
    id: 'exp3',
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'Staff Lunch',
    category: 'Food',
    amount: 45.50,
    recordedBy: 'admin_user' // Changed from Admin Eve
  },
];

export const mockLogEntries: LogEntry[] = [
   {
    id: 'log0',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 - 10*60*1000).toISOString(),
    user: 'admin_user', // Changed from Admin Eve
    action: 'Sale Created',
    details: 'Sale ID sale4-hybrid for Hybrid Harry (96ZZZZZZZZ), Total: NRP 45.98. Paid NRP 20.00 by cash, NRP 15.98 by digital, NRP 10.00 due. Status: Due. Origin: store.'
  },
  {
    id: 'log1',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 5*60*1000).toISOString(),
    user: 'staff_user', // Changed from Staff Alice
    action: 'Sale Created',
    details: 'Sale ID sale1 for John Doe (98XXXXXXXX), Total: NRP 41.97. Payment: Credit Card. Status: Paid. Origin: store.'
  },
  {
    id: 'log_sale5',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 10000).toISOString(),
    user: 'staff_user', // Changed from Staff Alice
    action: 'Sale Created',
    details: 'Sale ID sale5-staff-user-recent for Recent Staff User Customer, Total: NRP 16.50. Payment: Cash. Status: Paid. Origin: online.'
  },
  {
    id: 'log_sale6_flag',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 - 18000).toISOString(),
    user: 'alice', // Changed from Staff Bob
    action: 'Sale Flagged',
    details: 'Sale ID sale6-alice-recent flagged by alice. Comment: Initial flag by alice.'
  },
  {
    id: 'log_sale6',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 - 20000).toISOString(),
    user: 'alice', // Changed from Staff Bob
    action: 'Sale Created',
    details: 'Sale ID sale6-alice-recent for Recent Alice Customer, Total: NRP 28.00. Payment: Debit Card. Status: Paid. Origin: store.'
  },
  {
    id: 'log_sale7',
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    user: 'staff_user', // Changed from Staff Alice
    action: 'Sale Created',
    details: 'Sale ID sale7-staff-user-due for Staff User Due Customer, Total: NRP 24.00. Payment: Due. Status: Due. Origin: store.'
  },
   {
    id: 'log_sale8',
    timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    user: 'alice', // Changed from Staff Bob
    action: 'Sale Created',
    details: 'Sale ID sale8-alice-old for Alice Old Customer, Total: NRP 5.00. Payment: Cash. Status: Paid. Origin: store.'
  },
  {
    id: 'log1b', // This log entry refers to sale2, which is now by 'alice'
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 - 2*60*1000).toISOString(),
    user: 'alice', // Changed from Staff Bob
    action: 'Sale Flagged',
    details: 'Sale ID sale2 for Jane Smith flagged by alice. Comment: Item mismatch, customer called.'
  },
  {
    id: 'log2',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 - 3*60*1000).toISOString(),
    user: 'alice', // Changed from Staff Bob
    action: 'Sale Created',
    details: 'Sale ID sale2 for Jane Smith (97YYYYYYYY), Total: NRP 37.50. Payment: Due. Status: Due. Origin: store.'
  },
  {
    id: 'log3',
    timestamp: new Date().toISOString(),
    user: 'admin_user', // Changed from Admin Eve
    action: 'Expense Added',
    details: 'Expense ID exp3, Category: Food, Amount: NRP 45.50'
  },
  {
    id: 'log4',
    timestamp: new Date(Date.now() - 20*60*1000).toISOString(),
    user: 'admin_user', // Changed from Admin Eve
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
    sale.saleOrigin = 'store'; // Default to store if not specified
  }
});
