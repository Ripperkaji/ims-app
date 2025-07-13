
import type { Product, Sale, Expense, LogEntry, AcquisitionBatch, AcquisitionPaymentMethod, ExpensePaymentMethod, ManagedUser, UserRole, ProductType } from '@/types';
import { formatISO, subDays, subHours, subMonths } from 'date-fns'; 
import { calculateCurrentStock as calculateStockShared } from './productUtils';
import { formatCurrency } from './utils';

export let mockProducts: Product[] = []; 
export let mockSales: Sale[] = []; 
export let mockExpenses: Expense[] = [];
export let mockLogEntries: LogEntry[] = []; 
export let mockManagedUsers: ManagedUser[] = [];
export let mockCapital = {
  cashInHand: 0,
  digitalBalance: 0,
  lastUpdated: new Date().toISOString(),
  lastDigitalUpdated: new Date().toISOString()
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
      recordedBy: actorName, 
      paymentMethod: 'Digital', // Assuming system expenses are digital for mock
      cashPaid: 0,
      digitalPaid: expenseData.amount,
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
    `Initial Cash in Hand updated by ${actorName}. Old: NRP ${formatCurrency(oldAmount)}, New: NRP ${formatCurrency(newAmount)}.`
  );
  
  return { newAmount: mockCapital.cashInHand, lastUpdated: mockCapital.lastUpdated };
};

export const updateDigitalBalance = (newAmount: number, actorName: string): { newAmount: number; lastUpdated: string } => {
  const oldAmount = mockCapital.digitalBalance;
  mockCapital.digitalBalance = newAmount;
  mockCapital.lastDigitalUpdated = new Date().toISOString();
  
  addLogEntry(
    actorName,
    'Capital Updated',
    `Initial Bank/Digital Balance updated by ${actorName}. Old: NRP ${formatCurrency(oldAmount)}, New: NRP ${formatCurrency(newAmount)}.`
  );
  
  return { newAmount: mockCapital.digitalBalance, lastUpdated: mockCapital.lastDigitalUpdated };
};

// --- Managed User Functions ---

