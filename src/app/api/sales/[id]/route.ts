
import { NextRequest, NextResponse } from 'next/server';
import { mockSales, mockProducts, addLogEntry } from '@/lib/data';
import { calculateCurrentStock } from '@/lib/productUtils';
import type { Sale, SaleItem, Product } from '@/types';
import { z } from 'zod';
import { format } from 'date-fns';

const saleItemUpdateSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(0), // Allow 0 for item removal or if stock forces it
  // unitPrice, productName will be derived
  isFlaggedForDamageExchange: z.boolean().optional(),
  damageExchangeComment: z.string().optional(),
});

const updateSaleSchema = z.object({
  customerName: z.string().min(1, "Customer name is required."),
  customerContact: z.string().optional(),
  items: z.array(saleItemUpdateSchema), // Can be empty if all items removed, though UI might prevent total 0
  formPaymentMethod: z.enum(['Cash', 'Digital', 'Due', 'Hybrid']),
  cashPaid: z.number().min(0).optional(),
  digitalPaid: z.number().min(0).optional(),
  // amountDue will be calculated
  adjustmentComment: z.string().min(1, "Adjustment comment is required."),
  isInitiallyFlagged: z.boolean(), // To know if we are resolving a flag
  actorName: z.string().min(1, "Actor name is required.")
});


