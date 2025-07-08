

import type { Product, Sale, Expense, LogEntry, AcquisitionBatch, AcquisitionPaymentMethod, ProductType, ManagedUser, UserRole, ExpensePaymentMethod } from '@/types';
import { formatISO } from 'date-fns';
import { calculateCurrentStock as calculateStockShared } from './productUtils'; // For internal use if needed

// App-wide settings, persisted in memory for this mock application
export let appSettings = {
  isInitialized: false,
  companyName: null as string | null,
};


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
export let mockManagedUsers: ManagedUser[] = []; // Initially empty, populated by initialization & user management
export let mockCapital = { // Initially empty
  cashInHand: 0,
  lastUpdated: new Date().toISOString(),
};

// --- Initialization ---

// This function is called once from the initialization page
export const initializeAppWithSuperAdmin = (data: {
  companyName: string;
  superAdminName: string;
  superAdminEmail: string;
  superAdminContact: string;
  superAdminPassword_plaintext: string;
}) => {
  if (appSettings.isInitialized) {
    console.error("App is already initialized.");
    return null;
  }

  const superAdmin: ManagedUser = {
    id: `user-sa-${Date.now()}`,
    name: data.superAdminName,
    email: data.superAdminEmail.toLowerCase(),
    contactNumber: data.superAdminContact,
    role: 'super-admin',
    passwordHash: data.superAdminPassword_plaintext, // In a real app, HASH THIS
    status: 'active',
    createdAt: new Date().toISOString(),
    addedBy: 'system_init',
  };

  mockManagedUsers.push(superAdmin);
  appSettings.isInitialized = true;
  appSettings.companyName = data.companyName;

  addLogEntry('System', 'Application Initialized', `Super Admin '${superAdmin.name}' created and company '${data.companyName}' set up.`);
  
  return superAdmin;
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
    `Cash in Hand updated by ${actorName}. Old: NRP ${oldAmount.toFixed(2)}, New: NRP ${newAmount.toFixed(2)}.`
  );
  
  return { newAmount: mockCapital.cashInHand, lastUpdated: mockCapital.lastUpdated };
};


// --- User Management ---

export const addManagedUser = (
    name: string,
    email: string,
    contactNumber: string,
    role: UserRole,
    password_plaintext: string,
    addedBy: string
): ManagedUser | null => {
  if (!name.trim() || !password_plaintext.trim() || !email.trim()) return null;

  if (mockManagedUsers.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      console.error(`User with email ${email} already exists.`);
      return null;
  }

  const newUser: ManagedUser = {
    id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: name.trim(),
    email: email.toLowerCase().trim(),
    contactNumber: contactNumber.trim(),
    role, 
    passwordHash: password_plaintext, // HASH in a real app
    status: 'active', // Simulate immediate activation
    createdAt: new Date().toISOString(),
    addedBy,
  };
  mockManagedUsers.push(newUser);
  
  addLogEntry(addedBy, 'User Added', `User '${newUser.name}' (Role: ${newUser.role}) added by ${addedBy}. A verification email was simulated as sent to ${newUser.email}.`);
  return newUser;
};

export const editManagedUser = (userId: string, newName: string, newContact: string, editedBy: string): ManagedUser | null => {
  const userIndex = mockManagedUsers.findIndex(u => u.id === userId);
  if (userIndex === -1 || !newName.trim()) {
    return null;
  }
  const originalUser = { ...mockManagedUsers[userIndex] };

  let details = `User ID ${userId.substring(0,8)}... details updated by ${editedBy}.`;
  if (originalUser.name !== newName.trim()) {
      mockManagedUsers[userIndex].name = newName.trim();
      details += ` Name: '${originalUser.name}' -> '${newName.trim()}'.`;
  }
  if (originalUser.contactNumber !== newContact.trim()) {
      mockManagedUsers[userIndex].contactNumber = newContact.trim();
      details += ` Contact: '${originalUser.contactNumber}' -> '${newContact.trim()}'.`;
  }
  
  addLogEntry(editedBy, 'User Edited', details);
  return mockManagedUsers[userIndex];
};

export const deleteManagedUser = (userId: string, deletedBy: string): ManagedUser | null => {
  const userIndex = mockManagedUsers.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    return null;
  }
  
  const deletedUser = mockManagedUsers[userIndex];

  if (deletedUser.role === 'super-admin') {
    console.warn(`Attempted to delete a super-admin. This is not allowed.`);
    addLogEntry(deletedBy, "User Deletion Failed", `Attempted to delete Super Admin '${deletedUser.name}'. This action is blocked.`);
    return null;
  }

  mockManagedUsers.splice(userIndex, 1);

  addLogEntry(deletedBy, 'User Deleted', `User '${deletedUser.name}' (ID: ${userId.substring(0,8)}...) deleted by ${deletedBy}.`);
  return deletedUser;
};
