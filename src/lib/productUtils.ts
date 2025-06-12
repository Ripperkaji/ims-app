
import type { Product, Sale } from '@/types';

export const calculateCurrentStock = (product: Product | undefined, allSales: Sale[]): number => {
  if (!product || !product.acquisitionHistory) return 0;
  
  const totalAcquired = product.acquisitionHistory.reduce((sum, batch) => {
    // Ensure quantityAdded is a number, default to 0 if not
    const quantity = typeof batch.quantityAdded === 'number' ? batch.quantityAdded : 0;
    return sum + quantity;
  }, 0);
  
  const totalSold = allSales
    .flatMap(sale => sale.items || []) // Ensure sale.items exists
    .filter(item => item && item.productId === product.id) // Ensure item exists
    .reduce((sum, item) => {
      // Ensure item.quantity is a number, default to 0 if not
      const quantity = typeof item.quantity === 'number' ? item.quantity : 0;
      return sum + quantity;
    }, 0);
    
  const damaged = typeof product.damagedQuantity === 'number' ? product.damagedQuantity : 0;
  const testers = typeof product.testerQuantity === 'number' ? product.testerQuantity : 0;
    
  return totalAcquired - totalSold - damaged - testers;
};
