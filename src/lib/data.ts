
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
    id: `user-${role}-${Date.now()}`,
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
    if (mockProducts.length > 0 || mockManagedUsers.length > 2) { // check for > 2 to allow re-init if only admins are there
        return;
    }

    // 1. Initialize Users
    mockManagedUsers.push(
        { id: 'user-admin-nps', name: 'NPS', email: 'nps@sh.com', contactNumber: '9800000001', role: 'admin', passwordHash: '12345', status: 'active', createdAt: new Date().toISOString(), addedBy: 'System' },
        { id: 'user-admin-skg', name: 'SKG', email: 'skg@sh.com', contactNumber: '9800000002', role: 'admin', passwordHash: '12345', status: 'active', createdAt: new Date().toISOString(), addedBy: 'System' }
    );
    addManagedUser('Staff User', 'staff', 'staff123', 'SKG', '9800000003');

    // 2. Initialize Capital
    mockCapital.cashInHand = 50000;
    mockCapital.lastUpdated = new Date().toISOString();
    addLogEntry('NPS', 'Capital Updated', `Initial cash in hand set to NRP ${formatCurrency(mockCapital.cashInHand)}.`);

    // 3. Initialize Products
    const productDefinitions = [
        // Disposables
        { name: 'IGET', modelName: 'LEGEND', flavorName: 'Lush Ice', category: 'Disposables', cost: 800, price: 1200, stock: 20, supplier: 'Vape Supplies Co.' },
        { name: 'IGET', modelName: 'LEGEND', flavorName: 'Grape Ice', category: 'Disposables', cost: 800, price: 1200, stock: 15, supplier: 'Vape Supplies Co.' },
        { name: 'ELFBAR', modelName: 'BC5000', flavorName: 'Watermelon Ice', category: 'Disposables', cost: 1500, price: 2200, stock: 10, supplier: 'Global Vapes Inc.', due: 7500 }, // Has due
        { name: 'YUOTO', modelName: 'THANOS', flavorName: 'Blueberry Ice', category: 'Disposables', cost: 1600, price: 2500, stock: 5, supplier: 'Global Vapes Inc.'},

        // E-liquids
        { name: 'DR. VAPES', modelName: 'PANTHER', flavorName: 'Pink', category: 'E-liquid Free Base', cost: 1200, price: 1800, stock: 8, supplier: 'E-Juice World' },
        { name: 'BLVK', modelName: 'SALT', flavorName: 'Cuban Cigar', category: 'E-liquid Nic Salt', cost: 1300, price: 2000, stock: 12, supplier: 'E-Juice World' },
        { name: 'NASTY', modelName: 'SALT', flavorName: 'Cush Man', category: 'E-liquid Nic Salt', cost: 1100, price: 1700, stock: 7, supplier: 'E-Juice World' },

        // Devices and Coils
        { name: 'VOOPOO', modelName: 'DRAG S', category: 'POD/MOD Devices', cost: 4500, price: 6500, stock: 4, supplier: 'Hardware Distribution', due: 4500 },
        { name: 'SMOK', modelName: 'RPM 2', flavorName: '0.16 Mesh', category: 'Coils', cost: 350, price: 500, stock: 50, supplier: 'Hardware Distribution' },
        { name: 'GEEKVAPE', modelName: 'Z-COIL', flavorName: '0.4 Mesh', category: 'Coils', cost: 380, price: 550, stock: 30, supplier: 'Hardware Distribution' }
    ];

    productDefinitions.forEach((p, index) => {
        const newProductId = `prod-${index}-${Date.now()}`;
        const totalBatchCost = p.cost * p.stock;
        const dueAmount = p.due || 0;
        const cashPaid = dueAmount > 0 ? (totalBatchCost - dueAmount) / 2 : totalBatchCost;
        const digitalPaid = dueAmount > 0 ? (totalBatchCost - dueAmount) / 2 : 0;
        const paymentMethod: AcquisitionPaymentMethod = dueAmount > 0 ? 'Hybrid' : 'Cash';
        const addedBy = index % 2 === 0 ? 'SKG' : 'NPS';

        const firstBatch: AcquisitionBatch = {
            batchId: `batch-${newProductId}-${Date.now()}`,
            date: subDays(new Date(), 30 + index * 2).toISOString(),
            condition: 'Initial Stock',
            supplierName: p.supplier,
            quantityAdded: p.stock,
            costPricePerUnit: p.cost,
            sellingPricePerUnitAtAcquisition: p.price,
            paymentMethod,
            totalBatchCost,
            cashPaid,
            digitalPaid,
            dueToSupplier: dueAmount,
            addedBy: addedBy
        };

        const newProduct: Product = {
            id: newProductId,
            name: p.name,
            modelName: p.modelName,
            flavorName: p.flavorName,
            category: p.category as ProductType,
            currentSellingPrice: p.price,
            currentCostPrice: p.cost,
            acquisitionHistory: [firstBatch],
            damagedQuantity: index % 4 === 0 ? 1 : 0, // Some damaged items
            testerQuantity: index % 5 === 0 ? 1 : 0 // Some testers
        };
        mockProducts.push(newProduct);
        
        const fullProductName = `${newProduct.name}${newProduct.modelName ? ` (${newProduct.modelName})` : ''}${newProduct.flavorName ? ` - ${newProduct.flavorName}` : ''}`;
        let logDetails = `Product '${fullProductName}' added by ${addedBy}. Current Cost: NRP ${formatCurrency(newProduct.currentCostPrice)}, Current MRP: NRP ${formatCurrency(newProduct.currentSellingPrice)}. Initial Batch Qty: ${p.stock}.`;
        if (p.supplier) logDetails += ` Supplier: ${p.supplier}.`;
         if (firstBatch.totalBatchCost > 0) {
            logDetails += ` Batch Cost: NRP ${formatCurrency(firstBatch.totalBatchCost)} via ${firstBatch.paymentMethod}.`;
            if (firstBatch.paymentMethod === 'Hybrid') {
                logDetails += ` (Cash: ${formatCurrency(firstBatch.cashPaid)}, Digital: ${formatCurrency(firstBatch.digitalPaid)}, Due: ${formatCurrency(firstBatch.dueToSupplier)})`;
            } else if (firstBatch.paymentMethod === 'Due') {
                logDetails += ` (Due: ${formatCurrency(firstBatch.dueToSupplier)})`;
            }
        }
        addLogEntry(addedBy, "Product Added", logDetails);

        if (newProduct.damagedQuantity > 0) {
            addLogEntry(
                'SKG', 
                "Product Damage & Stock Update (Exchange)", 
                `Product Damage & Stock Update (Exchange): Item '${fullProductName}' (Qty: ${newProduct.damagedQuantity}) marked damaged & exchanged by SKG as part of initial setup.`
            );
        }
        if (newProduct.testerQuantity > 0) {
            addLogEntry(
                'NPS', 
                "Sample/Demo Quantity Updated", 
                `Sample/Demo quantity for '${fullProductName}' changed from 0 to ${newProduct.testerQuantity} by NPS as part of initial setup.`
            );
        }
    });

    // 4. Initialize Sales
    const saleCustomers = ['Alice', 'Bob', 'Charlie', 'David', 'Eve', 'Frank'];
    for(let i=0; i < 15; i++) {
        const product1 = mockProducts[i % mockProducts.length];
        const product2 = mockProducts[(i + 3) % mockProducts.length];
        const quantity1 = 1;
        const quantity2 = (i % 3 === 0) ? 1 : 0;
        let totalAmount = product1.currentSellingPrice * quantity1;

        const saleItems : SaleItem[] = [{
            productId: product1.id,
            productName: `${product1.name}${product1.modelName ? ` (${product1.modelName})` : ''}${product1.flavorName ? ` - ${product1.flavorName}` : ''}`.trim(),
            quantity: quantity1,
            unitPrice: product1.currentSellingPrice,
            totalPrice: product1.currentSellingPrice * quantity1
        }];

        if (quantity2 > 0 && product1.id !== product2.id) {
             saleItems.push({
                productId: product2.id,
                productName: `${product2.name}${product2.modelName ? ` (${product2.modelName})` : ''}${product2.flavorName ? ` - ${product2.flavorName}` : ''}`.trim(),
                quantity: quantity2,
                unitPrice: product2.currentSellingPrice,
                totalPrice: product2.currentSellingPrice * quantity2
             });
             totalAmount += product2.currentSellingPrice * quantity2;
        }

        const isDue = i % 4 === 0;
        const isHybrid = i % 5 === 0 && !isDue;
        const saleDate = subDays(new Date(), i * 2);

        const newSale: Sale = {
            id: String(i + 1).padStart(4, '0'),
            customerName: saleCustomers[i % saleCustomers.length],
            customerContact: `98000000${10 + i}`,
            items: saleItems,
            totalAmount: totalAmount,
            cashPaid: isDue ? 0 : (isHybrid ? totalAmount / 2 : totalAmount),
            digitalPaid: isDue ? 0 : (isHybrid ? totalAmount / 2 : 0),
            amountDue: isDue ? totalAmount : 0,
            formPaymentMethod: isDue ? 'Due' : (isHybrid ? 'Hybrid' : 'Cash'),
            date: saleDate.toISOString(),
            status: isDue ? 'Due' : 'Paid',
            createdBy: i % 2 === 0 ? 'NPS' : 'Staff User',
            saleOrigin: i % 2 === 0 ? 'store' : 'online',
            isFlagged: i === 1,
            flaggedComment: i === 1 ? 'Customer reported item was faulty. Exchanged on spot.' : ''
        };
        mockSales.push(newSale);
        
        const contactInfoLog = newSale.customerContact ? ` (${newSale.customerContact})` : '';
        let paymentLogDetails = '';
        if (newSale.formPaymentMethod === 'Hybrid') { const parts = []; if (newSale.cashPaid > 0) parts.push(`NRP ${formatCurrency(newSale.cashPaid)} by cash`); if (newSale.digitalPaid > 0) parts.push(`NRP ${formatCurrency(newSale.digitalPaid)} by digital`); if (newSale.amountDue > 0) parts.push(`NRP ${formatCurrency(newSale.amountDue)} due`); paymentLogDetails = `Payment: ${parts.join(', ')}.`; }
        else { paymentLogDetails = `Payment: ${newSale.formPaymentMethod}.`; }
        const logDetails = `Sale ID ${newSale.id} for ${newSale.customerName}${contactInfoLog}, Total: NRP ${formatCurrency(newSale.totalAmount)}. ${paymentLogDetails} Status: ${newSale.status}. Origin: ${newSale.saleOrigin}. Items: ${newSale.items.map(i => `${i.productName} (x${i.quantity})`).join(', ')}`;
        addLogEntry(newSale.createdBy, "Sale Created", logDetails);

        if (newSale.isFlagged) {
            addLogEntry(newSale.createdBy, "Sale Flagged", `Sale ID ${newSale.id} flagged by ${newSale.createdBy}. ${newSale.flaggedComment}`);
        }
    }
     
     // 5. Initialize Expenses
     const tempExpenses: Omit<Expense, 'id'>[] = [
         { date: subDays(new Date(), 40).toISOString(), description: 'Office Rent - May', category: 'Rent', amount: 25000, recordedBy: 'NPS', paymentMethod: 'Cash', cashPaid: 25000, digitalPaid: 0, amountDue: 0},
         { date: subDays(new Date(), 25).toISOString(), description: 'Internet Bill', category: 'Utilities', amount: 2000, recordedBy: 'SKG', paymentMethod: 'Digital', cashPaid: 0, digitalPaid: 2000, amountDue: 0 },
         { date: subDays(new Date(), 15).toISOString(), description: 'Catering for event', category: 'Marketing and Advertising', amount: 5000, recordedBy: 'NPS', paymentMethod: 'Due', cashPaid: 0, digitalPaid: 0, amountDue: 5000 },
         { date: subDays(new Date(), 5).toISOString(), description: 'Staff Salary - May', category: 'Salaries and Benefits', amount: 15000, recordedBy: 'SKG', paymentMethod: 'Hybrid', cashPaid: 10000, digitalPaid: 5000, amountDue: 0 }
     ];
     tempExpenses.forEach((exp, index) => {
        const newExpense: Expense = {
            id: `exp-${index}-${Date.now()}`,
            ...exp
        }
        mockExpenses.push(newExpense);
        let paymentLogString = `Paid via ${newExpense.paymentMethod}.`;
        if (newExpense.paymentMethod === 'Hybrid') {
          const parts = [];
          if (newExpense.cashPaid && newExpense.cashPaid > 0) parts.push(`Cash: NRP ${formatCurrency(newExpense.cashPaid)}`);
          if (newExpense.digitalPaid && newExpense.digitalPaid > 0) parts.push(`Digital: NRP ${formatCurrency(newExpense.digitalPaid)}`);
          if (newExpense.amountDue && newExpense.amountDue > 0) parts.push(`Due: NRP ${formatCurrency(newExpense.amountDue)}`);
          paymentLogString = `Paid via Hybrid (${parts.join(', ')}).`;
        } else if (newExpense.paymentMethod === 'Due') {
            paymentLogString = `Marked as Due (NRP ${formatCurrency(newExpense.amount)}).`;
        }
        const logDetails = `Expense for '${newExpense.description}' (Category: ${newExpense.category}), Amount: NRP ${formatCurrency(newExpense.amount)} recorded by ${newExpense.recordedBy}. ${paymentLogString}`;
        addLogEntry(newExpense.recordedBy, "Expense Recorded", logDetails);
     })
}


initializeData();
