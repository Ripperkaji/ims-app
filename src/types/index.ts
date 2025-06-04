
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
  name: string;          // Product Name
  category: ProductType; // Category
  sellingPrice: number;  // Selling price to customer
  costPrice: number;     // Cost price per unit for the business
  totalAcquiredStock: number; // Cumulative total stock ever acquired/added
  damagedQuantity: number;    // Quantity marked as damaged
  stock: number;         // Current remaining stock (totalAcquiredStock - sold - damaged)
  testerQuantity: number; // Number of units designated as testers
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number; // This is sellingPrice at the time of sale
  totalPrice: number;
  isFlaggedForDamageExchange?: boolean; // New: For item-specific damage flag
  damageExchangeComment?: string;      // New: Comment for item-specific damage
}

export interface Sale {
  id: string;
  customerName: string;
  customerContact?: string;
  items: SaleItem[];
  totalAmount: number;
  
  cashPaid: number;
  digitalPaid: number;
  amountDue: number;
  
  formPaymentMethod: 'Cash' | 'Credit Card' | 'Debit Card' | 'Due' | 'Hybrid';

  date: string;
  status: 'Paid' | 'Due';
  createdBy: string;
  isFlagged?: boolean; // General flag for the sale
  flaggedComment?: string; // General comment for the sale, can summarize item flags
  saleOrigin: 'store' | 'online';
}

export interface Expense {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  recordedBy: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
}
