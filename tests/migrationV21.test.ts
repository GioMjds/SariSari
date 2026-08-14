import {
  initCategoriesTable,
  initCreditsTable,
  initInventoryTable,
  initProductsTable,
  initSalesTables,
  initSuppliersTable,
  initCashTables,
  initCorrectionsTable,
  runMigrations,
} from '../database';
import { voidSale, refundSale, correctSalePrice } from '../database/sales';
import { db } from '../configs/sqlite';
import { resetMockDb } from './__setup__/expo-sqlite-mock';

describe('Migration v21 Schema Alignment', () => {
  beforeEach(async () => {
    await db.execAsync('PRAGMA foreign_keys = OFF;');
    resetMockDb();
    await db.execAsync('PRAGMA foreign_keys = ON;');
    await db.execAsync('PRAGMA user_version = 0;');
    await initProductsTable();
    await initCreditsTable();
    await initInventoryTable();
    await initSalesTables();
    await initCategoriesTable();
    await initSuppliersTable();
    await initCashTables();
    await initCorrectionsTable();
    await runMigrations();
  });

  it('ensures sales table has cancelled_at and performs void successfully', async () => {
    const today = new Date().toISOString().slice(0, 10);
    const sessionOpening = `${today}T08:00:00+08:00`;

    await db.runAsync(
      `INSERT INTO cash_sessions (id, business_date, opening_cash, status, opening_timestamp, created_at, updated_at)
       VALUES ('session-v21-void', ?, 1000, 'open', ?, 1000, 1000)`,
      [today, sessionOpening],
    );

    const productResult = await db.runAsync(
      `INSERT INTO products (name, price, quantity, sku) VALUES ('Sardines', 25, 10, 'SKU-SARDINE')`,
    );
    const productId = Number(productResult.lastInsertRowId);

    const saleTimestamp = `${today}T09:00:00+08:00`;
    const saleResult = await db.runAsync(
      `INSERT INTO sales (total, payment_type, timestamp) VALUES (25, 'cash', ?)`,
      [saleTimestamp],
    );
    const saleId = Number(saleResult.lastInsertRowId);

    await db.runAsync(
      `INSERT INTO sale_items (sale_id, product_id, quantity, price) VALUES (?, ?, 1, 25)`,
      [saleId, productId],
    );

    const correctionId = await voidSale(saleId, {
      actorUser: 'owner',
      witnessUser: null,
      reasonCode: 'customer_changed_mind',
      note: 'Void test',
    });

    expect(correctionId).toBeGreaterThan(0);

    const updatedSale = await db.getFirstAsync<{ cancelled_at: string | null; cancelled_by_kind: string | null }>(
      'SELECT cancelled_at, cancelled_by_kind FROM sales WHERE id = ?',
      [saleId],
    );
    expect(updatedSale?.cancelled_at).not.toBeNull();
    expect(updatedSale?.cancelled_by_kind).toBe('void');
  });

  it('ensures refund works and inserts cash_refund entry into cash_entries', async () => {
    const today = new Date().toISOString().slice(0, 10);
    const sessionOpening = `${today}T08:00:00+08:00`;

    await db.runAsync(
      `INSERT INTO cash_sessions (id, business_date, opening_cash, status, opening_timestamp, created_at, updated_at)
       VALUES ('session-v21-refund', ?, 1000, 'open', ?, 1000, 1000)`,
      [today, sessionOpening],
    );

    const productResult = await db.runAsync(
      `INSERT INTO products (name, price, quantity, sku) VALUES ('Noodles', 15, 10, 'SKU-NOODLES')`,
    );
    const productId = Number(productResult.lastInsertRowId);

    const saleTimestamp = `${today}T09:00:00+08:00`;
    const saleResult = await db.runAsync(
      `INSERT INTO sales (total, payment_type, timestamp) VALUES (15, 'cash', ?)`,
      [saleTimestamp],
    );
    const saleId = Number(saleResult.lastInsertRowId);

    await db.runAsync(
      `INSERT INTO sale_items (sale_id, product_id, quantity, price) VALUES (?, ?, 1, 15)`,
      [saleId, productId],
    );

    const correctionId = await refundSale(saleId, {
      actorUser: 'owner',
      witnessUser: null,
      reasonCode: 'returned_damaged',
      note: 'Damaged packaging',
    });

    expect(correctionId).toBeGreaterThan(0);

    const refundEntry = await db.getFirstAsync<{ type: string; amount: number }>(
      `SELECT type, amount FROM cash_entries WHERE session_id = 'session-v21-refund' AND type = 'cash_refund'`,
    );
    expect(refundEntry?.type).toBe('cash_refund');
    expect(refundEntry?.amount).toBe(15);
  });
});
