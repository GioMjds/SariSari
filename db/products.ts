import { db } from '../configs/sqlite';

export interface Product {
  id: number;
  name: string;
  sku: string;
  price: number;
  cost_price?: number;
  quantity: number;
  created_at: string;
  updated_at: string;
}

export const initProductsTable = async () => {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      sku TEXT UNIQUE NOT NULL,
      price REAL NOT NULL,
      cost_price REAL,
      quantity INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
};

export const insertProduct = async (name: string, sku: string, price: number, quantity: number = 0) => {
  const result = await db.runAsync(
    'INSERT INTO products (name, sku, price, quantity) VALUES (?, ?, ?, ?)',
    [name, sku, price, quantity]
  );
  return result.lastInsertRowId;
};

export const updateProduct = async (id: number, name: string, sku: string, price: number, quantity: number) => {
  await db.runAsync(
    'UPDATE products SET name = ?, sku = ?, price = ?, quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [name, sku, price, quantity, id]
  );
};

export const deleteProduct = async (id: number) => {
  await db.runAsync('DELETE FROM products WHERE id = ?', [id]);
};

export const getProduct = async (id: number): Promise<Product | null> => {
  const result = await db.getFirstAsync<Product>('SELECT * FROM products WHERE id = ?', [id]);
  return result || null;
};

export const getAllProducts = async (): Promise<Product[]> => {
  return await db.getAllAsync<Product>('SELECT * FROM products ORDER BY name');
};

export const getProductBySku = async (sku: string): Promise<Product | null> => {
  const result = await db.getFirstAsync<Product>('SELECT * FROM products WHERE sku = ?', [sku]);
  return result || null;
};
