
export type UserRole = 'admin' | 'staff';

export type ProductType = 
  | "Disposables"
  | "E-liquid Nic Salt"
  | "E-liquid Free Base"
  | "Coils"
  | "POD/MOD Devices"
  | "Cotton"
  | "Coil Build & Maintenance";

export const ALL_PRODUCT_TYPES: ProductType[] = [
  "Disposables",
  "E-liquid Nic Salt",
  "E-liquid Free Base",
  "Coils",
  "POD/MOD Devices",
  "Cotton",
  "Coil Build & Maintenance",
];

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  type?: ProductType;
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
  
  // New detailed payment fields
  cashPaid: number;
  digitalPaid: number;
  amountDue: number;
  
  // Stores the primary method selected in the form (Cash, Credit Card, Debit Card, Due, Hybrid)
  formPaymentMethod: 'Cash' | 'Credit Card' | 'Debit Card' | 'Due' | 'Hybrid';

  date: string; // ISO string format
  status: 'Paid' | 'Due'; // Derived: if amountDue > 0, then 'Due', else 'Paid'
  createdBy: string; // User name or ID
  isFlagged?: boolean;
  flaggedComment?: string;
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

