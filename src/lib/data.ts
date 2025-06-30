
import type { Product, Sale, Expense, LogEntry, AcquisitionBatch, AcquisitionPaymentMethod, ProductType, ManagedUser, UserRole } from '@/types';
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

export const mockProducts: Product[] = [
  {
    id: 'prod1',
    name: 'VAPEJUICE',
    flavorName: 'Mango Tango',
    category: 'E-liquid Nic Salt',
    currentSellingPrice: 1700,
    currentCostPrice: 1000,
    acquisitionHistory: [
      createInitialBatch('prod1', formatISO(new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)), 70, 1000, 1700, 'Cash', 70 * 1000, 0, 0, 'NPS', 'BULKVAPESLTD')
    ],
    damagedQuantity: 2,
    testerQuantity: 1,
  },
  {
    id: 'prod2',
    name: 'SMOK',
    modelName: 'X-Priv',
    category: 'POD/MOD Devices',
    currentSellingPrice: 5000,
    currentCostPrice: 3000,
    acquisitionHistory: [
      createInitialBatch('prod2', formatISO(new Date(Date.now() - 58 * 24 * 60 * 60 * 1000)), 35, 3000, 5000, 'Digital', 0, 35 * 3000, 0, 'NPS', 'MODDERSINC')
    ],
    damagedQuantity: 1,
    testerQuantity: 1,
  },
  {
    id: 'prod3',
    name: 'GEEKVAPE',
    modelName: 'Z Series',
    category: 'Coils',
    currentSellingPrice: 1000,
    currentCostPrice: 500,
    acquisitionHistory: [
      createInitialBatch('prod3', formatISO(new Date(Date.now() - 55 * 24 * 60 * 60 * 1000)), 120, 500, 1000, 'Cash', 120 * 500, 0, 0, 'SKG')
    ],
    damagedQuantity: 0,
    testerQuantity: 0,
  },
  {
    id: 'prod4',
    name: 'ELFBAR',
    modelName: 'BC5000',
    flavorName: 'Blueberry Ice',
    category: 'Disposables',
    currentSellingPrice: 800,
    currentCostPrice: 400,
    acquisitionHistory: [
      createInitialBatch('prod4', formatISO(new Date(Date.now() - 50 * 24 * 60 * 60 * 1000)), 100, 400, 800, 'Hybrid', 50 * 400, 30 * 400, 20 * 400, 'NPS', 'DISPOKING')
    ],
    damagedQuantity: 5,
    testerQuantity: 1,
  },
  {
    id: 'prod5',
    name: 'VAPEPENKIT',
    modelName: 'Starter',
    category: 'POD/MOD Devices',
    currentSellingPrice: 3000,
    currentCostPrice: 1800,
    acquisitionHistory: [
      createInitialBatch('prod5', formatISO(new Date(Date.now() - 45 * 24 * 60 * 60 * 1000)), 40, 1800, 3000, 'Due', 0, 0, 40 * 1800, 'SKG', 'VAPESUPPLIESCO')
    ],
    damagedQuantity: 0,
    testerQuantity: 0,
  },
  {
    id: 'disp1',
    name: 'LOSTMARY',
    modelName: 'OS5000',
    flavorName: 'Watermelon Chill',
    category: 'Disposables',
    currentSellingPrice: 800,
    currentCostPrice: 400,
    acquisitionHistory: [
      createInitialBatch('disp1', formatISO(new Date(Date.now() - 40 * 24 * 60 * 60 * 1000)), 150, 400, 800, 'Cash', 150 * 400, 0, 0, 'SKG')
    ],
    damagedQuantity: 3,
    testerQuantity: 0,
  },
  {
    id: 'nicsalt1',
    name: 'PODJUICE',
    flavorName: 'Strawberry Kiwi',
    category: 'E-liquid Nic Salt',
    currentSellingPrice: 1700,
    currentCostPrice: 1000,
    acquisitionHistory: [
      createInitialBatch('nicsalt1', formatISO(new Date(Date.now() - 35 * 24 * 60 * 60 * 1000)), 80, 1000, 1700, 'Digital', 0, 80 * 1000, 0, 'NPS')
    ],
    damagedQuantity: 1,
    testerQuantity: 0,
  },
  {
    id: 'cotton2',
    name: 'COTTONBACON',
    modelName: 'Bits V2',
    category: 'Cotton',
    currentSellingPrice: 700,
    currentCostPrice: 300,
    acquisitionHistory: [
      createInitialBatch('cotton2', formatISO(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)), 180, 300, 700, 'Hybrid', 100 * 300, 50 * 300, 30 * 300, 'SKG', 'WICKWIRECO')
    ],
    damagedQuantity: 3,
    testerQuantity: 0,
  }
];

