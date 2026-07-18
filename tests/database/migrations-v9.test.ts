import { db } from '../../configs/sqlite';
import { runMigrations } from '../../database/migrations';
import { resetMockDb } from '../__setup__/expo-sqlite-mock';

describe('Database Migration v9 (Tingi vs Pakyaw)', () => {
  beforeAll(async () => {
    resetMockDb();
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        sku TEXT UNIQUE NOT NULL,
        price INTEGER NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS sale_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        price INTEGER NOT NULL
      );
      PRAGMA user_version = 8;
    `);
  });

  test('runs migration v9 and adds wholesale columns to products and sale_items', async () => {
    await runMigrations();

    const productCols = await db.getAllAsync<{ name: string }>('PRAGMA table_info(products)');
    const productColNames = productCols.map((c) => c.name);
    expect(productColNames).toContain('retail_unit_name');
    expect(productColNames).toContain('wholesale_unit_name');
    expect(productColNames).toContain('wholesale_price');
    expect(productColNames).toContain('wholesale_cost_price');
    expect(productColNames).toContain('conversion_factor');
    expect(productColNames).toContain('wholesale_barcode');

    const saleItemCols = await db.getAllAsync<{ name: string }>('PRAGMA table_info(sale_items)');
    const saleItemColNames = saleItemCols.map((c) => c.name);
    expect(saleItemColNames).toContain('sold_unit_name');
    expect(saleItemColNames).toContain('sold_unit_qty');
    expect(saleItemColNames).toContain('conversion_factor');
    expect(saleItemColNames).toContain('cost_price');

    const [{ user_version }] = await db.getAllAsync<{ user_version: number }>('PRAGMA user_version');
    expect(user_version).toBe(11);

    const tables = await db.getAllAsync<{ name: string }>("SELECT name FROM sqlite_master WHERE type='table'");
    const tableNames = tables.map(t => t.name);
    expect(tableNames).toContain('cash_sessions');
    expect(tableNames).toContain('cash_entries');
    expect(tableNames).toContain('reorder_plans');
    expect(tableNames).toContain('product_catalog');
  });

  test('runs migration from v10 to v11 and preserves product and sale data', async () => {
    resetMockDb();
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        sku TEXT UNIQUE NOT NULL,
        price INTEGER NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 0,
        retail_unit_name TEXT NOT NULL DEFAULT 'Pc'
      );
      CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        total INTEGER NOT NULL,
        payment_type TEXT NOT NULL DEFAULT 'cash',
        customer_name TEXT,
        customer_credit_id INTEGER,
        timestamp TEXT DEFAULT CURRENT_TIMESTAMP
      );
      PRAGMA user_version = 10;
    `);

    await db.runAsync(
      "INSERT INTO products (id, name, sku, price, quantity) VALUES (1, 'Preserved product', 'SKU-PRESERVED', 100, 5);"
    );
    await db.runAsync(
      "INSERT INTO sales (id, total, payment_type) VALUES (1, 1250, 'cash');"
    );

    await runMigrations();

    await expect(
      db.getFirstAsync('SELECT name FROM products WHERE id = 1'),
    ).resolves.toMatchObject({ name: 'Preserved product' });

    await expect(
      db.getFirstAsync('SELECT total FROM sales WHERE id = 1'),
    ).resolves.toMatchObject({ total: 1250 });

    const tables = await db.getAllAsync<{ name: string }>("SELECT name FROM sqlite_master WHERE type='table'");
    const tableNames = tables.map(t => t.name);
    expect(tableNames).toContain('product_catalog');

    const [{ user_version }] = await db.getAllAsync<{ user_version: number }>('PRAGMA user_version');
    expect(user_version).toBe(11);
  });
});