export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const saleId = params.id;
  const sale = mockSales.find(s => s.id === saleId);

  if (!sale) {
    return NextResponse.json({ error: "Sale not found" }, { status: 404 });
  }
  return NextResponse.json(sale);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const saleId = params.id;
  const saleIndex = mockSales.findIndex(s => s.id === saleId);

  if (saleIndex === -1) {
    return NextResponse.json({ error: "Sale not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const validation = updateSaleSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: "Invalid input", details: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const updates = validation.data;
    const originalSale = mockSales[saleIndex];

    // Simulate stock check for adjustments (this is complex with mock data)
    // Create a temporary list of sales *excluding* the original items of the sale being adjusted
    const otherSales = mockSales.filter(s => s.id !== saleId);
    
    const processedSaleItems: SaleItem[] = [];
    let newTotalAmount = 0;

    for (const updatedItem of updates.items) {
      const product = mockProducts.find(p => p.id === updatedItem.productId);
      if (!product) {
        return NextResponse.json({ error: `Product ID ${updatedItem.productId} not found.` }, { status: 400 });
      }

      const originalItemInThisSale = originalSale.items.find(oi => oi.productId === updatedItem.productId);
      const originalQuantityInThisSale = originalItemInThisSale ? originalItemInThisSale.quantity : 0;
      
      // Stock available *before* this sale's original items were "sold" + stock considering other sales
      const stockConsideringOtherSales = calculateCurrentStock(product, otherSales);
      const effectivelyAvailableForAdjustment = stockConsideringOtherSales + originalQuantityInThisSale;

      if (updatedItem.quantity > effectivelyAvailableForAdjustment) {
        return NextResponse.json({ error: `Not enough stock for ${product.name} to make adjustment. Only ${effectivelyAvailableForAdjustment} available.` }, { status: 400 });
      }
      if (updatedItem.quantity > 0) {
        processedSaleItems.push({
          productId: product.id,
          productName: product.name,
          quantity: updatedItem.quantity,
          unitPrice: product.currentSellingPrice,
          totalPrice: updatedItem.quantity * product.currentSellingPrice,
          isFlaggedForDamageExchange: updatedItem.isFlaggedForDamageExchange,
          damageExchangeComment: updatedItem.damageExchangeComment
        });
        newTotalAmount += updatedItem.quantity * product.currentSellingPrice;
      }
    }
    
    if (processedSaleItems.length === 0 && newTotalAmount > 0) {
         return NextResponse.json({ error: "Sale must have items if total amount is positive." }, { status: 400 });
    }
    if (processedSaleItems.length > 0 && newTotalAmount <= 0) {
        return NextResponse.json({ error: "Total amount must be positive if items are present." }, { status: 400 });
    }


    let actualCashPaid = updates.cashPaid ?? 0;
    let actualDigitalPaid = updates.digitalPaid ?? 0;
    let newAmountDue = 0;

    if (updates.formPaymentMethod === 'Cash') {
      actualCashPaid = newTotalAmount; actualDigitalPaid = 0;
    } else if (updates.formPaymentMethod === 'Digital') {
      actualDigitalPaid = newTotalAmount; actualCashPaid = 0;
    } else if (updates.formPaymentMethod === 'Due') {
      newAmountDue = newTotalAmount; actualCashPaid = 0; actualDigitalPaid = 0;
    } else if (updates.formPaymentMethod === 'Hybrid') {
      newAmountDue = newTotalAmount - actualCashPaid - actualDigitalPaid;
       if (newAmountDue < -0.001) { // Allow for tiny float inaccuracies
           return NextResponse.json({ error: "Hybrid payment overpaid. Total paid exceeds new total amount." }, { status: 400 });
       }
       if (newAmountDue < 0) newAmountDue = 0; // Correct if very slightly negative due to float
    }
    
    const newStatus: Sale['status'] = newAmountDue > 0.001 ? 'Due' : 'Paid';
    let finalFlaggedComment = originalSale.flaggedComment || "";
    if (updates.isInitiallyFlagged) {
        finalFlaggedComment = `Original Flag: ${originalSale.flaggedComment || 'N/A'}\nResolved by ${updates.actorName} on ${format(new Date(), 'MMM dd, yyyy HH:mm')}: ${updates.adjustmentComment}`;
    } else if (updates.adjustmentComment.trim()) {
        finalFlaggedComment = (finalFlaggedComment ? finalFlaggedComment + "\n" : "") + 
                              `Adjusted by ${updates.actorName} on ${format(new Date(), 'MMM dd, yyyy HH:mm')}: ${updates.adjustmentComment}`;
    }

    const updatedSale: Sale = {
      ...originalSale,
      customerName: updates.customerName,
      customerContact: updates.customerContact?.trim() || undefined,
      items: processedSaleItems,
      totalAmount: newTotalAmount,
      cashPaid: actualCashPaid,
      digitalPaid: actualDigitalPaid,
      amountDue: newAmountDue,
      formPaymentMethod: updates.formPaymentMethod,
      status: newStatus,
      isFlagged: updates.isInitiallyFlagged ? false : originalSale.isFlagged, // Resolve flag if it was initially flagged
      flaggedComment: finalFlaggedComment,
      // date and createdBy remain from original sale
    };

    mockSales[saleIndex] = updatedSale;
    
    const logAction = updates.isInitiallyFlagged ? "Sale Flag Resolved & Adjusted via API" : "Sale Adjusted via API";
    addLogEntry(updates.actorName, logAction, `Sale ID ${saleId.substring(0,8)}... updated. New Total: NRP ${updatedSale.totalAmount.toFixed(2)}. Comment: ${updates.adjustmentComment}`);

    return NextResponse.json(updatedSale);

  } catch (e) {
    console.error(`Error in PUT /api/sales/${saleId}:`, e);
    const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred.";
    return NextResponse.json({ error: "Failed to update sale.", details: errorMessage }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const saleId = params.id;
  const saleIndex = mockSales.findIndex(s => s.id === saleId);

  if (saleIndex === -1) {
    return NextResponse.json({ error: "Sale not found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const reason = searchParams.get('reason');
  const deletedBy = searchParams.get('deletedBy') || "API System";

  if (!reason || reason.trim() === "") {
    return NextResponse.json({ error: "Reason for deletion is required." }, { status: 400 });
  }

  const deletedSale = mockSales.splice(saleIndex, 1)[0];
  
  addLogEntry(deletedBy, "Sale Deleted via API", `Sale ID ${deletedSale.id.substring(0,8)}... (Customer: ${deletedSale.customerName}, Amount: NRP ${deletedSale.totalAmount.toFixed(2)}) deleted. Reason: ${reason}`);
  
  return NextResponse.json({ message: `Sale ${saleId} deleted successfully.` }, { status: 200 });
}
