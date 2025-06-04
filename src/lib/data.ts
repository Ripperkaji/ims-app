
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
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
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
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    status: 'Due',
    createdBy: 'alice',
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
    createdBy: 'staff_user',
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
    createdBy: 'admin_user',
    isFlagged: false,
    flaggedComment: '',
    saleOrigin: 'store',
  },
  {
    id: 'sale5-staff-user-recent',
    customerName: 'Recent Staff User Customer',
    items: [ { productId: 'nicsalt1', productName: 'Nic Salt - Strawberry Kiwi', quantity: 1, unitPrice: 16.50, totalPrice: 16.50 }],
    totalAmount: 16.50, cashPaid: 16.50, digitalPaid: 0, amountDue: 0,
    formPaymentMethod: 'Cash',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 10000).toISOString(),
    status: 'Paid', createdBy: 'staff_user', saleOrigin: 'online',
  },
  {
    id: 'sale6-alice-recent',
    customerName: 'Recent Alice Customer',
    items: [ { productId: 'freebase1', productName: 'Freebase - Classic Tobacco', quantity: 2, unitPrice: 14.00, totalPrice: 28.00 }],
    totalAmount: 28.00, cashPaid: 0, digitalPaid: 28.00, amountDue: 0,
    formPaymentMethod: 'Debit Card',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 - 20000).toISOString(),
    status: 'Paid', createdBy: 'alice', saleOrigin: 'store', isFlagged: true, flaggedComment: "Initial flag by alice."
  },
  {
    id: 'sale7-staff-user-due',
    customerName: 'Staff User Due Customer',
    items: [ { productId: 'disp1', productName: 'Disposable - Watermelon Chill', quantity: 3, unitPrice: 8.00, totalPrice: 24.00 }],
    totalAmount: 24.00, cashPaid: 0, digitalPaid: 0, amountDue: 24.00,
    formPaymentMethod: 'Due',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'Due', createdBy: 'staff_user', saleOrigin: 'store',
  },
  {
    id: 'sale8-alice-old',
    customerName: 'Alice Old Customer',
    items: [ { productId: 'cotton1', productName: 'Organic Vape Cotton - Premium Strips', quantity: 1, unitPrice: 5.00, totalPrice: 5.00 }],
    totalAmount: 5.00, cashPaid: 5.00, digitalPaid: 0, amountDue: 0,
    formPaymentMethod: 'Cash',
    date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'Paid', createdBy: 'alice', saleOrigin: 'store',
  }
];