mockProducts.forEach(p => {
  if (p.testerQuantity === undefined) p.testerQuantity = 0;
  if (p.damagedQuantity === undefined) p.damagedQuantity = 0;
});

const getFullProductName = (p: {name: string, modelName?: string, flavorName?: string}) => {
    let fullName = p.name;
    if (p.modelName) fullName += ` (${p.modelName})`;
    if (p.flavorName) fullName += ` - ${p.flavorName}`;
    return fullName;
}

const initialMockSales: Sale[] = [
  {
    id: 'sale1',
    customerName: 'John Doe',
    customerContact: '98XXXXXXXX',
    items: [
      { productId: 'prod1', productName: getFullProductName(mockProducts.find(p => p.id === 'prod1')!), quantity: 2, unitPrice: 1700, totalPrice: 3400 },
      { productId: 'prod3', productName: getFullProductName(mockProducts.find(p => p.id === 'prod3')!), quantity: 1, unitPrice: 1000, totalPrice: 1000 },
    ],
    totalAmount: 4400,
    cashPaid: 0,
    digitalPaid: 4400,
    amountDue: 0,
    formPaymentMethod: 'Digital',
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
      { productId: 'prod4', productName: getFullProductName(mockProducts.find(p => p.id === 'prod4')!), quantity: 5, unitPrice: 800, totalPrice: 4000 },
    ],
    totalAmount: 4000,
    cashPaid: 0,
    digitalPaid: 0,
    amountDue: 4000,
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
    details: `Product Damage & Stock Update (Exchange): Item 'VAPEJUICE - Mango Tango' (Qty: 2) marked as damaged.`
  },
  {
    id: 'log-dmg-prod2-init',
    timestamp: formatISO(new Date(Date.now() - 11 * 24 * 60 * 60 * 1000)),
    user: 'System', action: 'Product Damage & Stock Update (Exchange)',
    details: `Product Damage & Stock Update (Exchange): Item 'SMOK (X-Priv)' (Qty: 1) marked as damaged.`
  },
    {
    id: 'log-dmg-prod4-init',
    timestamp: formatISO(new Date(Date.now() - 12 * 24 * 60 * 60 * 1000)),
    user: 'System', action: 'Product Damage & Stock Update (Exchange)',
    details: `Product Damage & Stock Update (Exchange): Item 'ELFBAR (BC5000) - Blueberry Ice' (Qty: 5) marked as damaged.`
  },
  {
    id: 'log-dmg-disp1-init',
    timestamp: formatISO(new Date(Date.now() - 13 * 24 * 60 * 60 * 1000)),
    user: 'System', action: 'Product Damage & Stock Update (Exchange)',
    details: `Product Damage & Stock Update (Exchange): Item 'LOSTMARY (OS5000) - Watermelon Chill' (Qty: 3) marked as damaged.`
  },
    {
    id: 'log-dmg-nicsalt1-init',
    timestamp: formatISO(new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)),
    user: 'System', action: 'Product Damage & Stock Update (Exchange)',
    details: `Product Damage & Stock Update (Exchange): Item 'PODJUICE - Strawberry Kiwi' (Qty: 1) marked as damaged.`
  },
    {
    id: 'log-dmg-cotton2-init',
    timestamp: formatISO(new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)),
    user: 'System', action: 'Product Damage & Stock Update (Exchange)',
    details: `Product Damage & Stock Update (Exchange): Item 'COTTONBACON (Bits V2)' (Qty: 3) marked as damaged.`
  },
];


const initialMockLogEntries: LogEntry[] = [
   {
    id: 'log0',
    timestamp: formatISO(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 - 10*60*1000)),
    user: 'NPS',
    action: 'Sale Created',
    details: 'Sale ID sale4-hybrid for Hybrid Harry (96ZZZZZZZZ), Total: NRP 4600. Payment: Hybrid (Cash: 2000, Digital: 1600, Due: 1000). Status: Due. Origin: store.'
  },
  {
    id: 'log1',
    timestamp: formatISO(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 5*60*1000)),
    user: 'staff_user',
    action: 'Sale Created',
    details: 'Sale ID sale1 for John Doe (98XXXXXXXX), Total: NRP 4400. Payment: Digital. Status: Paid. Origin: store.'
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
const mockStaffUsers = ["staff_user", "alice", "NPS", "SKG"]; // Admins can also create sales
const generatedSales: Sale[] = [];
const generatedLogEntries: LogEntry[] = [];
const NUM_SALES_TO_GENERATE = 5; 
const DAYS_RANGE = 30;

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
      productId: productInfo.id, productName: getFullProductName(productInfo), quantity,
      unitPrice: productInfo.currentSellingPrice, totalPrice: quantity * productInfo.currentSellingPrice,
    });
  }

  if (saleItems.length === 0) continue;
  const totalAmount = saleItems.reduce((sum, item) => sum + item.totalPrice, 0);
  let cashPaid = 0, digitalPaid = 0, amountDue = 0, formPaymentMethod: Sale['formPaymentMethod'] = 'Cash', status: Sale['status'] = 'Paid';
  const paymentTypeRoll = Math.random();
  if (paymentTypeRoll < 0.4) { formPaymentMethod = 'Cash'; cashPaid = totalAmount; }
  else if (paymentTypeRoll < 0.7) { formPaymentMethod = 'Digital'; digitalPaid = totalAmount; } // Adjusted from 0.8 to make 'Due' more common
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

