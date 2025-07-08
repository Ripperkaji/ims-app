
import type { Product, Sale, Expense, LogEntry, AcquisitionBatch, AcquisitionPaymentMethod, ExpensePaymentMethod, ManagedUser, UserRole } from '@/types';
import { formatISO } from 'date-fns';
import { calculateCurrentStock as calculateStockShared } from './productUtils'; // For internal use if needed

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
      paymentMethod: 'Digital',
      cashPaid: expenseData.amount,
      digitalPaid: 0,
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


function initializeDefaultUsers() {
    if (mockManagedUsers.length === 0) {
        mockManagedUsers.push(
            { id: 'user-admin-nps', name: 'NPS', email: 'nps@sh.com', contactNumber: '9800000001', role: 'admin', passwordHash: '12345', status: 'active', createdAt: new Date().toISOString(), addedBy: 'System' },
            { id: 'user-admin-skg', name: 'SKG', email: 'skg@sh.com', contactNumber: '9800000002', role: 'admin', passwordHash: '12345', status: 'active', createdAt: new Date().toISOString(), addedBy: 'System' }
        );
         addLogEntry('System', 'Initialization', 'Default admin users created.');
    }
}

// Initialize default users on load
initializeDefaultUsers();
