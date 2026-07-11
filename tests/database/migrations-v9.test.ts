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
    expect(user_version).toBe(9);
  });
});
