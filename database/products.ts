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
      image_uri TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_products_quantity ON products(quantity);
  `);
};

/**
 * Thrown when an `insertProduct` or `updateProduct` call would land a
 * second non-null barcode on the table. Mirrors the SQLite UNIQUE
 * constraint error code 2067 (`SQLITE_CONSTRAINT_UNIQUE` on the
 * `idx_products_barcode` partial unique index). Carries the resolved
 * `existing` row so the caller can render an inline duplicate error
 * without a second roundtrip.
 */
export class BarcodeAlreadyExistsError extends Error {
  existing: Product;
  constructor(existing: Product) {
    super(
      `Barcode ${existing.barcode ?? existing.sku} is already used by product ${existing.id} (${existing.name}).`,
    );
    this.name = 'BarcodeAlreadyExistsError';
    this.existing = existing;
  }
}

/**
 * Translate a `BarcodeAlreadyExistsError` check against the catalog
 * when the SQLite driver surfaces an INSERT/UPDATE error. The expo-
 * sqlite / better-sqlite3 drivers both expose `code` and `message`
 * on thrown errors; we look for the unique-constraint message text
 * because `code` isn't always set.
 */
function isUniqueBarcodeError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const anyErr = err as { code?: number | string; message?: string };
  const message = anyErr.message ?? '';
  return (
    message.includes('UNIQUE constraint failed: products.barcode') ||
    message.includes('idx_products_barcode')
  );
}

/**
 * Normalize the optional `barcode` argument to either a non-empty
 * trimmed string or `null`. Empty/whitespace becomes `null` so the
 * partial unique index allows multiple "no barcode" rows.
 */
function normalizeBarcode(barcode?: string | null): string | null {
  if (barcode == null) return null;
  const trimmed = barcode.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export const insertProduct = async (
  name: string,
  sku: string,
  price: number,
  quantity: number = 0,
  cost_price?: number,
  category?: string,
  barcode?: string | null,
  supplier_id?: string | null,
  image_uri?: string | null,
): Promise<number> => {
  // The products table owns `quantity` as the source of truth, but the
  // inventory_transactions table is the audit log. Every stock change —
  // including initial stock at product creation — must land in both
  // tables inside the same transaction, so the column and the ledger
  // never disagree.
  let productId = 0;
  const normalizedBarcode = normalizeBarcode(barcode);

  try {
    await db.withTransactionAsync(async () => {
      const result = await db.runAsync(
        'INSERT INTO products (name, sku, price, quantity, cost_price, category, barcode, supplier_id, image_uri) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [name, sku, price, quantity, cost_price ?? null, category ?? null, normalizedBarcode, supplier_id ?? null, image_uri ?? null],
      );
      productId = result.lastInsertRowId;

      if (quantity > 0) {
        await db.runAsync(
          'INSERT INTO inventory_transactions (product_id, type, quantity, unit_cost, supplier_id) VALUES (?, ?, ?, ?, ?)',
          [productId, 'restock', quantity, cost_price ?? null, supplier_id ?? null],
        );
      }
    });
  } catch (err) {
    if (isUniqueBarcodeError(err) && normalizedBarcode != null) {
      // Fetch the conflicting row outside the failed transaction so the
      // typed error can carry it.
      const existing = await getProductByBarcode(normalizedBarcode);
      if (existing) throw new BarcodeAlreadyExistsError(existing);
    }
    throw err;
  }

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
  barcode?: string | null,
  supplier_id?: string | null,
  image_uri?: string | null,
) => {
  const normalizedBarcode = normalizeBarcode(barcode);

  try {
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
        'UPDATE products SET name = ?, sku = ?, price = ?, quantity = ?, cost_price = ?, category = ?, barcode = ?, supplier_id = ?, image_uri = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [name, sku, price, quantity, cost_price ?? null, category ?? null, normalizedBarcode, supplier_id ?? null, image_uri ?? null, id],
      );
      if (current && current.quantity !== quantity) {
        const delta = quantity - current.quantity;
        await db.runAsync(
          'INSERT INTO inventory_transactions (product_id, type, quantity, unit_cost, supplier_id) VALUES (?, ?, ?, ?, ?)',
          [id, 'restock', delta, cost_price ?? null, supplier_id ?? null],
        );
      }
    });
  } catch (err) {
    if (isUniqueBarcodeError(err) && normalizedBarcode != null) {
      const existing = await getProductByBarcode(normalizedBarcode);
      if (existing && existing.id !== id) {
        throw new BarcodeAlreadyExistsError(existing);
      }
    }
    throw err;
  }
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

/**
 * Look up a product by its printed barcode (the v5 column). Returns
 * `null` for legacy rows where the SKU doubles as the barcode — those
 * rows have `barcode IS NULL` and must be resolved via
 * `getProductBySku`. The POS resolver composes both lookups in order.
 */
export const getProductByBarcode = async (
  barcode: string,
): Promise<Product | null> => {
  const result = await db.getFirstAsync<Product>(
    'SELECT * FROM products WHERE barcode = ? LIMIT 1',
    [barcode],
  );
  return result || null;
};