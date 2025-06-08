
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
  currentSellingPrice: number; 
  currentCostPrice: number;    
  
  acquisitionHistory: AcquisitionBatch[];
  
  damagedQuantity: number;    
  testerQuantity: number; 
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number; 
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

// For HandleExistingProductDialog
export interface AttemptedProductData {
  name: string;
  category: ProductType;
  sellingPrice: number; 
  costPrice: number;    
  totalAcquiredStock: number;
}

interface BaseResolution {
  existingProductId: string;
  quantityAdded: number;
  paymentDetails: {
    method: AcquisitionPaymentMethod;
    cashPaid: number;
    digitalPaid: number;
    dueAmount: number;
    totalAcquisitionCost: number;
  };
}

export interface Condition1Data extends BaseResolution {
  condition: 'condition1'; // Restock (Same Supplier/Price)
}

export interface Condition2Data extends BaseResolution {
  condition: 'condition2'; // Restock (Same Supplier, New Price)
  newCostPrice: number;
  newSellingPrice: number;
}

export interface Condition3Data extends BaseResolution {
  condition: 'condition3'; // Restock (New Supplier)
  newSupplierName: string;
  newCostPrice?: number; // Cost price for this batch, can update product's currentCostPrice
  newSellingPrice?: number; // Selling price for this batch, can update product's currentSellingPrice
}

export type ResolutionData = Condition1Data | Condition2Data | Condition3Data;
