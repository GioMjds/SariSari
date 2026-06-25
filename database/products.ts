import { Product } from '@/types/products.types';
import { db } from '../configs/sqlite';

export const initProductsTable = async () => {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      sku TEXT UNIQUE NOT NULL,
      price INTEGER NOT NULL,
      cost_price INTEGER,
      quantity INTEGER NOT NULL DEFAULT 0,
      category TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
};

export const insertProduct = async (
  name: string,
  sku: string,
  price: number,
  quantity: number = 0,
  cost_price?: number,
  category?: string,
): Promise<number> => {
  // The products table owns `quantity` as the source of truth, but the
  // inventory_transactions table is the audit log. Every stock change —
  // including initial stock at product creation — must land in both
  // tables inside the same transaction, so the column and the ledger
  // never disagree.
  let productId = 0;
  await db.withTransactionAsync(async () => {
    const result = await db.runAsync(
      'INSERT INTO products (name, sku, price, quantity, cost_price, category) VALUES (?, ?, ?, ?, ?, ?)',
      [name, sku, price, quantity, cost_price ?? null, category ?? null],
    );
    productId = result.lastInsertRowId;

    if (quantity > 0) {
      await db.runAsync(
        'INSERT INTO inventory_transactions (product_id, type, quantity) VALUES (?, ?, ?)',
        [productId, 'restock', quantity],
      );
    }
  });

  return productId;
};

export const updateProduct = async (
  id: number,
  name: string,
  sku: string,
  price: number,
  quantity: number,
  cost_price?: number,
  category?: string,
) => {
  // Same pattern as insert: read the current quantity inside the
  // transaction, compute the delta, write the column update and the
  // inventory movement together. If the caller is changing quantity,
  // the audit log gets a row; if they only changed name/price/etc.,
  // no movement row is written.
  await db.withTransactionAsync(async () => {
    const current = await db.getFirstAsync<{ quantity: number }>(
      'SELECT quantity FROM products WHERE id = ?',
      [id],
    );
    await db.runAsync(
      'UPDATE products SET name = ?, sku = ?, price = ?, quantity = ?, cost_price = ?, category = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, sku, price, quantity, cost_price ?? null, category ?? null, id],
    );
    if (current && current.quantity !== quantity) {
      const delta = quantity - current.quantity;
      await db.runAsync(
        'INSERT INTO inventory_transactions (product_id, type, quantity) VALUES (?, ?, ?)',
        [id, 'restock', delta],
      );
    }
  });
};

export const deleteProduct = async (id: number) => {
  await db.runAsync('DELETE FROM products WHERE id = ?', [id]);
};

export const getProduct = async (id: number): Promise<Product | null> => {
  const result = await db.getFirstAsync<Product>(
    'SELECT * FROM products WHERE id = ?',
    [id],
  );
  return result || null;
};

export const getAllProducts = async (): Promise<Product[]> => {
  return await db.getAllAsync<Product>('SELECT * FROM products ORDER BY name');
};

export const getProductBySku = async (sku: string): Promise<Product | null> => {
  const result = await db.getFirstAsync<Product>(
    'SELECT * FROM products WHERE sku = ?',
    [sku],
  );
  return result || null;
};
