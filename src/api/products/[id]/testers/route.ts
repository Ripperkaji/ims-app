
import { NextRequest, NextResponse } from 'next/server';
import { mockProducts, mockSales, addLogEntry, addSystemExpense } from '@/lib/data';
import { calculateCurrentStock } from '@/lib/productUtils';
import type { Product, Expense } from '@/types';
import { z } from 'zod';

const updateTesterSchema = z.object({
  newTesterQuantity: z.number().min(0, "Sample/Tester quantity cannot be negative."),
  actorName: z.string().min(1, "Actor name is required."),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const productId = params.id;
  const productIndex = mockProducts.findIndex(p => p.id === productId);

  if (productIndex === -1) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const validation = updateTesterSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: "Invalid input", details: validation.error.flatten().fieldErrors }, { status: 400 });
    }
    
    const { newTesterQuantity, actorName } = validation.data;
    const productToUpdate = mockProducts[productIndex];
    const oldTesterQty = productToUpdate.testerQuantity || 0;
    
    const oldStock = calculateCurrentStock(productToUpdate, mockSales);

    if (newTesterQuantity === oldTesterQty) {
        return NextResponse.json({ message: "No change in sample/tester quantity.", product: productToUpdate }, { status: 200 });
    }

    const deltaTesters = newTesterQuantity - oldTesterQty;

    if (deltaTesters > 0) { // Increasing testers
      if (oldStock < deltaTesters) {
        return NextResponse.json({ 
            error: "Insufficient stock to convert to samples/testers.",
            details: `Requested ${deltaTesters} new sample(s), but only ${oldStock} sellable units available. Max new total samples: ${oldTesterQty + oldStock}.`
        }, { status: 400 });
      }
      
      const testerExpense: Omit<Expense, 'id'> = {
        date: new Date().toISOString(),
        description: `Sample/Demo Allocation: ${deltaTesters}x ${productToUpdate.name}`,
        category: "Sample/Demo Allocation",
        amount: deltaTesters * productToUpdate.currentCostPrice,
        recordedBy: actorName, 
      };
      addSystemExpense(testerExpense, actorName);
    }

    productToUpdate.testerQuantity = newTesterQuantity;
    mockProducts[productIndex] = productToUpdate;

    const newStockAfterUpdate = calculateCurrentStock(productToUpdate, mockSales);

    addLogEntry(
        actorName, 
        "Sample/Demo Quantity Updated", 
        `Sample/Demo quantity for '${productToUpdate.name}' (ID: ${productId}) changed from ${oldTesterQty} to ${newTesterQuantity} by ${actorName}. Sellable stock changed from ${oldStock} to ${newStockAfterUpdate}.`
    );
    
    const updatedProductWithStock = {
        ...productToUpdate,
        currentStock: newStockAfterUpdate
    };

    return NextResponse.json(updatedProductWithStock, { status: 200 });

  } catch (e) {
    console.error(`Error in PUT /api/products/${productId}/testers:`, e);
    const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred.";
    return NextResponse.json({ error: "Failed to update tester quantity.", details: errorMessage }, { status: 500 });
  }
}
