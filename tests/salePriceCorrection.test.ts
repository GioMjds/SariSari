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
import { getCashSessionSummary } from '../database/cash';
import { correctSalePrice } from '../database/sales';
import { db } from '../configs/sqlite';
import { resetMockDb } from './__setup__/expo-sqlite-mock';

describe('correctSalePrice cash session reconciliation', () => {
  beforeEach(async () => {
    await db.execAsync('PRAGMA user_version = 0;');
    await initProductsTable();
    await initCreditsTable();
    await initInventoryTable();
    await initSalesTables();
    await initCategoriesTable();
    await initSuppliersTable();
    await initCashTables();
    await runMigrations();

    await db.execAsync('PRAGMA foreign_keys = OFF;');
    resetMockDb();
    try {
      await db.execAsync('DELETE FROM cash_entries;');
      await db.execAsync('DELETE FROM cash_sessions;');
      await db.execAsync('DELETE FROM sale_correction_lines;');
      await db.execAsync('DELETE FROM sale_corrections;');
    } catch {}
    await db.execAsync('PRAGMA foreign_keys = ON;');
  });

  it('skips cash entry when correcting a sale created in the current open session', async () => {
    // 1. Open cash session at 10:00:00
    const today = new Date().toISOString().slice(0, 10);
    const sessionOpening = `${today}T10:00:00+08:00`;

    await db.runAsync(
      `INSERT INTO cash_sessions (id, business_date, opening_cash, status, opening_timestamp, created_at, updated_at)
       VALUES ('session-1', ?, 1000, 'open', ?, 1000, 1000)`,
      [today, sessionOpening],
    );

    // 2. Create product
    const productResult = await db.runAsync(
      `INSERT INTO products (name, price, quantity, sku) VALUES ('Coke', 50, 10, 'SKU-COKE')`,
    );
    const productId = Number(productResult.lastInsertRowId);

    // 3. Create cash sale during session at 10:30:00 (total = 100)
    const saleTimestamp = `${today}T10:30:00+08:00`;
    const saleResult = await db.runAsync(
      `INSERT INTO sales (total, payment_type, timestamp)
       VALUES (100, 'cash', ?)`,
      [saleTimestamp],
    );
    const saleId = Number(saleResult.lastInsertRowId);

    const itemResult = await db.runAsync(
      `INSERT INTO sale_items (sale_id, product_id, quantity, price)
       VALUES (?, ?, 2, 50)`,
      [saleId, productId],
    );
    const saleItemId = Number(itemResult.lastInsertRowId);

    // Initial summary: opening 1000 + cashSales 100 = 1100
    let summary = await getCashSessionSummary('session-1');
    expect(summary.expectedCash).toBe(1100);
    expect(summary.cashSales).toBe(100);

    // 4. Correct sale price (price 50 -> 70, delta = +40)
    await correctSalePrice(saleId, {
      actorUser: 'test-user',
      witnessUser: null,
      reasonCode: 'wrong_price',
      priceChanges: [{ saleItemId, newPrice: 70 }],
    });

    // 5. Check cash_entries
    const entries = await db.getAllAsync(
      `SELECT * FROM cash_entries WHERE session_id = 'session-1'`,
    );
    expect(entries).toHaveLength(0);

    // 6. Summary should reflect updated sale (1000 + 140 = 1140)
    summary = await getCashSessionSummary('session-1');
    expect(summary.cashSales).toBe(140);
    expect(summary.ownerAdditions).toBe(0);
    expect(summary.expectedCash).toBe(1140);
  });

  it('records cash entry when correcting a sale predating the current open session', async () => {
    const today = new Date().toISOString().slice(0, 10);
    const saleTimestamp = `${today}T08:30:00+08:00`; // Predates 10:00:00 session
    const sessionOpening = `${today}T10:00:00+08:00`;

    // 1. Create sale BEFORE session opens
    const productResult = await db.runAsync(
      `INSERT INTO products (name, price, quantity, sku) VALUES ('Chips', 30, 10, 'SKU-CHIPS')`,
    );
    const productId = Number(productResult.lastInsertRowId);

    const saleResult = await db.runAsync(
      `INSERT INTO sales (total, payment_type, timestamp)
       VALUES (60, 'cash', ?)`,
      [saleTimestamp],
    );
    const saleId = Number(saleResult.lastInsertRowId);

    const itemResult = await db.runAsync(
      `INSERT INTO sale_items (sale_id, product_id, quantity, price)
       VALUES (?, ?, 2, 30)`,
      [saleId, productId],
    );
    const saleItemId = Number(itemResult.lastInsertRowId);

    // 2. Open cash session at 10:00:00
    await db.runAsync(
      `INSERT INTO cash_sessions (id, business_date, opening_cash, status, opening_timestamp, created_at, updated_at)
       VALUES ('session-2', ?, 500, 'open', ?, 1000, 1000)`,
      [today, sessionOpening],
    );

    // Initial summary: opening 500, cashSales 0 (sale predates session)
    let summary = await getCashSessionSummary('session-2');
    expect(summary.expectedCash).toBe(500);
    expect(summary.cashSales).toBe(0);

    // 3. Correct sale price (price 30 -> 40, delta = +20)
    await correctSalePrice(saleId, {
      actorUser: 'test-user',
      witnessUser: null,
      reasonCode: 'wrong_price',
      priceChanges: [{ saleItemId, newPrice: 40 }],
    });

    // 4. Check cash_entries: should have owner_addition entry of 20
    const entries = await db.getAllAsync<{ type: string; amount: number }>(
      `SELECT type, amount FROM cash_entries WHERE session_id = 'session-2'`,
    );
    expect(entries).toHaveLength(1);
    expect(entries[0]?.type).toBe('owner_addition');
    expect(entries[0]?.amount).toBe(20);

    // 5. Summary should reflect owner_addition (500 + 0 + 20 = 520)
    summary = await getCashSessionSummary('session-2');
    expect(summary.cashSales).toBe(0);
    expect(summary.ownerAdditions).toBe(20);
    expect(summary.expectedCash).toBe(520);
  });
});
