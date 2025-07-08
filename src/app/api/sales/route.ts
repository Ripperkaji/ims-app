
import { NextRequest, NextResponse } from 'next/server';
import { mockSales, mockProducts, addLogEntry } from '@/lib/data';
import { calculateCurrentStock } from '@/lib/productUtils';
import type { Sale, SaleItem, Product } from '@/types';
import { z } from 'zod';
import { format, startOfDay, endOfDay, isValid, parseISO } from 'date-fns';

const saleItemSchema = z.object({
  productId: z.string().min(1, "Product ID is required."),
  quantity: z.number().int().min(1, "Quantity must be at least 1."),
  // unitPrice and productName will be derived or validated server-side
});

const createSaleSchema = z.object({
  customerName: z.string().min(1, "Customer name is required."),
  customerContact: z.string().optional(),
  items: z.array(saleItemSchema).min(1, "At least one item is required in a sale."),
  formPaymentMethod: z.enum(['Cash', 'Digital', 'Due', 'Hybrid']),
  cashPaid: z.number().min(0).optional(),
  digitalPaid: z.number().min(0).optional(),
  // amountDue will be calculated
  saleOrigin: z.enum(['store', 'online']),
  createdBy: z.string().min(1, "Creator name is required."), // Assuming creator comes from authenticated user on client
});


export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  let filteredSales = [...mockSales];

  const dateParam = searchParams.get('date');
  const monthYearParam = searchParams.get('monthYear');
  const statusParam = searchParams.get('status') as Sale['status'] | 'flagged' | 'resolvedFlagged' | null;
  const commentTextParam = searchParams.get('flaggedCommentText');

  if (dateParam) {
    try {
      const filterDate = startOfDay(parseISO(dateParam));
      if (isValid(filterDate)) {
        filteredSales = filteredSales.filter(sale => {
          const saleDate = startOfDay(parseISO(sale.date));
          return isValid(saleDate) && saleDate.getTime() === filterDate.getTime();
        });
      }
    } catch (e) { /* Ignore invalid date format */ }
  } else if (monthYearParam) {
    // Expects YYYY-MM format
    filteredSales = filteredSales.filter(sale => format(parseISO(sale.date), 'yyyy-MM') === monthYearParam);
  }

  if (statusParam) {
    if (statusParam === 'flagged') {
      filteredSales = filteredSales.filter(sale => sale.isFlagged === true);
    } else if (statusParam === 'resolvedFlagged') {
      filteredSales = filteredSales.filter(sale => sale.isFlagged === false && sale.flaggedComment && sale.flaggedComment.length > 0);
    } else if (['Paid', 'Due'].includes(statusParam)) {
      filteredSales = filteredSales.filter(sale => sale.status === statusParam);
    }
  }

  if (commentTextParam && (statusParam === 'flagged' || statusParam === 'resolvedFlagged')) {
    filteredSales = filteredSales.filter(sale =>
      sale.flaggedComment?.toLowerCase().includes(commentTextParam.toLowerCase())
    );
  }

  filteredSales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return NextResponse.json(filteredSales);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = createSaleSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: "Invalid input", details: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { customerName, customerContact, items: inputItems, formPaymentMethod, cashPaid = 0, digitalPaid = 0, saleOrigin, createdBy } = validation.data;

    const processedSaleItems: SaleItem[] = [];
    let totalAmount = 0;

    for (const item of inputItems) {
      const product = mockProducts.find(p => p.id === item.productId);
      if (!product) {
        return NextResponse.json({ error: `Product with ID ${item.productId} not found.` }, { status: 400 });
      }
      const currentStock = calculateCurrentStock(product, mockSales);
      if (currentStock < item.quantity) {
        return NextResponse.json({ error: `Not enough stock for ${product.name}. Available: ${currentStock}, Requested: ${item.quantity}` }, { status: 400 });
      }
      processedSaleItems.push({
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: product.currentSellingPrice,
        totalPrice: item.quantity * product.currentSellingPrice,
      });
      totalAmount += item.quantity * product.currentSellingPrice;
    }

    let actualCashPaid = cashPaid;
    let actualDigitalPaid = digitalPaid;
    let amountDue = 0;

    if (formPaymentMethod === 'Cash') {
      actualCashPaid = totalAmount;
      actualDigitalPaid = 0;
    } else if (formPaymentMethod === 'Digital') {
      actualDigitalPaid = totalAmount;
      actualCashPaid = 0;
    } else if (formPaymentMethod === 'Due') {
      amountDue = totalAmount;
      actualCashPaid = 0;
      actualDigitalPaid = 0;
    } else if (formPaymentMethod === 'Hybrid') {
      // For hybrid, cashPaid and digitalPaid are directly from input.
      // Ensure they are numbers, default to 0 if not provided/undefined in Zod schema
      actualCashPaid = validation.data.cashPaid ?? 0;
      actualDigitalPaid = validation.data.digitalPaid ?? 0;
      amountDue = totalAmount - actualCashPaid - actualDigitalPaid;
      if (amountDue < 0) {
        // This case should ideally be caught by frontend validation too,
        // but as a safeguard, if overpaid, consider it fully paid with no due.
        // Or return error: return NextResponse.json({ error: "Overpayment in hybrid method not allowed. Total paid exceeds total amount." }, { status: 400 });
        amountDue = 0; // Simple handling: no negative due.
      }
    }
    
    const status: Sale['status'] = amountDue > 0.001 ? 'Due' : 'Paid';

    const newSale: Sale = {
      id: `${Date.now()}${String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')}`,
      customerName,
      customerContact: customerContact?.trim() || undefined,
      items: processedSaleItems,
      totalAmount,
      cashPaid: actualCashPaid,
      digitalPaid: actualDigitalPaid,
      amountDue,
      formPaymentMethod,
      date: new Date().toISOString(),
      status,
      createdBy,
      saleOrigin,
      isFlagged: false,
      flaggedComment: '',
    };

    mockSales.unshift(newSale);
    
    const contactInfoLog = newSale.customerContact ? ` (${newSale.customerContact})` : '';
    let paymentLogDetails = '';
     if (newSale.formPaymentMethod === 'Hybrid') {
        const parts = [];
        if (newSale.cashPaid > 0) parts.push(`NRP ${newSale.cashPaid.toFixed(2)} by cash`);
        if (newSale.digitalPaid > 0) parts.push(`NRP ${newSale.digitalPaid.toFixed(2)} by digital`);
        if (newSale.amountDue > 0) parts.push(`NRP ${newSale.amountDue.toFixed(2)} due`);
        paymentLogDetails = `Payment: ${parts.join(', ')}.`;
    } else {
        paymentLogDetails = `Payment: ${newSale.formPaymentMethod}.`;
    }
    const logDetails = `Sale ID ${newSale.id.substring(0,8)}... for ${newSale.customerName}${contactInfoLog}, Total: NRP ${newSale.totalAmount.toFixed(2)}. ${paymentLogDetails} Status: ${newSale.status}. Origin: ${newSale.saleOrigin}. Items: ${newSale.items.map(i => `${i.productName} (x${i.quantity})`).join(', ')}`;
    addLogEntry(createdBy, "Sale Created via API", logDetails);

    return NextResponse.json(newSale, { status: 201 });

  } catch (e) {
    console.error("Error in POST /api/sales:", e);
    const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred.";
    return NextResponse.json({ error: "Failed to create sale.", details: errorMessage }, { status: 500 });
  }
}
