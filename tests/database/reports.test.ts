import { db } from '../../configs/sqlite';
import { runMigrations } from '../../database/migrations';
import { resetMockDb } from '../__setup__/expo-sqlite-mock';
import { initProductsTable, insertProduct } from '../../database/products';
import { initSalesTables, insertSale } from '../../database/sales';
import { initCreditsTable } from '../../database/credits';
import { initInventoryTable } from '../../database/inventory';
import { initFinancialEntriesTable, createFinancialEntry } from '../../database/financial';
import { getReportKPIs } from '../../database/reports';
import { Pesos } from '../../lib/money';
import * as Crypto from 'expo-crypto';

describe('Report KPIs with Operating Profit Rules', () => {
  let uuidCounter = 0;

  beforeAll(() => {
    (Crypto.randomUUID as any).mockImplementation(
      () => `financial-uuid-${uuidCounter++}`,
    );
  });

  beforeEach(async () => {
    resetMockDb();
    await initProductsTable();
    await initSalesTables();
    await initCreditsTable();
    await initInventoryTable();
    await initFinancialEntriesTable();
    await runMigrations();
  });

  test('calculates grossProfit and operatingProfit when all sold items have snapshot cost', async () => {
    const prodId = await insertProduct('Chips', 'BAR-1', 50, 10, 30, 'Snacks');
    await insertSale(
      [{ product_id: prodId, quantity: 2, price: 50, cost_price: 30 }],
      'cash',
    );

    const todayStr = new Date().toISOString().split('T')[0];
    await createFinancialEntry({
      type: 'expense',
      amount: 15 as Pesos,
      businessDate: todayStr,
      expenseCategory: 'transport',
      note: 'Store errand',
    });
    await createFinancialEntry({
      type: 'owner_drawing',
      amount: 50 as Pesos,
      businessDate: todayStr,
      expenseCategory: null,
      note: 'Owner cash out',
    });

    const now = new Date();
    const kpis = await getReportKPIs({
      startDate: new Date(now.getTime() - 86400000),
      endDate: new Date(now.getTime() + 86400000),
      label: 'custom',
    });

    expect(kpis.totalSales).toBe(100);
    expect(kpis.paidExpenses).toBe(15);
    expect(kpis.ownerDrawings).toBe(50);
    expect(kpis.grossProfit).toBe(40);
    expect(kpis.operatingProfit).toBe(25);
  });

  test('withholds profit measures when sold unit lacks snapshot cost', async () => {
    const prodId = await insertProduct(
      'Mystery Item',
      'BAR-2',
      50,
      10,
      undefined,
      'Misc',
    );
    await insertSale(
      [{ product_id: prodId, quantity: 1, price: 50 }],
      'cash',
    );

    const now = new Date();
    const kpis = await getReportKPIs({
      startDate: new Date(now.getTime() - 86400000),
      endDate: new Date(now.getTime() + 86400000),
      label: 'custom',
    });

    expect(kpis.totalSales).toBe(50);
    expect(kpis.grossProfit).toBeNull();
    expect(kpis.operatingProfit).toBeNull();
  });

  test('with no sales grossProfit is 0 and operatingProfit is 0 - paidExpenses', async () => {
    const todayStr = new Date().toISOString().split('T')[0];
    await createFinancialEntry({
      type: 'expense',
      amount: 40 as Pesos,
      businessDate: todayStr,
      expenseCategory: 'rent',
      note: 'Stall rent',
    });

    const now = new Date();
    const kpis = await getReportKPIs({
      startDate: new Date(now.getTime() - 86400000),
      endDate: new Date(now.getTime() + 86400000),
      label: 'custom',
    });

    expect(kpis.totalSales).toBe(0);
    expect(kpis.paidExpenses).toBe(40);
    expect(kpis.grossProfit).toBe(0);
    expect(kpis.operatingProfit).toBe(-40);
  });
});
