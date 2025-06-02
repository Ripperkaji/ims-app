
export type UserRole = 'admin' | 'staff';

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Sale {
  id: string;
  customerName: string;
  customerContact?: string; // Optional contact number
  items: SaleItem[];
  totalAmount: number;
  paymentMethod: 'Cash' | 'Credit Card' | 'Debit Card' | 'Due';
  date: string; // ISO string format
  status: 'Paid' | 'Due';
  createdBy: string; // User name or ID
}

export interface Expense {
  id: string;
  date: string; // ISO string format
  description: string;
  category: string;
  amount: number;
  recordedBy: string; // User name or ID
}

export interface LogEntry {
  id: string;
  timestamp: string; // ISO string format
  user: string; // User name or ID
  action: string; // e.g., "Sale Created", "Expense Added", "Sale Modified"
  details: string; // Description of the change or event
}
