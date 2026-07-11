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
      barcode TEXT,
      image_uri TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      retail_unit_name TEXT NOT NULL DEFAULT 'Pc',
      wholesale_unit_name TEXT,
      wholesale_price INTEGER,
      wholesale_cost_price INTEGER,
      conversion_factor INTEGER,
      wholesale_barcode TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_products_quantity ON products(quantity);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode) WHERE barcode IS NOT NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_products_wholesale_barcode ON products(wholesale_barcode) WHERE wholesale_barcode IS NOT NULL;
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
      `Barcode ${existing.barcode ?? existing.wholesale_barcode ?? existing.sku} is already used by product ${existing.id} (${existing.name}).`,
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
    message.includes('idx_products_barcode') ||
    message.includes('UNIQUE constraint failed: products.wholesale_barcode') ||
    message.includes('idx_products_wholesale_barcode')
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

async function checkBarcodeCollision(
  barcode: string | null,
  wholesaleBarcode: string | null,
  excludeId?: number,
): Promise<void> {
  if (barcode && wholesaleBarcode && barcode === wholesaleBarcode) {
    throw new Error('Retail barcode and wholesale barcode must be different.');
  }

  const toCheck = [barcode, wholesaleBarcode].filter(
    (b): b is string => b != null && b.length > 0,
  );
  for (const b of toCheck) {
    const existing = await getProductByBarcode(b);
    if (existing && existing.id !== excludeId) {
      throw new BarcodeAlreadyExistsError(existing);
    }
  }
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
  retail_unit_name: string = 'Pc',
  wholesale_unit_name?: string | null,
  wholesale_price?: number | null,
  wholesale_cost_price?: number | null,
  conversion_factor?: number | null,
  wholesale_barcode?: string | null,
): Promise<number> => {
  const normalizedBarcode = normalizeBarcode(barcode);
  const normalizedWholesaleBarcode = normalizeBarcode(wholesale_barcode);

  await checkBarcodeCollision(normalizedBarcode, normalizedWholesaleBarcode);

  let productId = 0;

  try {
    await db.withTransactionAsync(async () => {
      const result = await db.runAsync(
        `INSERT INTO products (
          name, sku, price, quantity, cost_price, category, barcode, supplier_id, image_uri,
          retail_unit_name, wholesale_unit_name, wholesale_price, wholesale_cost_price, conversion_factor, wholesale_barcode
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          name,
          sku,
          price,
          quantity,
          cost_price ?? null,
          category ?? null,
          normalizedBarcode,
          supplier_id ?? null,
          image_uri ?? null,
          retail_unit_name || 'Pc',
          wholesale_unit_name ?? null,
          wholesale_price ?? null,
          wholesale_cost_price ?? null,
          conversion_factor ?? null,
          normalizedWholesaleBarcode,
        ],
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
    if (isUniqueBarcodeError(err)) {
      const toCheck = [normalizedBarcode, normalizedWholesaleBarcode].filter(
        (b): b is string => b != null,
      );
      for (const b of toCheck) {
        const existing = await getProductByBarcode(b);
        if (existing) throw new BarcodeAlreadyExistsError(existing);
      }
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
  retail_unit_name: string = 'Pc',
  wholesale_unit_name?: string | null,
  wholesale_price?: number | null,
  wholesale_cost_price?: number | null,
  conversion_factor?: number | null,
  wholesale_barcode?: string | null,
) => {
  const normalizedBarcode = normalizeBarcode(barcode);
  const normalizedWholesaleBarcode = normalizeBarcode(wholesale_barcode);

  await checkBarcodeCollision(normalizedBarcode, normalizedWholesaleBarcode, id);

  try {
    await db.withTransactionAsync(async () => {
      const current = await db.getFirstAsync<{ quantity: number }>(
        'SELECT quantity FROM products WHERE id = ?',
        [id],
      );
      await db.runAsync(
        `UPDATE products SET
          name = ?, sku = ?, price = ?, quantity = ?, cost_price = ?, category = ?, barcode = ?, supplier_id = ?, image_uri = ?,
          retail_unit_name = ?, wholesale_unit_name = ?, wholesale_price = ?, wholesale_cost_price = ?, conversion_factor = ?, wholesale_barcode = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`,
        [
          name,
          sku,
          price,
          quantity,
          cost_price ?? null,
          category ?? null,
          normalizedBarcode,
          supplier_id ?? null,
          image_uri ?? null,
          retail_unit_name || 'Pc',
          wholesale_unit_name ?? null,
          wholesale_price ?? null,
          wholesale_cost_price ?? null,
          conversion_factor ?? null,
          normalizedWholesaleBarcode,
          id,
        ],
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
    if (isUniqueBarcodeError(err)) {
      const toCheck = [normalizedBarcode, normalizedWholesaleBarcode].filter(
        (b): b is string => b != null,
      );
      for (const b of toCheck) {
        const existing = await getProductByBarcode(b);
        if (existing && existing.id !== id) {
          throw new BarcodeAlreadyExistsError(existing);
        }
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

export const getProductByBarcode = async (
  barcode: string,
): Promise<Product | null> => {
  const result = await db.getFirstAsync<Product>(
    'SELECT * FROM products WHERE barcode = ? OR wholesale_barcode = ? LIMIT 1',
    [barcode, barcode],
  );
  return result || null;
};