const initialMockLogEntries: LogEntry[] = [
   {
    id: 'log0',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 - 10*60*1000).toISOString(),
    user: 'admin_user',
    action: 'Sale Created',
    details: 'Sale ID sale4-hybrid for Hybrid Harry (96ZZZZZZZZ), Total: NRP 45.98. Payment: Hybrid (Cash: 20.00, Digital: 15.98, Due: 10.00). Status: Due. Origin: store.'
  },
  {
    id: 'log1',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 5*60*1000).toISOString(),
    user: 'staff_user',
    action: 'Sale Created',
    details: 'Sale ID sale1 for John Doe (98XXXXXXXX), Total: NRP 41.97. Payment: Credit Card. Status: Paid. Origin: store.'
  },
  {
    id: 'log_sale5',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 10000).toISOString(),
    user: 'staff_user',
    action: 'Sale Created',
    details: 'Sale ID sale5-staff-user-recent for Recent Staff User Customer, Total: NRP 16.50. Payment: Cash. Status: Paid. Origin: online.'
  },
  {
    id: 'log_sale6_flag',
    timestamp: new Date(new Date(initialMockSales.find(s=>s.id==='sale6-alice-recent')!.date).getTime() + 5*60*1000).toISOString(), // 5 mins after sale
    user: 'alice',
    action: 'Sale Flagged',
    details: 'Sale ID sale6-alice-recent flagged by alice. Comment: Initial flag by alice.'
  },
  {
    id: 'log_sale6',
    timestamp: initialMockSales.find(s=>s.id==='sale6-alice-recent')!.date,
    user: 'alice',
    action: 'Sale Created',
    details: 'Sale ID sale6-alice-recent for Recent Alice Customer, Total: NRP 28.00. Payment: Debit Card. Status: Paid. Origin: store.'
  },
  {
    id: 'log_sale7',
    timestamp: initialMockSales.find(s=>s.id==='sale7-staff-user-due')!.date,
    user: 'staff_user',
    action: 'Sale Created',
    details: 'Sale ID sale7-staff-user-due for Staff User Due Customer, Total: NRP 24.00. Payment: Due. Status: Due. Origin: store.'
  },
   {
    id: 'log_sale8',
    timestamp: initialMockSales.find(s=>s.id==='sale8-alice-old')!.date,
    user: 'alice',
    action: 'Sale Created',
    details: 'Sale ID sale8-alice-old for Alice Old Customer, Total: NRP 5.00. Payment: Cash. Status: Paid. Origin: store.'
  },
  {
    id: 'log1b',
    timestamp: new Date(new Date(initialMockSales.find(s=>s.id==='sale2')!.date).getTime() + 5*60*1000).toISOString(), // 5 mins after sale
    user: 'alice',
    action: 'Sale Flagged',
    details: 'Sale ID sale2 for Jane Smith flagged by alice. Comment: Item mismatch, customer called.'
  },
  {
    id: 'log2',
    timestamp: initialMockSales.find(s=>s.id==='sale2')!.date,
    user: 'alice',
    action: 'Sale Created',
    details: 'Sale ID sale2 for Jane Smith (97YYYYYYYY), Total: NRP 37.50. Payment: Due. Status: Due. Origin: store.'
  },
  {
    id: 'log3',
    timestamp: new Date().toISOString(),
    user: 'admin_user',
    action: 'Expense Added',
    details: 'Expense ID exp3, Category: Food, Amount: NRP 45.50'
  },
  {
    id: 'log4',
    timestamp: new Date(Date.now() - 20*60*1000).toISOString(),
    user: 'admin_user',
    action: 'Product Added',
    details: "Product 'Vape Pen Kit - Starter' (ID: prod5...) added. Category: POD/MOD Devices, Cost: NRP 18.00, Selling Price: NRP 29.99, Initial Stock: 40."
  }
];

// Helper function to get a random date within the last N days
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

const mockCustomerNames = [
  "Alex Smith", "Jamie Brown", "Chris Lee", "Pat Taylor", "Jordan Davis",
  "Morgan Wilson", "Taylor Garcia", "Casey Rodriguez", "Riley Martinez", "Drew Hernandez",
  "Cameron Lopez", "Blake Gonzalez", "Rowan Perez", "Dakota Miller", "Avery Anderson",
  "Quinn Thomas", "Skyler Jackson", "Phoenix White", "Charlie Harris", "Emerson Martin",
  "Logan King", "Harper Wright", "Carter Scott", "Evelyn Green", "Ryan Adams",
  "Zoe Baker", "Owen Nelson", "Lily Hill", "Mason Roberts", "Aubrey Campbell"
];

const mockStaffUsers = ["staff_user", "alice", "admin_user"];
const productPool = mockProducts.filter(p => p.sellingPrice > 0 && p.stock > 0); // Only use products with stock and price

const generatedSales: Sale[] = [];
const generatedLogEntries: LogEntry[] = [];

const NUM_SALES_TO_GENERATE = 70;
const DAYS_RANGE = 90;

