
export type UserRole = 'admin' | 'staff';

export const ALL_PRODUCT_TYPES = [
  "Disposables",
  "E-liquid Nic Salt",
  "E-liquid Free Base",
  "Coils",
  "POD/MOD Devices",
  "Cotton",
  "Coil Build & Maintenance"
] as const;

export type ProductType = typeof ALL_PRODUCT_TYPES[number];

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  type?: ProductType; // Added product type
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
  
  cashPaid: number;
  digitalPaid: number;
  amountDue: number;
  
  formPaymentMethod: 'Cash' | 'Credit Card' | 'Debit Card' | 'Due' | 'Hybrid';

  date: string; // ISO string format
  status: 'Paid' | 'Due'; // Derived: if amountDue > 0, then 'Due', else 'Paid'
  createdBy: string; // User name or ID
  isFlagged?: boolean;
  flaggedComment?: string;
  saleOrigin: 'store' | 'online'; // Added this field
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

