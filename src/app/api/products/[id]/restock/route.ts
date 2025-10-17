
import { NextRequest, NextResponse } from 'next/server';
import { mockProducts, addLogEntry } from '@/lib/data';
import type { Product, AcquisitionBatch, AcquisitionPaymentMethod } from '@/types';
import { z } from 'zod';

const restockSchema = z.object({
  quantityAdded: z.number().positive("Quantity to add must be positive."),
  condition: z.enum(['condition1', 'condition2', 'condition3']), // 'Product Added' is not for restock
  newCostPrice: z.number().positive("New cost price must be positive.").optional(),
  newSellingPrice: z.number().positive("New selling price must be positive.").optional(),
  newSupplierName: z.string().min(1, "Supplier name is required for new supplier condition.").optional(),
  paymentDetails: z.object({
    method: z.custom<AcquisitionPaymentMethod>((val) => ['Cash', 'Digital', 'Due', 'Hybrid'].includes(val as string)),
    cashPaid: z.number().min(0),
    digitalPaid: z.number().min(0),
    dueAmount: z.number().min(0),
    totalAcquisitionCost: z.number().min(0),
  }),
}).refine(data => {
    if (data.condition === 'condition2') {
        return data.newCostPrice !== undefined && data.newSellingPrice !== undefined;
    }
    return true;
}, { message: "New cost and selling prices are required for condition2 (Restock with new price).", path: ["newCostPrice"] })
.refine(data => {
    if (data.condition === 'condition3') {
        return data.newSupplierName !== undefined;
    }
    return true;
}, { message: "New supplier name is required for condition3 (Restock with new supplier).", path: ["newSupplierName"] })
.refine(data => {
    if ((data.condition === 'condition2' || data.condition === 'condition3') && data.newCostPrice !== undefined && data.newSellingPrice !== undefined) {
        return data.newCostPrice <= data.newSellingPrice;
    }
    return true;
}, { message: "New cost price cannot be greater than new selling price.", path: ["newCostPrice"] });


export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: productId } = await params;
  const productIndex = mockProducts.findIndex(p => p.id === productId);

  if (productIndex === -1) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const validation = restockSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: "Invalid input", details: validation.error.flatten().fieldErrors }, { status: 400 });
    }
    
    const restockData = validation.data;
    const productToUpdate = mockProducts[productIndex];
    
    if (restockData.quantityAdded > 0 && restockData.paymentDetails.totalAcquisitionCost <= 0 && ( (restockData.newCostPrice && restockData.newCostPrice > 0) || productToUpdate.currentCostPrice > 0 )  ) {
      return NextResponse.json({ error: "Total acquisition cost must be positive if stock is being added and cost price is positive." }, { status: 400 });
    }

    let batchCostPricePerUnit = productToUpdate.currentCostPrice;
    let batchSellingPriceAtAcquisition = productToUpdate.currentSellingPrice;
    let logAction = "Product Restocked";
    let logDetails = `Product '${productToUpdate.name}' (ID: ${productId}) restocked via API. Qty Added: ${restockData.quantityAdded}.`;

    if (restockData.condition === 'condition1') {
      logAction = "Restock (Same Supplier/Price)";
      logDetails += ` Using existing cost: NRP ${batchCostPricePerUnit.toFixed(2)}.`;
    } else if (restockData.condition === 'condition2') {
      logAction = "Restock (Same Supplier, New Price)";
      batchCostPricePerUnit = restockData.newCostPrice!;
      batchSellingPriceAtAcquisition = restockData.newSellingPrice!;
      productToUpdate.currentCostPrice = restockData.newCostPrice!;
      productToUpdate.currentSellingPrice = restockData.newSellingPrice!;
      logDetails += ` Prices updated - New Current Cost: NRP ${restockData.newCostPrice!.toFixed(2)}, New Current MRP: NRP ${restockData.newSellingPrice!.toFixed(2)}.`;
    } else if (restockData.condition === 'condition3') {
      logAction = "Restock (New Supplier)";
      logDetails += ` New Supplier: ${restockData.newSupplierName}.`;
      if (restockData.newCostPrice !== undefined && restockData.newSellingPrice !== undefined) {
        batchCostPricePerUnit = restockData.newCostPrice;
        batchSellingPriceAtAcquisition = restockData.newSellingPrice;
        productToUpdate.currentCostPrice = restockData.newCostPrice;
        productToUpdate.currentSellingPrice = restockData.newSellingPrice;
        logDetails += ` Prices updated - New Current Cost: NRP ${restockData.newCostPrice.toFixed(2)}, New Current MRP: NRP ${restockData.newSellingPrice.toFixed(2)}.`;
      } else {
         logDetails += ` Main product prices remain unchanged.`;
      }
    }
     logDetails += ` Batch Cost/Unit: NRP ${batchCostPricePerUnit.toFixed(2)}.`;


    const newBatch: AcquisitionBatch = {
      batchId: `batch-${productId}-${Date.now()}`,
      date: new Date().toISOString(),
      condition: logAction, // Use the derived logAction as condition
      quantityAdded: restockData.quantityAdded,
      costPricePerUnit: batchCostPricePerUnit,
      sellingPricePerUnitAtAcquisition: batchSellingPriceAtAcquisition,
      supplierName: restockData.condition === 'condition3' 
        ? restockData.newSupplierName 
        : (productToUpdate.acquisitionHistory.length > 0 ? productToUpdate.acquisitionHistory[productToUpdate.acquisitionHistory.length -1].supplierName : undefined),
      paymentMethod: restockData.paymentDetails.method,
      totalBatchCost: restockData.paymentDetails.totalAcquisitionCost,
      cashPaid: restockData.paymentDetails.cashPaid,
      digitalPaid: restockData.paymentDetails.digitalPaid,
      dueToSupplier: restockData.paymentDetails.dueAmount,
    };
    
    if (newBatch.totalBatchCost > 0) {
        logDetails += ` Batch Total Cost: NRP ${newBatch.totalBatchCost.toFixed(2)} via ${newBatch.paymentMethod}.`;
        if (newBatch.paymentMethod === 'Hybrid') {
            logDetails += ` (Cash: ${newBatch.cashPaid.toFixed(2)}, Digital: ${newBatch.digitalPaid.toFixed(2)}, Due: ${newBatch.dueToSupplier.toFixed(2)})`;
        } else if (newBatch.paymentMethod === 'Due') {
             logDetails += ` (Due: ${newBatch.dueToSupplier.toFixed(2)})`;
        }
    }

    productToUpdate.acquisitionHistory.push(newBatch);
    mockProducts[productIndex] = productToUpdate;

    addLogEntry("API System", logAction, logDetails);

    return NextResponse.json(productToUpdate, { status: 200 });

  } catch (e) {
    console.error(`Error in POST /api/products/${productId}/restock:`, e);
    const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred.";
    return NextResponse.json({ error: "Failed to restock product.", details: errorMessage }, { status: 500 });
  }
}