for (let i = 0; i < NUM_SALES_TO_GENERATE; i++) {
  const saleId = `sale-gen-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}-${i}`;
  const customerName = getRandomElement(mockCustomerNames);
  const customerContact = Math.random() > 0.3 ? `98${getRandomInt(10000000, 99999999)}` : undefined;
  const createdBy = getRandomElement(mockStaffUsers);
  const saleDate = getRandomDate(DAYS_RANGE);
  const saleOrigin = Math.random() > 0.4 ? 'store' : 'online';

  const numItemsInSale = getRandomInt(1, productPool.length > 2 ? 3 : productPool.length); // Max 3 items or available products
  const saleItems: SaleItem[] = [];
  const tempSelectedProductIds: string[] = [];

  for (let j = 0; j < numItemsInSale; j++) {
    if (productPool.length === 0) break;
    let product = getRandomElement(productPool);
    let attempts = 0;
    while(tempSelectedProductIds.includes(product.id) && attempts < productPool.length * 2) { // safety break
        product = getRandomElement(productPool);
        attempts++;
    }
    if (tempSelectedProductIds.includes(product.id) || !product) continue;

    tempSelectedProductIds.push(product.id);

    const quantity = getRandomInt(1, Math.min(5, product.stock > 0 ? product.stock : 1)); // Sell up to 5 or available stock
    saleItems.push({
      productId: product.id,
      productName: product.name,
      quantity: quantity,
      unitPrice: product.sellingPrice,
      totalPrice: quantity * product.sellingPrice,
      isFlaggedForDamageExchange: false,
      damageExchangeComment: '',
    });
  }

  if (saleItems.length === 0) continue;

  const totalAmount = saleItems.reduce((sum, item) => sum + item.totalPrice, 0);

  let cashPaid = 0;
  let digitalPaid = 0;
  let amountDue = 0;
  let formPaymentMethod: Sale['formPaymentMethod'] = 'Cash';
  let status: Sale['status'] = 'Paid';

  const paymentTypeRoll = Math.random();
  if (paymentTypeRoll < 0.35) {
    formPaymentMethod = 'Cash';
    cashPaid = totalAmount;
    status = 'Paid';
  } else if (paymentTypeRoll < 0.65) {
    formPaymentMethod = Math.random() < 0.5 ? 'Credit Card' : 'Debit Card';
    digitalPaid = totalAmount;
    status = 'Paid';
  } else if (paymentTypeRoll < 0.85) {
    formPaymentMethod = 'Due';
    amountDue = totalAmount;
    status = 'Due';
  } else {
    formPaymentMethod = 'Hybrid';
    if (totalAmount > 0) {
        cashPaid = parseFloat(getRandomElement([0, totalAmount * 0.25, totalAmount * 0.5, totalAmount * 0.3]).toFixed(2));
        digitalPaid = parseFloat(getRandomElement([0, (totalAmount - cashPaid) * 0.4, (totalAmount - cashPaid) * 0.6, (totalAmount-cashPaid)*0.5]).toFixed(2));
        if (cashPaid < 0) cashPaid = 0;
        if (digitalPaid < 0) digitalPaid = 0;

        const paidSoFar = cashPaid + digitalPaid;
        if (paidSoFar > totalAmount) {
            const overflow = paidSoFar - totalAmount;
            if (digitalPaid >= overflow) digitalPaid -= overflow;
            else if (cashPaid >= overflow) cashPaid -= overflow;
        }
        amountDue = parseFloat((totalAmount - (cashPaid + digitalPaid)).toFixed(2));
        if (amountDue < 0) amountDue = 0; // Ensure due is not negative
    }
    status = amountDue > 0.001 ? 'Due' : 'Paid';
  }

  const isFlagged = Math.random() < 0.10; // 10% chance of being flagged
  let flaggedComment = '';
  if (isFlagged) {
    const reasons = ["Incorrect item selection by staff", "Customer requested different product post-entry", "Payment verification pending", "Discount applied manually needs check", "Stock discrepancy noted during sale"];
    flaggedComment = getRandomElement(reasons);
  }

  const newSale: Sale = {
    id: saleId, customerName, customerContact, items: saleItems, totalAmount,
    cashPaid, digitalPaid, amountDue, formPaymentMethod,
    date: saleDate.toISOString(), status, createdBy, isFlagged, flaggedComment, saleOrigin,
  };
  generatedSales.push(newSale);

  const contactInfoLog = newSale.customerContact ? ` (${newSale.customerContact})` : '';
  let paymentLogDetails = '';
   if (newSale.formPaymentMethod === 'Hybrid') {
        const parts = [];
        if (newSale.cashPaid > 0) parts.push(`NRP ${newSale.cashPaid.toFixed(2)} by cash`);
        if (newSale.digitalPaid > 0) parts.push(`NRP ${newSale.digitalPaid.toFixed(2)} by digital`);
        if (newSale.amountDue > 0) parts.push(`NRP ${newSale.amountDue.toFixed(2)} due`);
        paymentLogDetails = `Payment: ${parts.join(', ')}.`;
    } else {
        paymentLogDetails = `Payment: ${newSale.formPaymentMethod}.`;
    }
  const saleLogDetails = `Sale ID ${newSale.id.substring(0,8)}... for ${newSale.customerName}${contactInfoLog}, Total: NRP ${newSale.totalAmount.toFixed(2)}. ${paymentLogDetails} Status: ${newSale.status}. Origin: ${newSale.saleOrigin}. Items: ${newSale.items.map(item => `${item.productName} (x${item.quantity})`).join(', ')}`;
  generatedLogEntries.push({
    id: `log-gen-sale-${newSale.id.substring(0,8)}-${i}`, timestamp: newSale.date, user: newSale.createdBy, action: 'Sale Created', details: saleLogDetails,
  });

  if (newSale.isFlagged) {
    generatedLogEntries.push({
      id: `log-gen-flag-${newSale.id.substring(0,8)}-${i}`, timestamp: new Date(new Date(newSale.date).getTime() + getRandomInt(1,10)*60000).toISOString(), // 1-10 mins after sale
      user: newSale.createdBy, action: 'Sale Flagged', details: `Sale ID ${newSale.id.substring(0,8)}... flagged by ${newSale.createdBy}. Comment: ${newSale.flaggedComment}`,
    });
  }
}

