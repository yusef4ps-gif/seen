import { Product } from './types';

export interface InventoryOverview {
  totalProducts: number;
  totalUnitsInStock: number;
  totalStockValueUSD: number;
  lowStockItemsCount: number;
  outOfStockItemsCount: number;
  fastMovingCount: number;
  slowMovingCount: number;
}

export function calculateInventoryOverview(products: Product[]): InventoryOverview {
  let totalUnits = 0;
  let totalValue = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;
  let fastMovingCount = 0;
  let slowMovingCount = 0;

  products.forEach((p) => {
    // Total stock considering variants or main stock
    const currentStock = p.variants && p.variants.length > 0
      ? p.variants.reduce((sum, v) => sum + (v.stock || 0), 0)
      : (p.stock || 0);

    totalUnits += currentStock;
    totalValue += (currentStock * p.price);

    if (currentStock === 0) {
      outOfStockCount++;
    } else if (currentStock <= (p.lowStockAlert || 5)) {
      lowStockCount++;
    }

    if (p.salesCount >= 20) {
      fastMovingCount++;
    } else if (p.salesCount < 5 && p.viewsCount > 100) {
      slowMovingCount++;
    }
  });

  return {
    totalProducts: products.length,
    totalUnitsInStock: totalUnits,
    totalStockValueUSD: totalValue,
    lowStockItemsCount: lowStockCount,
    outOfStockItemsCount: outOfStockCount,
    fastMovingCount,
    slowMovingCount,
  };
}