export function addManagedUser(name: string, role: UserRole, password_plaintext: string, addedBy: string, contactNumber: string): ManagedUser | null {
  const email = `${name.toLowerCase().replace(/\s+/g, '.')}@sh.com`;
  if (mockManagedUsers.some(u => u.name.toLowerCase() === name.toLowerCase())) {
    console.error(`User with name ${name} already exists.`);
    return null;
  }
  
  if (role === 'admin') {
      console.error("Cannot add 'admin' role via this function. Only 'staff' can be added.");
      return null;
  }
  
  const newUser: ManagedUser = {
    id: `user-${role}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    name,
    email,
    contactNumber,
    role,
    passwordHash: password_plaintext, // In real app, this would be hashed
    status: 'active',
    createdAt: new Date().toISOString(),
    addedBy,
  };
  mockManagedUsers.push(newUser);
  addLogEntry(addedBy, 'User Added', `New user '${name}' (${role}) was added by ${addedBy}.`);
  return newUser;
}

export function editManagedUser(userId: string, newName: string, editedBy: string, newContactNumber: string): ManagedUser | null {
  const userIndex = mockManagedUsers.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    console.error(`User with ID ${userId} not found for editing.`);
    return null;
  }
  const originalUser = mockManagedUsers[userIndex];
  originalUser.name = newName;
  originalUser.contactNumber = newContactNumber;
  addLogEntry(editedBy, 'User Edited', `User details for '${originalUser.email}' were updated by ${editedBy}.`);
  return originalUser;
}

export function deleteManagedUser(userId: string, deletedBy: string): boolean {
  const userIndex = mockManagedUsers.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    console.error(`User with ID ${userId} not found for deletion.`);
    return false;
  }
  const deletedUser = mockManagedUsers[userIndex];
  if (deletedUser.role === 'admin') {
      console.error("Admins cannot be deleted via this function.");
      return false;
  }
  mockManagedUsers.splice(userIndex, 1);
  addLogEntry(deletedBy, 'User Deleted', `User '${deletedUser.name}' was deleted by ${deletedBy}.`);
  return true;
}


function initializeData() {
    if (mockProducts.length > 0 || mockManagedUsers.length > 2) { 
        return;
    }
    
    // Clear all existing data to ensure a fresh start
    mockProducts.length = 0;
    mockSales.length = 0;
    mockExpenses.length = 0;
    mockLogEntries.length = 0;
    mockManagedUsers.length = 0;

    mockManagedUsers.push(
        { id: `user-admin-nps-${Date.now()}`, name: 'NPS', email: 'nps@sh.com', contactNumber: '9800000001', role: 'admin', passwordHash: '12345', status: 'active', createdAt: new Date().toISOString(), addedBy: 'System' },
        { id: `user-admin-skg-${Date.now()}`, name: 'SKG', email: 'skg@sh.com', contactNumber: '9800000002', role: 'admin', passwordHash: '12345', status: 'active', createdAt: new Date().toISOString(), addedBy: 'System' }
    );
    addManagedUser('Staff User', 'staff', 'staff123', 'SKG', '9800000003');
    addManagedUser('Jane Doe', 'staff', 'jane123', 'NPS', '9800000004');


    mockCapital.cashInHand = 75000;
    mockCapital.lastUpdated = subDays(new Date(), 45).toISOString();
    mockCapital.digitalBalance = 150000;
    mockCapital.lastDigitalUpdated = subDays(new Date(), 45).toISOString();
    addLogEntry('NPS', 'Capital Updated', `Initial cash in hand set to NRP ${formatCurrency(mockCapital.cashInHand)}.`);
    addLogEntry('NPS', 'Capital Updated', `Initial bank/digital balance set to NRP ${formatCurrency(mockCapital.digitalBalance)}.`);

    const productDefinitions = [
        { name: 'IGET', modelName: 'LEGEND', flavorName: 'Lush Ice', category: 'Disposables', cost: 800, price: 1200, stock: 25, supplier: 'Vape Supplies Co.' },
        { name: 'IGET', modelName: 'LEGEND', flavorName: 'Grape Ice', category: 'Disposables', cost: 800, price: 1200, stock: 18, supplier: 'Vape Supplies Co.' },
        { name: 'IGET', modelName: 'BAR', flavorName: 'Cola Ice', category: 'Disposables', cost: 750, price: 1100, stock: 30, supplier: 'Vape Supplies Co.' },
        { name: 'ELFBAR', modelName: 'BC5000', flavorName: 'Watermelon Ice', category: 'Disposables', cost: 1500, price: 2200, stock: 12, supplier: 'Global Vapes Inc.', due: 9000 },
        { name: 'ELFBAR', modelName: 'BC5000', flavorName: 'Strawberry Kiwi', category: 'Disposables', cost: 1500, price: 2200, stock: 8, supplier: 'Global Vapes Inc.'},
        { name: 'YUOTO', modelName: 'THANOS', flavorName: 'Blueberry Ice', category: 'Disposables', cost: 1600, price: 2500, stock: 7, supplier: 'Global Vapes Inc.'},

        { name: 'DR. VAPES', modelName: 'PANTHER', flavorName: 'Pink', category: 'E-liquid Free Base', cost: 1200, price: 1800, stock: 10, supplier: 'E-Juice World' },
        { name: 'DR. VAPES', modelName: 'PANTHER', flavorName: 'Purple', category: 'E-liquid Free Base', cost: 1200, price: 1800, stock: 5, supplier: 'E-Juice World' },
        { name: 'BLVK', modelName: 'SALT', flavorName: 'Cuban Cigar', category: 'E-liquid Nic Salt', cost: 1300, price: 2000, stock: 15, supplier: 'E-Juice World' },
        { name: 'NASTY', modelName: 'SALT', flavorName: 'Cush Man', category: 'E-liquid Nic Salt', cost: 1100, price: 1700, stock: 9, supplier: 'E-Juice World' },

        { name: 'VOOPOO', modelName: 'DRAG S', category: 'POD/MOD Devices', cost: 4500, price: 6500, stock: 6, supplier: 'Hardware Distribution', due: 13500 },
        { name: 'GEEKVAPE', modelName: 'AEGIS L200', category: 'POD/MOD Devices', cost: 7000, price: 9500, stock: 3, supplier: 'Hardware Distribution'},
        { name: 'SMOK', modelName: 'RPM 2', flavorName: '0.16 Mesh', category: 'Coils', cost: 350, price: 500, stock: 50, supplier: 'Hardware Distribution' },
        { name: 'GEEKVAPE', modelName: 'Z-COIL', flavorName: '0.4 Mesh', category: 'Coils', cost: 380, price: 550, stock: 40, supplier: 'Hardware Distribution' },
        { name: 'MUJI', modelName: 'ORGANIC', category: 'Cotton', cost: 50, price: 150, stock: 100, supplier: 'DIY Vapes' },
        { name: 'COIL MASTER', modelName: 'DIY KIT', category: 'Coil Build & Maintenance', cost: 1800, price: 2800, stock: 5, supplier: 'DIY Vapes' }
    ];

    productDefinitions.forEach((p, index) => {
        const newProductId = `prod-${index}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const totalBatchCost = p.cost * p.stock;
        const dueAmount = p.due || 0;
        const paidAmount = totalBatchCost - dueAmount;
        const cashPaid = dueAmount > 0 ? paidAmount : totalBatchCost;
        const digitalPaid = 0;
        const paymentMethod: AcquisitionPaymentMethod = dueAmount > 0 ? 'Hybrid' : 'Cash';
        const addedBy = index % 3 === 0 ? 'SKG' : 'NPS';

        const firstBatch: AcquisitionBatch = {
            batchId: `batch-${newProductId}-${Date.now()}`,
            date: subDays(new Date(), 40 - index).toISOString(),
            condition: 'Initial Stock',
            supplierName: p.supplier,
            quantityAdded: p.stock,
            costPricePerUnit: p.cost,
            sellingPricePerUnitAtAcquisition: p.price,
            paymentMethod, totalBatchCost, cashPaid, digitalPaid, dueToSupplier: dueAmount, addedBy
        };

        const newProduct: Product = {
            id: newProductId, name: p.name, modelName: p.modelName, flavorName: p.flavorName, category: p.category as ProductType,
            currentSellingPrice: p.price, currentCostPrice: p.cost, acquisitionHistory: [firstBatch],
            damagedQuantity: index === 3 ? 2 : 0, 
            testerQuantity: index === 0 ? 1 : 0 
        };
        mockProducts.push(newProduct);
        const fullProductName = `${p.name}${p.modelName ? ` (${p.modelName})` : ''}${p.flavorName ? ` - ${p.flavorName}` : ''}`;
        addLogEntry(addedBy, "Product Added", `Product '${fullProductName}' added by ${addedBy}. Initial Qty: ${p.stock}.`);

        if (newProduct.damagedQuantity > 0) {
            addSystemExpense({
                date: new Date().toISOString(),
                description: `Damaged Goods: ${newProduct.damagedQuantity}x ${fullProductName}`,
                category: "Product Damage",
                amount: newProduct.damagedQuantity * newProduct.currentCostPrice,
                recordedBy: addedBy
            }, addedBy);
             addLogEntry(addedBy, "Product Damage & Stock Update (Exchange)", `Initial setup: Item '${fullProductName}' (Qty: ${newProduct.damagedQuantity}) marked damaged by ${addedBy}.`);
        }
        if (newProduct.testerQuantity > 0) {
            addSystemExpense({
                date: new Date().toISOString(),
                description: `Sample/Demo Allocation: ${newProduct.testerQuantity}x ${fullProductName}`,
                category: "Sample/Demo Allocation",
                amount: newProduct.testerQuantity * newProduct.currentCostPrice,
                recordedBy: addedBy
            }, addedBy);
            addLogEntry(addedBy, "Sample/Demo Quantity Updated", `Initial setup: Sample/Demo quantity for '${fullProductName}' set to ${newProduct.testerQuantity} by ${addedBy}.`);
        }
    });

    const saleCustomers = ['Alice', 'Bob', 'Charlie', 'David', 'Eve', 'Frank', 'Grace', 'Heidi'];
    for(let i=0; i < 25; i++) {
        const product1 = mockProducts[i % mockProducts.length];
        const product2 = mockProducts[(i + 5) % mockProducts.length];
        if (product1.id === product2.id) continue;
        const quantity1 = 1 + (i % 2);
        const quantity2 = (i % 4 === 0) ? 1 : 0;
        let totalAmount = product1.currentSellingPrice * quantity1;
        const saleItems : SaleItem[] = [{ productId: product1.id, productName: `${product1.name} ${product1.modelName || ''} ${product1.flavorName || ''}`.trim(), quantity: quantity1, unitPrice: product1.currentSellingPrice, totalPrice: product1.currentSellingPrice * quantity1 }];

        if (quantity2 > 0) {
             saleItems.push({ productId: product2.id, productName: `${product2.name} ${product2.modelName || ''} ${product2.flavorName || ''}`.trim(), quantity: quantity2, unitPrice: product2.currentSellingPrice, totalPrice: product2.currentSellingPrice * quantity2 });
             totalAmount += product2.currentSellingPrice * quantity2;
        }

        const paymentType = i % 5;
        let formPaymentMethod: Sale['formPaymentMethod'] = 'Cash';
        let cashPaid = 0, digitalPaid = 0, amountDue = 0;
        if(paymentType === 1) { formPaymentMethod = 'Digital'; digitalPaid = totalAmount; }
        else if (paymentType === 2) { formPaymentMethod = 'Due'; amountDue = totalAmount; }
        else if (paymentType === 3) { formPaymentMethod = 'Hybrid'; cashPaid = totalAmount * 0.5; amountDue = totalAmount * 0.5; }
        else { cashPaid = totalAmount; }

        const saleDate = subHours(new Date(), i * 10);
        const saleUser = i % 3 === 0 ? 'NPS' : (i % 3 === 1 ? 'SKG' : 'Staff User');

        const newSale: Sale = {
            id: String(i + 1).padStart(4, '0'),
            customerName: saleCustomers[i % saleCustomers.length],
            customerContact: i % 2 === 0 ? `98000000${10 + i}` : undefined,
            items: saleItems, totalAmount, cashPaid, digitalPaid, amountDue, formPaymentMethod,
            date: saleDate.toISOString(), status: amountDue > 0 ? 'Due' : 'Paid',
            createdBy: saleUser, saleOrigin: i % 2 === 0 ? 'store' : 'online',
            isFlagged: i === 1,
            flaggedComment: i === 1 ? 'Customer reported item was faulty. Exchanged on spot.' : ''
        };
        mockSales.push(newSale);
        addLogEntry(saleUser, "Sale Created", `Sale ID ${newSale.id} for ${newSale.customerName}, Total: NRP ${formatCurrency(newSale.totalAmount)}.`);
    }
     
     const tempExpenses: Omit<Expense, 'id'>[] = [
         { date: subDays(new Date(), 35).toISOString(), description: 'Office Rent - Last Month', category: 'Rent', amount: 30000, recordedBy: 'NPS', paymentMethod: 'Cash', cashPaid: 30000, digitalPaid: 0, amountDue: 0},
         { date: subDays(new Date(), 20).toISOString(), description: 'Internet Bill', category: 'Utilities', amount: 2500, recordedBy: 'SKG', paymentMethod: 'Digital', cashPaid: 0, digitalPaid: 2500, amountDue: 0 },
         { date: subDays(new Date(), 10).toISOString(), description: 'Catering for event', category: 'Marketing and Advertising', amount: 7500, recordedBy: 'NPS', paymentMethod: 'Due', cashPaid: 0, digitalPaid: 0, amountDue: 7500 },
         { date: subDays(new Date(), 2).toISOString(), description: 'Staff Salaries', category: 'Salaries and Benefits', amount: 45000, recordedBy: 'SKG', paymentMethod: 'Hybrid', cashPaid: 20000, digitalPaid: 25000, amountDue: 0 }
     ];
     tempExpenses.forEach((exp, index) => {
        const newExpense: Expense = { id: `exp-${index}-${Date.now()}`, ...exp };
        mockExpenses.push(newExpense);
        addLogEntry(exp.recordedBy, "Expense Recorded", `Expense for '${exp.description}', Amount: NRP ${formatCurrency(exp.amount)}.`);
     });
}


initializeData();
