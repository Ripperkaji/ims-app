
import { NextRequest, NextResponse } from 'next/server';
import { mockProducts, mockLogEntries, mockSales } from '@/lib/data';
import { calculateCurrentStock } from '@/lib/productUtils';
import type { Product, LogEntry } from '@/types';
import { formatISO, parseISO } from 'date-fns';

interface DamagedProductInfo {
  id: string;
  name: string;
  category: string;
  damagedQuantity: number;
  sellableStock: number;
  dateOfDamageLogged?: string; // ISO string
  lastAcquisitionDate?: string; // ISO string
}

export async function GET(request: NextRequest) {
  try {
    const damagedProductList: DamagedProductInfo[] = mockProducts
      .filter(p => p.damagedQuantity > 0)
      .map(product => {
        const relevantLogs = mockLogEntries
          .filter(
            log =>
              log.action === "Product Damage & Stock Update (Exchange)" &&
              log.details.includes(product.name) 
          )
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        
        const sellableStock = calculateCurrentStock(product, mockSales);
        const lastAcquisition = product.acquisitionHistory.length > 0 
            ? product.acquisitionHistory.reduce((latest, batch) => new Date(batch.date) > new Date(latest.date) ? batch : latest)
            : null;

        return {
          id: product.id,
          name: product.name,
          category: product.category,
          damagedQuantity: product.damagedQuantity,
          sellableStock: sellableStock,
          dateOfDamageLogged: relevantLogs.length > 0 ? relevantLogs[0].timestamp : undefined,
          lastAcquisitionDate: lastAcquisition ? lastAcquisition.date : undefined,
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
        return a.name.localeCompare(b.name);
      });

    return NextResponse.json(damagedProductList, { status: 200 });

  } catch (error) {
    console.error("Error fetching damaged products:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json({ error: "Failed to fetch damaged products", details: errorMessage }, { status: 500 });
  }
}
