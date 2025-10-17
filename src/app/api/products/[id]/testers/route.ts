
import { NextRequest, NextResponse } from 'next/server';
import { mockProducts, mockSales, addLogEntry, addSystemExpense } from '@/lib/data';
import { calculateCurrentStock } from '@/lib/productUtils';
import type { Product, Expense } from '@/types';
import { z } from 'zod';

const updateTesterSchema = z.object({
  newTesterQuantity: z.number().min(0, "Tester quantity cannot be negative."),
});

export async function PUT(
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
    const validation = updateTesterSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: "Invalid input", details: validation.error.flatten().fieldErrors }, { status: 400 });
    }
    
    const { newTesterQuantity } = validation.data;
    const productToUpdate = mockProducts[productIndex];
    const oldTesterQty = productToUpdate.testerQuantity || 0;
    
    // Calculate current stock *before* changing tester quantity to see how many are available to convert
    const oldStock = calculateCurrentStock(productToUpdate, mockSales);

    if (newTesterQuantity === oldTesterQty) {
        return NextResponse.json({ message: "No change in tester quantity.", product: productToUpdate }, { status: 200 });
    }

    const deltaTesters = newTesterQuantity - oldTesterQty;

    if (deltaTesters > 0) { // Increasing testers
      if (oldStock < deltaTesters) {
        return NextResponse.json({ 
            error: "Insufficient stock to convert to testers.",
            details: `Requested ${deltaTesters} new tester(s), but only ${oldStock} sellable units available. Max new total testers: ${oldTesterQty + oldStock}.`
        }, { status: 400 });
      }
      
      const testerExpense: Omit<Expense, 'id'> = {
        date: new Date().toISOString(),
        description: `Tester Allocation: ${deltaTesters}x ${productToUpdate.name}`,
        category: "Tester Allocation",
        amount: deltaTesters * productToUpdate.currentCostPrice,
        recordedBy: "API System", // As this is an API action
      };
      addSystemExpense(testerExpense, "API System");
    }
    // If deltaTesters < 0, we are decreasing testers. Stock will be effectively increased by calculateCurrentStock.

    productToUpdate.testerQuantity = newTesterQuantity;
    mockProducts[productIndex] = productToUpdate;

    // Recalculate stock *after* tester quantity change
    const newStockAfterUpdate = calculateCurrentStock(productToUpdate, mockSales);

    addLogEntry(
        "API System", 
        "Tester Quantity Updated", 
        `Tester quantity for '${productToUpdate.name}' (ID: ${productId}) changed from ${oldTesterQty} to ${newTesterQuantity} by API. Sellable stock changed from ${oldStock} to ${newStockAfterUpdate}.`
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

