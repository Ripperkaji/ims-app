
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
export type AcquisitionPaymentMethod = 'Cash' | 'Digital' | 'Due' | 'Hybrid';

export interface AcquisitionBatch {
  batchId: string;
  date: string;
  condition: string; // e.g., "Initial Stock", "Product Added", "Restock (Same Supplier/Price)", "Restock (Same Supplier, New Price)", "Restock (New Supplier)"
  supplierName?: string;
  quantityAdded: number;
  costPricePerUnit: number;
  sellingPricePerUnitAtAcquisition?: number; // MRP at the time of this batch's acquisition if it was set/changed
  paymentMethod: AcquisitionPaymentMethod;
  totalBatchCost: number;
  cashPaid: number;
  digitalPaid: number;
  dueToSupplier: number;
}

export interface Product {
  id: string;
  name: string;
  category: ProductType;
  currentSellingPrice: number; // Current effective selling price
  currentCostPrice: number;    // Current effective cost price (e.g., from last batch or weighted average)
  
  acquisitionHistory: AcquisitionBatch[];
  
  damagedQuantity: number;    // Overall damaged quantity for this product
  testerQuantity: number; // Number of units designated as testers
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number; // This is sellingPrice at the time of sale
  totalPrice: number;
  isFlaggedForDamageExchange?: boolean;
  damageExchangeComment?: string;
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
  isFlagged?: boolean;
  flaggedComment?: string;
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
