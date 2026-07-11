import { db } from '../../configs/sqlite';
import { initProductsTable, insertProduct } from '../../database/products';
import { initSalesTables, insertSale } from '../../database/sales';
import { initCreditsTable } from '../../database/credits';
import { initInventoryTable } from '../../database/inventory';
import { getReportKPIs, getSalesOverTime } from '../../database/reports';
import { runMigrations } from '../../database/migrations';
import { resetMockDb } from '../__setup__/expo-sqlite-mock';

describe('Reports KPIs with Wholesale Transactions', () => {
  beforeAll(async () => {
    resetMockDb();
    await initProductsTable();
    await initSalesTables();
    await initCreditsTable();
    await initInventoryTable();
    await runMigrations();
  });

  test('computes accurate revenue, COGS, and profit using snapshot sold_unit_qty and cost_price', async () => {
    const prodId = await insertProduct(
      'Case Item',
      'RPT-CASE-1',
      60, // ₱60 retail price
      24,
      50, // ₱50 retail cost
      'Beverages',
      null,
      null,
      null,
      'Bottle',
      'Case',
      660, // ₱660 wholesale price
      600, // ₱600 wholesale cost
      12
    );

    await insertSale(
      [
        {
          product_id: prodId,
          quantity: 2, // 2 Cases sold
          price: 660,
          selected_unit: 'wholesale',
          sold_unit_name: 'Case',
          sold_unit_qty: 2,
          conversion_factor: 12,
        },
      ],
      'cash'
    );

    const now = new Date();
    const startDate = new Date(now.getTime() - 86400000);
    const endDate = new Date(now.getTime() + 86400000);

    const kpis = await getReportKPIs({ startDate, endDate, label: 'custom' });
    // Revenue = 2 cases * 660 = 1320
    expect(kpis.totalSales).toBe(1320);
    // Profit = 2 cases * (660 - 600) = 120 (not 24 * (660 - 50) = 14640)
    expect(kpis.totalProfit).toBe(120);
  });

  test('keeps snapshot profit in sales trends after a product is deleted', async () => {
    resetMockDb();

    const productId = await insertProduct(
      'Deleted Item',
      'RPT-DELETED-1',
      100,
      10,
      60,
      'Beverages',
    );
    await insertSale(
      [{ product_id: productId, quantity: 2, price: 100 }],
      'cash',
    );
    // Simulate a legacy/manual hard delete. The current schema normally
    // protects this relation with a foreign key, but reports must retain
    // sale-item cost snapshots if an older database contains such a row.
    await db.execAsync('PRAGMA foreign_keys = OFF');
    await db.runAsync('DELETE FROM products WHERE id = ?', [productId]);
    await db.execAsync('PRAGMA foreign_keys = ON');

    const now = new Date();
    const sales = await getSalesOverTime({
      startDate: new Date(now.getTime() - 86400000),
      endDate: new Date(now.getTime() + 86400000),
      label: 'custom',
    });

    expect(sales).toHaveLength(1);
    expect(sales[0].profit).toBe(80);
  });
});
