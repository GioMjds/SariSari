import { db } from '../configs/sqlite';
import {
  ReorderRecommendation,
  SaveReorderPlanInput,
} from '../types/stock-intelligence.types';
import { LOW_STOCK_THRESHOLD } from '../constants/stocks';

export const initStockIntelligenceTable = async (): Promise<void> => {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS reorder_plans (
      product_id INTEGER PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
      status TEXT NOT NULL CHECK(status IN ('adjusted', 'deferred', 'dismissed')),
      adjusted_quantity INTEGER,
      deferred_until TEXT,
      last_stock INTEGER NOT NULL,
      last_demand INTEGER NOT NULL,
      last_cost INTEGER,
      last_supplier_id TEXT,
      updated_at INTEGER NOT NULL
    );
  `);
};

export const listReorderRecommendations = async (): Promise<
  ReorderRecommendation[]
> => {
  const twentyEightDaysAgo = new Date();
  twentyEightDaysAgo.setDate(twentyEightDaysAgo.getDate() - 28);
  twentyEightDaysAgo.setHours(0, 0, 0, 0);
  const thresholdStr = twentyEightDaysAgo.toISOString();

  // Get sales in the last 28 days grouped by product_id
  const salesRows = await db.getAllAsync<{
    product_id: number;
    total_qty: number;
  }>(
    `SELECT product_id, SUM(quantity) as total_qty
     FROM sale_items si
     JOIN sales s ON si.sale_id = s.id
     WHERE s.timestamp >= ?
     GROUP BY product_id`,
    [thresholdStr],
  );

  const salesMap = new Map<number, number>();
  for (const row of salesRows) {
    salesMap.set(row.product_id, row.total_qty);
  }

  // Get all products along with their preferred supplier name
  const products = await db.getAllAsync<{
    id: number;
    name: string;
    sku: string;
    barcode: string | null;
    quantity: number;
    cost_price: number | null;
    supplier_id: string | null;
    supplier_name: string | null;
    category: string | null;
    created_at: string;
    retail_unit_name: string;
  }>(
    `SELECT
       p.id, p.name, p.sku, p.barcode, p.quantity, p.cost_price, p.supplier_id, p.category, p.created_at, p.retail_unit_name,
       s.name as supplier_name
     FROM products p
     LEFT JOIN suppliers s ON p.supplier_id = s.id`,
  );

  // Get all saved reorder plans
  const planRows = await db.getAllAsync<{
    product_id: number;
    status: 'adjusted' | 'deferred' | 'dismissed';
    adjusted_quantity: number | null;
    deferred_until: string | null;
    last_stock: number;
    last_demand: number;
    last_cost: number | null;
    last_supplier_id: string | null;
  }>('SELECT * FROM reorder_plans');

  const plansMap = new Map<number, (typeof planRows)[0]>();
  for (const row of planRows) {
    plansMap.set(row.product_id, row);
  }

  const recommendations: ReorderRecommendation[] = [];
  const staleProductIds: number[] = [];

  for (const product of products) {
    const sales28Days = salesMap.get(product.id) ?? 0;
    const currentStock = product.quantity;
    const costPrice = product.cost_price;

    // A watch item is created in the last 7 days.
    // Replace space with 'T' and append 'Z' if needed for sqlite datetime compatibility
    let createdAtStr = product.created_at;
    if (createdAtStr.includes(' ') && !createdAtStr.includes('T')) {
      createdAtStr = createdAtStr.replace(' ', 'T') + 'Z';
    }
    const createdAtMs = new Date(createdAtStr).getTime();
    const isWatchItem = Date.now() - createdAtMs < 7 * 24 * 60 * 60 * 1000;
    const isOutOfStock = currentStock === 0;
    const isLowStock = currentStock > 0 && currentStock < LOW_STOCK_THRESHOLD;
    const isSlowMover = currentStock > 0 && sales28Days === 0 && !isWatchItem;

    // Recommendations only include products that need attention:
    // low stock, out of stock, slow mover, or watch list item
    const needsAttention =
      isOutOfStock || isLowStock || isSlowMover || isWatchItem;
    if (!needsAttention) continue;

    // suggestedQuantity = max(0, ceil(7 * 28-day sales / 28) - currentStock)
    const defaultSuggested = Math.max(
      0,
      Math.ceil((7 * sales28Days) / 28) - currentStock,
    );

    const savedPlanRow = plansMap.get(product.id);
    let savedPlan = null;
    let finalSuggested = defaultSuggested;

    if (savedPlanRow) {
      // Invalidation check: if stock, demand, cost, or preferred supplier changed, the plan is stale.
      const isStale =
        savedPlanRow.last_stock !== currentStock ||
        savedPlanRow.last_demand !== sales28Days ||
        savedPlanRow.last_cost !== costPrice ||
        savedPlanRow.last_supplier_id !== product.supplier_id;

      if (isStale) {
        staleProductIds.push(product.id);
      } else {
        savedPlan = {
          status: savedPlanRow.status,
          adjustedQuantity: savedPlanRow.adjusted_quantity,
          deferredUntil: savedPlanRow.deferred_until,
        };

        if (
          savedPlanRow.status === 'adjusted' &&
          savedPlanRow.adjusted_quantity !== null
        ) {
          finalSuggested = savedPlanRow.adjusted_quantity;
        }
      }
    }

    const estimatedSpend =
      costPrice !== null ? finalSuggested * costPrice : null;

    recommendations.push({
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      barcode: product.barcode,
      currentStock,
      sales28Days,
      suggestedQuantity: finalSuggested,
      defaultSuggestedQuantity: defaultSuggested,
      estimatedSpend,
      preferredSupplierId: product.supplier_id,
      preferredSupplierName: product.supplier_name,
      category: product.category,
      retailUnitName: product.retail_unit_name || 'Pc',
      costPrice,
      isOutOfStock,
      isLowStock,
      isSlowMover,
      isWatchItem,
      savedPlan,
    });
  }

  if (staleProductIds.length > 0) {
    try {
      await db.runAsync(
        `DELETE FROM reorder_plans WHERE product_id IN (${staleProductIds.map(() => '?').join(',')})`,
        staleProductIds,
      );
    } catch (err) {
      console.warn('Failed to clean up stale reorder plans', err);
    }
  }

  return recommendations;
};

export const saveReorderPlan = async (
  input: SaveReorderPlanInput,
): Promise<void> => {
  const now = Date.now();
  await db.runAsync(
    `INSERT OR REPLACE INTO reorder_plans (
      product_id, status, adjusted_quantity, deferred_until, last_stock, last_demand, last_cost, last_supplier_id, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.productId,
      input.status,
      input.adjustedQuantity ?? null,
      input.deferredUntil ?? null,
      input.lastStock,
      input.lastDemand,
      input.lastCost ?? null,
      input.lastSupplierId ?? null,
      now,
    ],
  );
};

export const deleteReorderPlan = async (productId: number): Promise<void> => {
  await db.runAsync('DELETE FROM reorder_plans WHERE product_id = ?', [
    productId,
  ]);
};
