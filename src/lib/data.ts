
import type { Product, Sale, Expense, LogEntry, AcquisitionBatch, AcquisitionPaymentMethod, ProductType } from '@/types';
import { formatISO } from 'date-fns';

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
});

export const mockProducts: Product[] = [
  {
    id: 'prod1',
    name: 'Vape Juice - Mango Tango',
    category: 'E-liquid Nic Salt',
    currentSellingPrice: 15.99,
    currentCostPrice: 9.50,
    acquisitionHistory: [
      createInitialBatch('prod1', formatISO(new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)), 70, 9.50, 15.99, 'Cash', 70 * 9.50, 0, 0, 'Bulk Vapes Ltd.')
    ],
    damagedQuantity: 2,
    testerQuantity: 1,
  },
  {
    id: 'prod2',
    name: 'Vape Mod - Smok X',
    category: 'POD/MOD Devices',
    currentSellingPrice: 49.99,
    currentCostPrice: 30.00,
    acquisitionHistory: [
      createInitialBatch('prod2', formatISO(new Date(Date.now() - 58 * 24 * 60 * 60 * 1000)), 35, 30.00, 49.99, 'Digital', 0, 35 * 30.00, 0, 'Modders Inc.')
    ],
    damagedQuantity: 1,
    testerQuantity: 1,
  },
  {
    id: 'prod3',
    name: 'Coils - Standard Pack (5pcs)',
    category: 'Coils',
    currentSellingPrice: 9.99,
    currentCostPrice: 5.00,
    acquisitionHistory: [
      createInitialBatch('prod3', formatISO(new Date(Date.now() - 55 * 24 * 60 * 60 * 1000)), 120, 5.00, 9.99, 'Cash', 120 * 5.00, 0, 0)
    ],
    damagedQuantity: 0,
    testerQuantity: 0,
  },
  {
    id: 'prod4',
    name: 'Disposable Vape - Blueberry Ice',
    category: 'Disposables',
    currentSellingPrice: 7.50,
    currentCostPrice: 3.75,
    acquisitionHistory: [
      createInitialBatch('prod4', formatISO(new Date(Date.now() - 50 * 24 * 60 * 60 * 1000)), 100, 3.75, 7.50, 'Hybrid', 50 * 3.75, 30 * 3.75, 20 * 3.75, 'Dispo King')
    ],
    damagedQuantity: 5,
    testerQuantity: 1,
  },
  {
    id: 'prod5',
    name: 'Vape Pen Kit - Starter',
    category: 'POD/MOD Devices',
    currentSellingPrice: 29.99,
    currentCostPrice: 18.00,
    acquisitionHistory: [
      createInitialBatch('prod5', formatISO(new Date(Date.now() - 45 * 24 * 60 * 60 * 1000)), 40, 18.00, 29.99, 'Due', 0, 0, 40 * 18.00, 'Vape Supplies Co.')
    ],
    damagedQuantity: 0,
    testerQuantity: 0,
  },
  {
    id: 'disp1',
    name: 'Disposable - Watermelon Chill',
    category: 'Disposables',
    currentSellingPrice: 8.00,
    currentCostPrice: 4.00,
    acquisitionHistory: [
      createInitialBatch('disp1', formatISO(new Date(Date.now() - 40 * 24 * 60 * 60 * 1000)), 150, 4.00, 8.00, 'Cash', 150 * 4.00, 0, 0)
    ],
    damagedQuantity: 3,
    testerQuantity: 0,
  },
  {
    id: 'nicsalt1',
    name: 'Nic Salt - Strawberry Kiwi',
    category: 'E-liquid Nic Salt',
    currentSellingPrice: 16.50,
    currentCostPrice: 10.00,
    acquisitionHistory: [
      createInitialBatch('nicsalt1', formatISO(new Date(Date.now() - 35 * 24 * 60 * 60 * 1000)), 80, 10.00, 16.50, 'Digital', 0, 80 * 10.00, 0)
    ],
    damagedQuantity: 1,
    testerQuantity: 0,
  },
  {
    id: 'cotton2',
    name: 'Cotton Bacon Bits - V2',
    category: 'Cotton',
    currentSellingPrice: 6.50,
    currentCostPrice: 3.00,
    acquisitionHistory: [
      createInitialBatch('cotton2', formatISO(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)), 180, 3.00, 6.50, 'Hybrid', 100 * 3.00, 50 * 3.00, 30 * 3.00, 'Wick & Wire Co.')
    ],
    damagedQuantity: 3,
    testerQuantity: 0,
  }
];

