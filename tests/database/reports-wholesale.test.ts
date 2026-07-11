import { db } from '../../configs/sqlite';
import { initProductsTable, insertProduct } from '../../database/products';
import { initSalesTables, insertSale } from '../../database/sales';
import { initCreditsTable } from '../../database/credits';
import { initInventoryTable } from '../../database/inventory';
import { getReportKPIs } from '../../database/reports';
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

    const kpis = await getReportKPIs({ startDate, endDate });
    // Revenue = 2 cases * 660 = 1320
    expect(kpis.totalSales).toBe(1320);
    // Profit = 2 cases * (660 - 600) = 120 (not 24 * (660 - 50) = 14640)
    expect(kpis.totalProfit).toBe(120);
  });
});
