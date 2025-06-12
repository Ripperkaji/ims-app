
import { NextRequest, NextResponse } from 'next/server';
import { mockProducts, mockSales } from '@/lib/data';
import { calculateCurrentStock } from '@/lib/productUtils';
import type { Product } from '@/types';

interface TesterProductInfo {
  id: string;
  name: string;
  category: string;
  testerQuantity: number;
  currentStock: number;
}

export async function GET(request: NextRequest) {
  try {
    const testerProducts: TesterProductInfo[] = mockProducts
      .filter(p => (p.testerQuantity || 0) > 0)
      .map(product => {
        const currentStock = calculateCurrentStock(product, mockSales);
        return {
          id: product.id,
          name: product.name,
          category: product.category,
          testerQuantity: product.testerQuantity || 0,
          currentStock: currentStock,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json(testerProducts, { status: 200 });

  } catch (error) {
    console.error("Error fetching tester products:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json({ error: "Failed to fetch tester products", details: errorMessage }, { status: 500 });
  }
}