mockProducts.forEach(p => {
  if (p.testerQuantity === undefined) p.testerQuantity = 0;
  if (p.damagedQuantity === undefined) p.damagedQuantity = 0;
});

const initialMockSales: Sale[] = [
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
    date: formatISO(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)),
    status: 'Paid',
    createdBy: 'staff_user',
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
    date: formatISO(new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)),
    status: 'Due',
    createdBy: 'alice',
    isFlagged: true,
    flaggedComment: 'Item mismatch, customer called.',
    saleOrigin: 'store',
  },
];

const initialDamageLogEntries: LogEntry[] = [
  {
    id: 'log-dmg-prod1-init',
    timestamp: formatISO(new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)),
    user: 'System', action: 'Product Damage & Stock Update (Exchange)',
    details: "Product Damage & Stock Update (Exchange): Item 'Vape Juice - Mango Tango' (Qty: 2) from Sale ID MOCK_DMG_S1... marked damaged & exchanged by System. Prev Stock: 52, New Stock: 50, Prev Dmg: 0, New Dmg: 2."
  },
];

const initialMockLogEntries: LogEntry[] = [
   {
    id: 'log0',
    timestamp: formatISO(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 - 10*60*1000)),
    user: 'admin_user',
    action: 'Sale Created',
    details: 'Sale ID sale4-hybrid for Hybrid Harry (96ZZZZZZZZ), Total: NRP 45.98. Payment: Hybrid (Cash: 20.00, Digital: 15.98, Due: 10.00). Status: Due. Origin: store.'
  },
  {
    id: 'log1',
    timestamp: formatISO(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 5*60*1000)),
    user: 'staff_user',
    action: 'Sale Created',
    details: 'Sale ID sale1 for John Doe (98XXXXXXXX), Total: NRP 41.97. Payment: Credit Card. Status: Paid. Origin: store.'
  },
  ...initialDamageLogEntries
];

function getRandomDate(daysAgo: number): Date {
  const today = new Date();
  const pastDate = new Date(today);
  pastDate.setDate(today.getDate() - Math.floor(Math.random() * daysAgo));
  pastDate.setHours(Math.floor(Math.random() * 24));
  pastDate.setMinutes(Math.floor(Math.random() * 60));
  pastDate.setSeconds(Math.floor(Math.random() * 60));
  return pastDate;
}

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const mockCustomerNames = ["Alex Smith", "Jamie Brown", "Chris Lee", "Pat Taylor", "Jordan Davis"];
const mockStaffUsers = ["staff_user", "alice", "admin_user"];
const generatedSales: Sale[] = [];
const generatedLogEntries: LogEntry[] = [];
const NUM_SALES_TO_GENERATE = 5; // Reduced for brevity
const DAYS_RANGE = 30;

// Helper to calculate current stock for dynamic product pool
const calculateCurrentStockForPool = (product: Product, currentSales: Sale[]): number => {
    const totalAcquired = product.acquisitionHistory.reduce((sum, batch) => sum + batch.quantityAdded, 0);
    const totalSold = currentSales
        .flatMap(sale => sale.items)
        .filter(item => item.productId === product.id)
        .reduce((sum, item) => sum + item.quantity, 0);
    return totalAcquired - totalSold - (product.damagedQuantity || 0) - (product.testerQuantity || 0);
};


