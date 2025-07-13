
import { NextRequest, NextResponse } from 'next/server';
import { mockProducts, mockLogEntries, mockSales } from '@/lib/data';
import { calculateCurrentStock } from '@/lib/productUtils';
import type { Product, LogEntry } from '@/types';
import { parseISO } from 'date-fns';

interface DamagedProductInfo {
  id: string;
  name: string; // This is the base company name e.g., "IGET"
  modelName?: string;
  flavorName?: string;
  category: string;
  damagedQuantity: number;
  sellableStock: number;
  totalDamageCost: number; // This will now be calculated correctly
  dateOfDamageLogged?: string; // ISO string
}

export async function GET(request: NextRequest) {
  try {
    const damagedProductList: DamagedProductInfo[] = mockProducts
      .filter(p => p.damagedQuantity > 0)
      .map(product => {
        // Correctly construct the full product name for searching in logs.
        // This must be precise to match how logs are created.
        const fullProductNameForLog = `${product.name}${product.modelName ? ` (${product.modelName})` : ''}${product.flavorName ? ` - ${product.flavorName}` : ''}`;
        
        const relevantLogs = mockLogEntries
          .filter(
            log =>
              log.action === "Product Damage & Stock Update (Exchange)" &&
              log.details.includes(fullProductNameForLog) 
          )
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        
        const sellableStock = calculateCurrentStock(product, mockSales);
        
        // **FIX**: Correctly calculate totalDamageCost here.
        const totalDamageCost = product.damagedQuantity * product.currentCostPrice;

        return {
          id: product.id,
          name: product.name,
          modelName: product.modelName,
          flavorName: product.flavorName,
          category: product.category,
          damagedQuantity: product.damagedQuantity,
          sellableStock: sellableStock,
          totalDamageCost: totalDamageCost,
          dateOfDamageLogged: relevantLogs.length > 0 ? relevantLogs[0].timestamp : undefined,
        };
      })
      .sort((a, b) => {
        if (a.dateOfDamageLogged && b.dateOfDamageLogged) {
          const dateComparison = parseISO(b.dateOfDamageLogged).getTime() - parseISO(a.dateOfDamageLogged).getTime();
          if (dateComparison !== 0) return dateComparison;
        } else if (a.dateOfDamageLogged) {
          return -1; 
        } else if (b.dateOfDamageLogged) {
          return 1;  
        }
        // Fallback sorting
        const nameA = `${a.name} ${a.modelName} ${a.flavorName}`;
        const nameB = `${b.name} ${b.modelName} ${b.flavorName}`;
        return nameA.localeCompare(nameB);
      });

    return NextResponse.json(damagedProductList, { status: 200 });

  } catch (error) {
    console.error("Error fetching damaged products:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json({ error: "Failed to fetch damaged products", details: errorMessage }, { status: 500 });
  }
}