export const mockExpenses: Expense[] = [
  { id: 'exp-rent-initial', date: formatISO(new Date(Date.now() - 28 * 24 * 60 * 60 * 1000)), category: 'Rent', description: 'Monthly Store Rent', amount: 120000, recordedBy: 'NPS' },
  { id: 'exp-utils-initial', date: formatISO(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)), category: 'Utilities', description: 'Electricity Bill', amount: 15000, recordedBy: 'NPS' },
  { id: 'exp-marketing-initial', date: formatISO(new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)), category: 'Marketing and Advertising', description: 'Social Media Ads', amount: 20000, recordedBy: 'SKG' },
].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());


export const mockLogEntries: LogEntry[] = [...initialMockLogEntries, ...generatedLogEntries].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

export function addLogEntry(actorName: string, action: string, details: string): LogEntry {
    const newLog: LogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      user: actorName,
      action,
      details,
    };
    mockLogEntries.unshift(newLog);
    mockLogEntries.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return newLog;
}

export function addSystemExpense(expenseData: Omit<Expense, 'id'>, actorName: string = 'System'): Expense {
  const newExpense: Expense = { 
      id: `exp-sys-${Date.now()}-${Math.random().toString(36).substring(2,7)}`, 
      ...expenseData,
      recordedBy: actorName // Ensure recordedBy is set
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

export let mockManagedUsers: ManagedUser[] = [
  { id: 'user-staff-01', name: 'staff_user', role: 'staff', defaultPassword: 'password123', createdAt: formatISO(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)) },
  { id: 'user-staff-02', name: 'alice', role: 'staff', defaultPassword: 'password456', createdAt: formatISO(new Date(Date.now() - 85 * 24 * 60 * 60 * 1000)) },
];

export const addManagedUser = (name: string, role: UserRole, defaultPassword: string, addedBy: string): ManagedUser | null => {
  if (!name.trim() || !defaultPassword.trim()) return null;
  if (role === 'admin') {
    console.warn("Attempted to add an admin user via addManagedUser. This is not allowed. User not added.");
    return null; 
  }

  const newUser: ManagedUser = {
    id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: name.trim(),
    role: 'staff', 
    defaultPassword, 
    createdAt: formatISO(new Date()),
  };
  mockManagedUsers.push(newUser);
  mockManagedUsers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  addLogEntry(addedBy, 'User Added', `Staff User '${newUser.name}' (Role: ${newUser.role}) added by ${addedBy}.`);
  return newUser;
};

export const editManagedUser = (userId: string, newName: string, editedBy: string): ManagedUser | null => {
  const userIndex = mockManagedUsers.findIndex(u => u.id === userId);
  if (userIndex === -1 || !newName.trim()) {
    return null;
  }
  const originalUser = { ...mockManagedUsers[userIndex] };
  mockManagedUsers[userIndex].name = newName.trim();
  
  addLogEntry(editedBy, 'User Edited', `Staff User ID ${userId.substring(0,8)}... name changed from '${originalUser.name}' to '${newName.trim()}' by ${editedBy}.`);
  return mockManagedUsers[userIndex];
};

export const deleteManagedUser = (userId: string, deletedBy: string): ManagedUser | null => {
  const userIndex = mockManagedUsers.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    return null;
  }
  
  const deletedUser = mockManagedUsers[userIndex];

  if (deletedUser.role === 'admin') {
    console.warn(`Attempted to delete an admin role user '${deletedUser.name}' via deleteManagedUser. Admins cannot be deleted this way.`);
    return null;
  }

  mockManagedUsers.splice(userIndex, 1);

  addLogEntry(deletedBy, 'User Deleted', `Staff User '${deletedUser.name}' (ID: ${userId.substring(0,8)}...) deleted by ${deletedBy}.`);
  return deletedUser;
};

export let mockCapital = {
  cashInHand: 50000,
  lastUpdated: '2024-01-01T12:00:00.000Z',
};

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