for (let i = 0; i < NUM_SALES_TO_GENERATE; i++) {
  const saleId = `sale-gen-${Date.now().toString(36).slice(-4)}-${i}`;
  const customerName = getRandomElement(mockCustomerNames);
  const customerContact = Math.random() > 0.3 ? `98${getRandomInt(10000000, 99999999)}` : undefined;
  const createdBy = getRandomElement(mockStaffUsers);
  const saleDate = getRandomDate(DAYS_RANGE);
  const saleOrigin = Math.random() > 0.4 ? 'store' : 'online';

  const productPool = mockProducts.map(p => ({
      ...p,
      currentStock: calculateCurrentStockForPool(p, [...initialMockSales, ...generatedSales])
  })).filter(p => p.currentStock > 0 && p.currentSellingPrice > 0);

  if (productPool.length === 0) continue;

  const numItemsInSale = getRandomInt(1, Math.min(2, productPool.length));
  const saleItems: SaleItem[] = [];
  const tempSelectedProductIds: string[] = [];

  for (let j = 0; j < numItemsInSale; j++) {
    let productInfo = getRandomElement(productPool);
    let attempts = 0;
    while(tempSelectedProductIds.includes(productInfo.id) && attempts < productPool.length * 2) {
        productInfo = getRandomElement(productPool); attempts++;
    }
    if (tempSelectedProductIds.includes(productInfo.id) || !productInfo || productInfo.currentStock <= 0) continue;
    tempSelectedProductIds.push(productInfo.id);
    const quantity = getRandomInt(1, Math.min(3, productInfo.currentStock));
    saleItems.push({
      productId: productInfo.id, productName: productInfo.name, quantity,
      unitPrice: productInfo.currentSellingPrice, totalPrice: quantity * productInfo.currentSellingPrice,
    });
  }

  if (saleItems.length === 0) continue;
  const totalAmount = saleItems.reduce((sum, item) => sum + item.totalPrice, 0);
  let cashPaid = 0, digitalPaid = 0, amountDue = 0, formPaymentMethod: Sale['formPaymentMethod'] = 'Cash', status: Sale['status'] = 'Paid';
  // Simplified payment logic
  const paymentTypeRoll = Math.random();
  if (paymentTypeRoll < 0.5) { formPaymentMethod = 'Cash'; cashPaid = totalAmount; }
  else if (paymentTypeRoll < 0.8) { formPaymentMethod = 'Credit Card'; digitalPaid = totalAmount; }
  else { formPaymentMethod = 'Due'; amountDue = totalAmount; status = 'Due'; }

  const newSale: Sale = {
    id: saleId, customerName, customerContact, items: saleItems, totalAmount, cashPaid, digitalPaid, amountDue,
    formPaymentMethod, date: formatISO(saleDate), status, createdBy, saleOrigin, isFlagged: false, flaggedComment: ''
  };
  generatedSales.push(newSale);
  generatedLogEntries.push({
      id: `log-gs-${i}`, timestamp: formatISO(saleDate), user: createdBy, action: 'Sale Created',
      details: `Sale ID ${saleId.slice(0,8)} for ${customerName}, Total: NRP ${totalAmount.toFixed(2)}`
  });
}

export const mockSales: Sale[] = [...initialMockSales, ...generatedSales].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

// Initialize mockExpenses with some data including categories from payableCategories
export const mockExpenses: Expense[] = [
  { id: 'exp-rent-initial', date: formatISO(new Date(Date.now() - 28 * 24 * 60 * 60 * 1000)), category: 'Rent', description: 'Monthly Store Rent', amount: 1200, recordedBy: 'admin_user' },
  { id: 'exp-utils-initial', date: formatISO(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)), category: 'Utilities', description: 'Electricity Bill', amount: 150, recordedBy: 'admin_user' },
  { id: 'exp-marketing-initial', date: formatISO(new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)), category: 'Marketing', description: 'Social Media Ads', amount: 200, recordedBy: 'admin_user' },
  // Any other system-generated expenses will be added by addSystemExpense
].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());


export const mockLogEntries: LogEntry[] = [...initialMockLogEntries, ...generatedLogEntries].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.date).getTime());

export function addSystemExpense(expenseData: Omit<Expense, 'id'>): Expense {
  const newExpense: Expense = { id: `exp-sys-${Date.now()}`, ...expenseData };
  mockExpenses.push(newExpense);
  mockExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const logEntry: LogEntry = { id: `log-exp-${newExpense.id}`, timestamp: formatISO(new Date()), user: expenseData.recordedBy || 'System', action: 'System Expense Recorded', details: `Expense Category: ${expenseData.category}, Amount: NRP ${expenseData.amount.toFixed(2)}. Desc: ${expenseData.description}`};
  mockLogEntries.unshift(logEntry);
  mockLogEntries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return newExpense;
}

