import {
  initCategoriesTable,
  initCreditsTable,
  initInventoryTable,
  initProductsTable,
  initSalesTables,
  initSuppliersTable,
  initCashTables,
  runMigrations,
} from '../database';
import { getCorrectionsReport } from '../database/corrections';
import { voidSale, correctSalePrice } from '../database/sales';
import { db } from '../configs/sqlite';
import { resetMockDb } from './__setup__/expo-sqlite-mock';

describe('sale_corrections sale_total snapshot', () => {
  beforeEach(async () => {
    await db.execAsync('PRAGMA foreign_keys = OFF;');
    resetMockDb();
    try {
      await db.execAsync('DELETE FROM cash_entries;');
      await db.execAsync('DELETE FROM cash_sessions;');
      await db.execAsync('DELETE FROM sale_correction_lines;');
      await db.execAsync('DELETE FROM sale_corrections;');
    } catch {}
    await db.execAsync('PRAGMA foreign_keys = ON;');
    await db.execAsync('PRAGMA user_version = 0;');
    await initProductsTable();
    await initCreditsTable();
    await initInventoryTable();
    await initSalesTables();
    await initCategoriesTable();
    await initSuppliersTable();
    await initCashTables();
    await runMigrations();
  });

  it('snapshots sale_total when sale is voided or price corrected', async () => {
    const today = new Date().toISOString().slice(0, 10);
    const sessionOpening = `${today}T10:00:00+08:00`;

    await db.runAsync(
      `INSERT INTO cash_sessions (id, business_date, opening_cash, status, opening_timestamp, created_at, updated_at)
       VALUES ('session-snapshot', ?, 1000, 'open', ?, 1000, 1000)`,
      [today, sessionOpening],
    );

    const productResult = await db.runAsync(
      `INSERT INTO products (name, price, quantity, sku) VALUES ('Juice', 25, 10, 'SKU-JUICE')`,
    );
    const productId = Number(productResult.lastInsertRowId);

    // Create cash sale at 10:30:00 (total = 50)
    const saleTimestamp = `${today}T10:30:00+08:00`;
    const saleResult = await db.runAsync(
      `INSERT INTO sales (total, payment_type, timestamp)
       VALUES (50, 'cash', ?)`,
      [saleTimestamp],
    );
    const saleId = Number(saleResult.lastInsertRowId);

    const itemResult = await db.runAsync(
      `INSERT INTO sale_items (sale_id, product_id, quantity, price)
       VALUES (?, ?, 2, 25)`,
      [saleId, productId],
    );
    const saleItemId = Number(itemResult.lastInsertRowId);

    // Price correction: original total was 50, now price changes from 25 -> 30 (new total = 60)
    await correctSalePrice(saleId, {
      actorUser: 'owner-test',
      witnessUser: null,
      reasonCode: 'misprinted_price',
      priceChanges: [{ saleItemId, newPrice: 30 }],
    });

    const report = await getCorrectionsReport({ limit: 10 });
    expect(report.items).toHaveLength(1);
    // Verified: stored snapshot reflects sale total at correction time (50)
    expect(report.items[0]?.saleTotalAtCorrection).toBe(50);
  });
});
