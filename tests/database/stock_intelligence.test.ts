import { db } from '../../configs/sqlite';
import { initProductsTable, insertProduct } from '../../database/products';
import { initSalesTables, insertSale } from '../../database/sales';
import { initCreditsTable } from '../../database/credits';
import { initInventoryTable } from '../../database/inventory';
import { runMigrations } from '../../database/migrations';
import { resetMockDb } from '../__setup__/expo-sqlite-mock';
import {
  initStockIntelligenceTable,
  listReorderRecommendations,
  saveReorderPlan,
  deleteReorderPlan,
} from '../../database/stock-intelligence';

describe('Stock Intelligence Database Operations', () => {
  beforeAll(async () => {
    resetMockDb();
    await initProductsTable();
    await initSalesTables();
    await initCreditsTable();
    await initInventoryTable();
    await initStockIntelligenceTable();
    await runMigrations();
  });

  beforeEach(async () => {
    await db.runAsync('DELETE FROM reorder_plans');
    resetMockDb();
    await db.runAsync('DELETE FROM suppliers');
  });

  test('Proper calculation of reorder suggestions based on 28-day sales (summed in base units)', async () => {
    // Product with conversion factor 12 (1 Case = 12 Bottles)
    const prodId = await insertProduct(
      'Coke 1.5L Case',
      'CK-CASE-1.5L',
      600, // Retail price for 1 Bottle is 60. 1 Case is 600.
      24, // 24 bottles in stock
      40, // Retail cost is 40.
      'Beverages',
      'BARCODE-RETAIL-1',
      null,
      null,
      'Bottle',
      'Case',
      600,
      400,
      12, // conversion factor: 1 Case = 12 Bottles
      'BARCODE-WHOLESALE-1'
    );

    // Sales within 28 days:
    // Sale 1: 1 Case (wholesale) -> should convert to 12 base units (Bottles)
    await insertSale(
      [
        {
          product_id: prodId,
          quantity: 1,
          price: 600,
          selected_unit: 'wholesale',
          sold_unit_name: 'Case',
          sold_unit_qty: 1,
          conversion_factor: 12,
        },
      ],
      'cash'
    );

    // Sale 2: 5 Bottles (retail) -> 5 base units (Bottles)
    await insertSale(
      [
        {
          product_id: prodId,
          quantity: 5,
          price: 60,
          selected_unit: 'retail',
          sold_unit_name: 'Bottle',
          sold_unit_qty: 5,
          conversion_factor: null,
        },
      ],
      'cash'
    );

    // Total 28-day sales in base units = 12 + 5 = 17 Bottles
    // Current stock = 24 - 12 - 5 = 7 Bottles
    // Need attention? yes, because stock is 7 (which is > 0 and < LOW_STOCK_THRESHOLD (5)? Wait, 7 is not < 5.
    // Let's set the stock to 4 (low stock) so it needs attention and shows in recommendations.
    await db.runAsync('UPDATE products SET quantity = 4 WHERE id = ?', [prodId]);

    const recs = await listReorderRecommendations();
    const rec = recs.find((r) => r.productId === prodId);
    expect(rec).toBeDefined();
    expect(rec?.sales28Days).toBe(17);
    expect(rec?.currentStock).toBe(4);

    // suggestedQuantity = max(0, ceil(7 * sales28Days / 28) - currentStock)
    // ceil(7 * 17 / 28) = ceil(119 / 28) = ceil(4.25) = 5
    // suggestedQuantity = max(0, 5 - 4) = 1
    expect(rec?.suggestedQuantity).toBe(1);
    expect(rec?.estimatedSpend).toBe(40); // 1 * retail cost (40) = 40
  });

  test('Tagging slow movers (on-hand quantity > 0, zero sales in 28 days, created >= 7 days ago)', async () => {
    const prodId = await insertProduct(
      'Slow Item',
      'SLOW-001',
      50,
      10, // Stock = 10
      30, // Cost = 30
      'Snacks'
    );

    // Set created_at to 10 days ago (>= 7 days)
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
    await db.runAsync('UPDATE products SET created_at = ? WHERE id = ?', [
      tenDaysAgo.toISOString(),
      prodId,
    ]);

    const recs = await listReorderRecommendations();
    const rec = recs.find((r) => r.productId === prodId);
    expect(rec).toBeDefined();
    expect(rec?.isSlowMover).toBe(true);
    expect(rec?.isWatchItem).toBe(false);
    expect(rec?.sales28Days).toBe(0);
  });

  test('Tagging watch list items (created < 7 days ago)', async () => {
    const prodId = await insertProduct(
      'New Item',
      'NEW-001',
      50,
      10, // Stock = 10
      30, // Cost = 30
      'Snacks'
    );

    // Default created_at is today, which is < 7 days ago
    const recs = await listReorderRecommendations();
    const rec = recs.find((r) => r.productId === prodId);
    expect(rec).toBeDefined();
    expect(rec?.isSlowMover).toBe(false); // Watch items are not slow movers
    expect(rec?.isWatchItem).toBe(true);
  });

  test('Calculations for low-stock and out-of-stock items', async () => {
    // 1. Out of stock item
    const outStockId = await insertProduct('Out Stock', 'OUT-001', 50, 0, 30);
    // 2. Low stock item (quantity 3 < LOW_STOCK_THRESHOLD of 5)
    const lowStockId = await insertProduct('Low Stock', 'LOW-001', 50, 3, 30);
    // 3. Normal stock item (quantity 8 >= 5)
    const normalStockId = await insertProduct('Normal Stock', 'NORM-001', 50, 8, 30);

    // Force normal stock item to not be a watch item so it does not show up in recommendations
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
    await db.runAsync('UPDATE products SET created_at = ? WHERE id = ?', [
      tenDaysAgo.toISOString(),
      normalStockId,
    ]);

    // Record a sale for the normal stock item so it has demand and is not a slow mover
    await insertSale(
      [
        {
          product_id: normalStockId,
          quantity: 2,
          price: 50,
          selected_unit: 'retail',
          sold_unit_name: 'Pc',
          sold_unit_qty: 2,
          conversion_factor: null,
        },
      ],
      'cash'
    );

    const recs = await listReorderRecommendations();

    const outRec = recs.find((r) => r.productId === outStockId);
    expect(outRec).toBeDefined();
    expect(outRec?.isOutOfStock).toBe(true);
    expect(outRec?.isLowStock).toBe(false);

    const lowRec = recs.find((r) => r.productId === lowStockId);
    expect(lowRec).toBeDefined();
    expect(lowRec?.isOutOfStock).toBe(false);
    expect(lowRec?.isLowStock).toBe(true);

    const normalRec = recs.find((r) => r.productId === normalStockId);
    expect(normalRec).toBeUndefined(); // Should not need attention unless it has demand, is slow mover, or watch item
  });

  test('Restoring reorder plans (adjusted, deferred, dismissed) and verifying invalidation when details change', async () => {
    // Insert preferred suppliers before inserting product referencing them (FK constraint)
    await db.runAsync(
      "INSERT INTO suppliers (id, name, created_at) VALUES ('SUPPLIER-123', 'Supplier 123', ?)",
      [Date.now()]
    );
    await db.runAsync(
      "INSERT INTO suppliers (id, name, created_at) VALUES ('SUPPLIER-456', 'Supplier 456', ?)",
      [Date.now()]
    );

    const prodId = await insertProduct(
      'Plan Item',
      'PLAN-001',
      100,
      4, // Low stock, needs attention
      70, // Cost = 70
      'Groceries',
      null,
      'SUPPLIER-123'
    );

    // Force it to be an old product so it's not watch list, just low stock
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
    await db.runAsync('UPDATE products SET created_at = ? WHERE id = ?', [
      tenDaysAgo.toISOString(),
      prodId,
    ]);

    // Sales = 0
    // defaultSuggested = Math.max(0, ceil(0) - 4) = 0

    // Save plan: adjusted quantity to 15
    await saveReorderPlan({
      productId: prodId,
      status: 'adjusted',
      adjustedQuantity: 15,
      lastStock: 4,
      lastDemand: 0,
      lastCost: 70,
      lastSupplierId: 'SUPPLIER-123',
    });

    let recs = await listReorderRecommendations();
    let rec = recs.find((r) => r.productId === prodId);
    expect(rec?.savedPlan).toEqual({
      status: 'adjusted',
      adjustedQuantity: 15,
      deferredUntil: null,
    });
    expect(rec?.suggestedQuantity).toBe(15);
    expect(rec?.estimatedSpend).toBe(15 * 70); // 1050

    // Delete reorder plan (restore)
    await deleteReorderPlan(prodId);
    recs = await listReorderRecommendations();
    rec = recs.find((r) => r.productId === prodId);
    expect(rec?.savedPlan).toBeNull();
    expect(rec?.suggestedQuantity).toBe(0); // goes back to default demand-based reorder suggestion

    // Re-save plan: deferred status
    await saveReorderPlan({
      productId: prodId,
      status: 'deferred',
      deferredUntil: '2026-07-23T18:00:00.000Z',
      lastStock: 4,
      lastDemand: 0,
      lastCost: 70,
      lastSupplierId: 'SUPPLIER-123',
    });

    recs = await listReorderRecommendations();
    rec = recs.find((r) => r.productId === prodId);
    expect(rec?.savedPlan?.status).toBe('deferred');
    expect(rec?.savedPlan?.deferredUntil).toBe('2026-07-23T18:00:00.000Z');

    // Invalidation 1: Stock changes (4 -> 3)
    await db.runAsync('UPDATE products SET quantity = 3 WHERE id = ?', [prodId]);
    recs = await listReorderRecommendations();
    rec = recs.find((r) => r.productId === prodId);
    expect(rec?.savedPlan).toBeNull(); // Stale plan deleted

    // Re-save plan
    await saveReorderPlan({
      productId: prodId,
      status: 'adjusted',
      adjustedQuantity: 20,
      lastStock: 3,
      lastDemand: 0,
      lastCost: 70,
      lastSupplierId: 'SUPPLIER-123',
    });

    // Invalidation 2: Cost changes (70 -> 80)
    await db.runAsync('UPDATE products SET cost_price = 80 WHERE id = ?', [prodId]);
    recs = await listReorderRecommendations();
    rec = recs.find((r) => r.productId === prodId);
    expect(rec?.savedPlan).toBeNull(); // Stale plan deleted

    // Re-save plan
    await saveReorderPlan({
      productId: prodId,
      status: 'adjusted',
      adjustedQuantity: 20,
      lastStock: 3,
      lastDemand: 0,
      lastCost: 80,
      lastSupplierId: 'SUPPLIER-123',
    });

    // Invalidation 3: Supplier changes
    await db.runAsync("UPDATE products SET supplier_id = 'SUPPLIER-456' WHERE id = ?", [prodId]);
    recs = await listReorderRecommendations();
    rec = recs.find((r) => r.productId === prodId);
    expect(rec?.savedPlan).toBeNull(); // Stale plan deleted
  });
});
