import { Product } from '@/types/products.types';
import { db } from '../configs/sqlite';
import { insertCatalogProductIfMissing } from './catalog';

export interface FastLaneProduct extends Product {
  is_favorite: boolean;
  last_sold_at?: string | null;
  units_sold_14d?: number;
}

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
  `);

  const productColumns = await db.getAllAsync<{ name: string }>(
    'PRAGMA table_info(products)',
  );
  const hasWholesaleBarcode = productColumns.some(
    (c) => c.name === 'wholesale_barcode',
  );
  if (hasWholesaleBarcode) {
    await db.execAsync(
      'CREATE UNIQUE INDEX IF NOT EXISTS idx_products_wholesale_barcode ON products(wholesale_barcode) WHERE wholesale_barcode IS NOT NULL;',
    );
  }
};

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

function normalizeBarcode(barcode?: string | null): string | null {
  if (barcode == null) return null;
  const trimmed = barcode.trim();
  return trimmed.length > 0 ? trimmed : null;
}

async function checkProductCollision(
  sku: string,
  barcode: string | null,
  wholesaleBarcode: string | null,
  excludeId?: number,
): Promise<void> {
  if (barcode && wholesaleBarcode && barcode === wholesaleBarcode) {
    throw new Error('Retail barcode and wholesale barcode must be different.');
  }

  const trimmedSku = sku.trim();
  const toCheck = Array.from(
    new Set(
      [trimmedSku, barcode, wholesaleBarcode].filter(
        (b): b is string => b != null && b.trim().length > 0,
      ),
    ),
  );

  if (toCheck.length === 0) return;

  const placeholders = toCheck.map(() => '?').join(',');
  const query = `
    SELECT * FROM products
    WHERE (sku IN (${placeholders}) OR barcode IN (${placeholders}) OR wholesale_barcode IN (${placeholders}))
    ${excludeId != null ? 'AND id != ?' : ''}
    LIMIT 1
  `;
  const params: (string | number)[] = [...toCheck, ...toCheck, ...toCheck];
  if (excludeId != null) {
    params.push(excludeId);
  }

  const existing = await db.getFirstAsync<Product>(query, params);
  if (existing) {
    throw new BarcodeAlreadyExistsError(existing);
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

  let productId = 0;

  try {
    await db.withTransactionAsync(async () => {
      await checkProductCollision(
        sku,
        normalizedBarcode,
        normalizedWholesaleBarcode,
      );

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
          [
            productId,
            'restock',
            quantity,
            cost_price ?? null,
            supplier_id ?? null,
          ],
        );
      }

      if (normalizedBarcode) {
        try {
          await insertCatalogProductIfMissing(db, {
            barcode: normalizedBarcode,
            name,
            brand: null,
            category: category ?? null,
            unit: retail_unit_name || 'Pc',
            imageUrl: null,
          });
        } catch (catalogErr) {
          // Catalog writes are non-fatal per spec: a failure must not prevent
          // saving the store product or inventory transaction.
          console.warn(
            'Failed to write catalog record during product save; continuing.',
            catalogErr,
          );
        }
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

  try {
    await db.withTransactionAsync(async () => {
      await checkProductCollision(
        sku,
        normalizedBarcode,
        normalizedWholesaleBarcode,
        id,
      );

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

      if (normalizedBarcode) {
        try {
          await insertCatalogProductIfMissing(db, {
            barcode: normalizedBarcode,
            name,
            brand: null,
            category: category ?? null,
            unit: retail_unit_name || 'Pc',
            imageUrl: null,
          });
        } catch (catalogErr) {
          // Catalog writes are non-fatal per spec: a failure must not prevent
          // saving the store product or inventory transaction.
          console.warn(
            'Failed to write catalog record during product update; continuing.',
            catalogErr,
          );
        }
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

export type ProductFilterType =
  | 'all'
  | 'in_stock'
  | 'low'
  | 'out'
  | 'new'
  | 'critical'
  | 'overstock'
  | 'near_expiry';

export interface ProductsPageCursor {
  name: string;
  id: number;
}

export interface ProductsPage {
  items: Product[];
  nextCursor: ProductsPageCursor | null;
}

export const getProductsPage = async (params: {
  cursor: ProductsPageCursor | null;
  limit: number;
  search?: string;
  filter?: ProductFilterType;
}): Promise<ProductsPage> => {
  const search = (params.search ?? '').trim();
  const searchPattern = `%${search.toLowerCase()}%`;
  const filter = params.filter ?? 'all';
  const cursorName = params.cursor?.name ?? '';
  const cursorId = params.cursor?.id ?? 0;
  const limit = Math.max(1, Math.floor(params.limit));

  let filterCondition = '1=1';
  if (filter === 'in_stock') {
    filterCondition = 'quantity > 0';
  } else if (filter === 'low') {
    filterCondition = 'quantity > 0 AND quantity <= 5';
  } else if (filter === 'critical') {
    filterCondition = 'quantity > 0 AND quantity <= 3';
  } else if (filter === 'out') {
    filterCondition = 'quantity = 0';
  } else if (filter === 'overstock') {
    filterCondition = 'quantity >= 100';
  } else if (filter === 'new') {
    filterCondition = "julianday('now') - julianday(created_at) <= 7";
  } else if (filter === 'near_expiry') {
    filterCondition = 'wholesale_unit_name IS NOT NULL';
  }

  const rows = await db.getAllAsync<Product>(
    `SELECT * FROM products
     WHERE (
       ? = '' OR
       (LOWER(name) > LOWER(?) OR (LOWER(name) = LOWER(?) AND id > ?))
     )
     AND (
       ? = '' OR
       LOWER(name) LIKE ? OR
       LOWER(sku)  LIKE ? OR
       LOWER(barcode) LIKE ? OR
       LOWER(category) LIKE ?
     )
     AND (${filterCondition})
     ORDER BY LOWER(name), id
     LIMIT ?`,
    [
      cursorName,
      cursorName,
      cursorName,
      cursorId,
      search,
      searchPattern,
      searchPattern,
      searchPattern,
      searchPattern,
      limit,
    ],
  );

  const nextCursor =
    rows.length < limit
      ? null
      : (() => {
          const last = rows[rows.length - 1];
          // `noUncheckedIndexedAccess` makes `last` `Product | undefined`.
          // `rows.length` is at least 1 here (limit >= 1, returned N rows).
          if (!last) return null;
          return { name: last.name, id: last.id } satisfies ProductsPageCursor;
        })();

  return { items: rows, nextCursor };
};

export async function getFastLaneProducts({
  limit = 15,
}: { limit?: number } = {}): Promise<FastLaneProduct[]> {
  const sql = `
    WITH favorite_items AS (
      SELECT p.*, 1 AS is_fav_priority, 0 AS units_sold_14d
      FROM products p
      WHERE p.is_favorite = 1
    ),
    top_sold_items AS (
      SELECT p.*, 0 AS is_fav_priority, SUM(si.quantity) AS units_sold_14d
      FROM products p
      JOIN sale_items si ON si.product_id = p.id
      JOIN sales s ON s.id = si.sale_id
      WHERE s.timestamp >= datetime('now', '-14 days')
        AND p.is_favorite = 0
      GROUP BY p.id
      ORDER BY units_sold_14d DESC
    )
    SELECT * FROM (
      SELECT * FROM favorite_items
      UNION ALL
      SELECT * FROM top_sold_items
    )
    LIMIT ?;
  `;
  return await db.getAllAsync<FastLaneProduct>(sql, [limit]);
}

export async function toggleProductFavorite(
  productId: number,
  isFavorite: boolean,
): Promise<void> {
  await db.runAsync(
    'UPDATE products SET is_favorite = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?;',
    [isFavorite ? 1 : 0, productId],
  );
}

export const deleteProduct = async (id: number) => {
  await db.runAsync('DELETE FROM products WHERE id = ?', [id]);
};

export const updateProductCategory = async (
  id: number,
  category: string | null,
): Promise<void> => {
  await db.runAsync(
    'UPDATE products SET category = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [category, id],
  );
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
    'SELECT * FROM products WHERE barcode = ? OR wholesale_barcode = ? OR sku = ? LIMIT 1',
    [barcode, barcode, barcode],
  );
  return result || null;
};