// Ensure all sales have the new fields initialized
initialMockSales.forEach(sale => {
  if (sale.isFlagged === undefined) sale.isFlagged = false;
  if (sale.flaggedComment === undefined) sale.flaggedComment = '';
  if (sale.saleOrigin === undefined) sale.saleOrigin = 'store';
  sale.items.forEach(item => {
    if (item.isFlaggedForDamageExchange === undefined) item.isFlaggedForDamageExchange = false;
    if (item.damageExchangeComment === undefined) item.damageExchangeComment = '';
  });
});


export const mockSales: Sale[] = [...initialMockSales, ...generatedSales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

export const mockExpenses: Expense[] = [
  {
    id: 'exp1',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'Monthly Rent',
    category: 'Rent',
    amount: 1200.00,
    recordedBy: 'admin_user'
  },
  {
    id: 'exp2',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'Electricity Bill',
    category: 'Utilities',
    amount: 150.75,
    recordedBy: 'admin_user'
  },
  {
    id: 'exp3',
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'Staff Lunch',
    category: 'Food',
    amount: 45.50,
    recordedBy: 'admin_user'
  },
  // Add more diverse expenses
  {
    id: 'exp4',
    date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'New Product Shipment Freight',
    category: 'Logistics',
    amount: 250.00,
    recordedBy: 'admin_user'
  },
  {
    id: 'exp5',
    date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'Marketing Campaign - Online Ads',
    category: 'Marketing',
    amount: 300.00,
    recordedBy: 'admin_user'
  },
  {
    id: 'exp6',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'Office Supplies (Pens, Paper)',
    category: 'Office Supplies',
    amount: 35.20,
    recordedBy: 'staff_user' // Staff can record some expenses
  },
   {
    id: 'exp7',
    date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(), // Over a month ago
    description: 'Software Subscription - Accounting',
    category: 'Software',
    amount: 75.00,
    recordedBy: 'admin_user'
  },
  {
    id: 'exp8',
    date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // Two months ago
    description: 'Shop Cleaning Services',
    category: 'Maintenance',
    amount: 100.00,
    recordedBy: 'admin_user'
  }
].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());


export const mockLogEntries: LogEntry[] = [...initialMockLogEntries, ...generatedLogEntries].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

// Ensure all sales items have the new fields
mockSales.forEach(sale => {
  sale.items.forEach(item => {
    if (item.isFlaggedForDamageExchange === undefined) {
      item.isFlaggedForDamageExchange = false;
    }
    if (item.damageExchangeComment === undefined) {
      item.damageExchangeComment = '';
    }
  });
});

// Helper function to add system-generated expenses
export function addSystemExpense(expenseData: Omit<Expense, 'id'>): Expense {
  const newExpense: Expense = {
    id: `exp-sys-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    ...expenseData,
  };
  mockExpenses.push(newExpense);
  mockExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  // Log this system expense
  const logEntry: LogEntry = {
    id: `log-exp-${newExpense.id}`,
    timestamp: new Date().toISOString(),
    user: newExpense.recordedBy || 'System', // Use recordedBy or 'System'
    action: 'System Expense Recorded',
    details: `Expense Category: ${newExpense.category}, Amount: NRP ${newExpense.amount.toFixed(2)}. Desc: ${newExpense.description}`,
  };
  mockLogEntries.unshift(logEntry); // Add to the beginning
  mockLogEntries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return newExpense;
}
    
    
    
