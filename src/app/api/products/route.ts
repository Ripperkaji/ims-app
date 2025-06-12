
import { NextRequest, NextResponse } from 'next/server';
import { mockProducts, mockSales, addLogEntry } from '@/lib/data';
import { calculateCurrentStock } from '@/lib/productUtils';
import type { Product, ProductType, AcquisitionBatch, AcquisitionPaymentMethod } from '@/types';
import { z } from 'zod';

const productSchema = z.object({
  name: z.string().min(1, "Product name cannot be empty."),
  category: z.custom<ProductType>((val) => typeof val === 'string' && val.length > 0, "Category is required."),
  sellingPrice: z.number().positive("Selling price must be positive."),
  costPrice: z.number().positive("Cost price must be positive."),
  totalAcquiredStock: z.number().min(0, "Initial stock cannot be negative."),
  supplierName: z.string().optional(),
  acquisitionPaymentDetails: z.object({
    method: z.custom<AcquisitionPaymentMethod>((val) => ['Cash', 'Digital', 'Due', 'Hybrid'].includes(val as string)),
    cashPaid: z.number().min(0),
    digitalPaid: z.number().min(0),
    dueAmount: z.number().min(0),
    totalAcquisitionCost: z.number().min(0),
  }),
}).refine(data => data.costPrice <= data.sellingPrice, {
  message: "Cost price cannot be greater than selling price.",
  path: ["costPrice"],
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') as ProductType | null;

  let products = mockProducts.map(p => ({
    ...p,
    currentStock: calculateCurrentStock(p, mockSales),
  }));

  if (category) {
    products = products.filter(p => p.category === category);
  }

  return NextResponse.json(products);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = productSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: "Invalid input", details: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const newProductData = validation.data;

    const existingProductByName = mockProducts.find(p => p.name.toLowerCase() === newProductData.name.toLowerCase());
    if (existingProductByName) {
      return NextResponse.json({ error: `Product with name "${newProductData.name}" already exists.` }, { status: 409 });
    }
    
    if (newProductData.totalAcquiredStock > 0 && newProductData.acquisitionPaymentDetails.totalAcquisitionCost <= 0 && newProductData.costPrice > 0) {
         return NextResponse.json({ error: "Total acquisition cost must be positive if stock is being added and cost price is positive." }, { status: 400 });
    }


    const newProductId = `prod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const firstBatch: AcquisitionBatch = {
      batchId: `batch-${newProductId}-${Date.now()}`,
      date: new Date().toISOString(),
      condition: "Product Added",
      supplierName: newProductData.supplierName,
      quantityAdded: newProductData.totalAcquiredStock,
      costPricePerUnit: newProductData.costPrice,
      sellingPricePerUnitAtAcquisition: newProductData.sellingPrice,
      paymentMethod: newProductData.acquisitionPaymentDetails.method,
      totalBatchCost: newProductData.acquisitionPaymentDetails.totalAcquisitionCost,
      cashPaid: newProductData.acquisitionPaymentDetails.cashPaid,
      digitalPaid: newProductData.acquisitionPaymentDetails.digitalPaid,
      dueToSupplier: newProductData.acquisitionPaymentDetails.dueAmount,
    };

    const productToAdd: Product = {
      id: newProductId,
      name: newProductData.name,
      category: newProductData.category,
      currentSellingPrice: newProductData.sellingPrice,
      currentCostPrice: newProductData.costPrice,
      acquisitionHistory: [firstBatch],
      damagedQuantity: 0,
      testerQuantity: 0,
    };

    mockProducts.push(productToAdd);
    
    let logDetails = `Product '${productToAdd.name}' added via API. Current Cost: NRP ${productToAdd.currentCostPrice.toFixed(2)}, Current MRP: NRP ${productToAdd.currentSellingPrice.toFixed(2)}. Initial Batch Qty: ${newProductData.totalAcquiredStock}.`;
    if (newProductData.supplierName) logDetails += ` Supplier: ${newProductData.supplierName}.`;
    if (firstBatch.totalBatchCost > 0) {
      logDetails += ` Batch Cost: NRP ${firstBatch.totalBatchCost.toFixed(2)} via ${firstBatch.paymentMethod}.`;
      if (firstBatch.paymentMethod === 'Hybrid') {
        logDetails += ` (Cash: ${firstBatch.cashPaid.toFixed(2)}, Digital: ${firstBatch.digitalPaid.toFixed(2)}, Due: ${firstBatch.dueToSupplier.toFixed(2)})`;
      } else if (firstBatch.paymentMethod === 'Due') {
        logDetails += ` (Due: ${firstBatch.dueToSupplier.toFixed(2)})`;
      }
    }
    addLogEntry("API System", "Product Added", logDetails);

    const productWithStock = {
        ...productToAdd,
        currentStock: calculateCurrentStock(productToAdd, mockSales)
    }

    return NextResponse.json(productWithStock, { status: 201 });

  } catch (e) {
    console.error("Error in POST /api/products:", e);
    const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred.";
    return NextResponse.json({ error: "Failed to create product.", details: errorMessage }, { status: 500 });
  }
}
