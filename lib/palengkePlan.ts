import type {
  PalengkeRestockFilter,
  PalengkeRestockGroup,
  PalengkeRestockItem,
  PalengkeRestockPlan,
  ReorderRecommendation,
} from '../types/stock-intelligence.types';

const UNASSIGNED_GROUP_KEY = 'unassigned';

/**
 * Pure builder: keeps out-of-stock and low-stock recommendations that are not
 * deferred or dismissed and have a quantity to buy, then groups them by
 * preferred supplier, falling back to category.
 */
export const buildPalengkeRestockPlan = (
  recommendations: ReorderRecommendation[],
  filter: PalengkeRestockFilter = {},
  now: number = Date.now(),
): PalengkeRestockPlan => {
  const items: PalengkeRestockItem[] = [];

  for (const rec of recommendations) {
    if (!rec.isOutOfStock && !rec.isLowStock) continue;
    if (rec.suggestedQuantity <= 0) continue;

    const plan = rec.savedPlan;
    if (plan?.status === 'dismissed') continue;
    if (
      plan?.status === 'deferred' &&
      plan.deferredUntil &&
      new Date(plan.deferredUntil).getTime() > now
    ) {
      continue;
    }

    if (filter.supplierId && rec.preferredSupplierId !== filter.supplierId) {
      continue;
    }
    if (filter.category && rec.category !== filter.category) continue;

    items.push({
      productId: rec.productId,
      productName: rec.productName,
      sku: rec.sku,
      currentStock: rec.currentStock,
      suggestedQuantity: rec.suggestedQuantity,
      retailUnitName: rec.retailUnitName,
      costPrice: rec.costPrice,
      subtotal: rec.estimatedSpend ?? 0,
      isOutOfStock: rec.isOutOfStock,
      supplierId: rec.preferredSupplierId,
      supplierName: rec.preferredSupplierName,
      categoryName: rec.category,
    });
  }

  const groupMap = new Map<string, PalengkeRestockGroup>();
  for (const item of items) {
    const key = item.supplierId
      ? `supplier:${item.supplierId}`
      : item.categoryName
        ? `category:${item.categoryName}`
        : UNASSIGNED_GROUP_KEY;
    const label =
      item.supplierName ?? item.categoryName ?? 'Walang supplier / kategorya';
    let group = groupMap.get(key);
    if (!group) {
      group = { key, label, items: [], subtotal: 0 };
      groupMap.set(key, group);
    }
    group.items.push(item);
    group.subtotal += item.subtotal;
  }

  const groups = [...groupMap.values()]
    .map((g) => ({
      ...g,
      items: [...g.items].sort((a, b) =>
        a.productName.localeCompare(b.productName),
      ),
    }))
    .sort((a, b) => {
      if (a.key === UNASSIGNED_GROUP_KEY) return 1;
      if (b.key === UNASSIGNED_GROUP_KEY) return -1;
      return a.label.localeCompare(b.label);
    });

  let outOfStockCapital = 0;
  let lowStockCapital = 0;
  let outOfStockCount = 0;
  let missingCostCount = 0;
  for (const item of items) {
    if (item.isOutOfStock) {
      outOfStockCapital += item.subtotal;
      outOfStockCount += 1;
    } else {
      lowStockCapital += item.subtotal;
    }
    if (item.costPrice === null) missingCostCount += 1;
  }

  return {
    items,
    groups,
    totalEstimatedCapital: outOfStockCapital + lowStockCapital,
    outOfStockCapital,
    lowStockCapital,
    totalItemsCount: items.length,
    outOfStockCount,
    missingCostCount,
  };
};
