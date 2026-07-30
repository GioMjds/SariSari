import type { SQLiteDatabase } from 'expo-sqlite';
import type {
  CatalogProduct,
  CatalogRow,
  NewCatalogProduct,
} from '@/types/catalog.types';

function rowToCatalogProduct(row: CatalogRow): CatalogProduct {
  return {
    barcode: row.barcode,
    name: row.name,
    brand: row.brand,
    category: row.category,
    unit: row.unit,
    imageUrl: row.image_url,
    createdAt: row.created_at,
  };
}

export async function getCatalogProductByBarcode(
  database: SQLiteDatabase,
  barcode: string,
): Promise<CatalogProduct | null> {
  const normalizedBarcode = barcode.trim();
  if (!normalizedBarcode) return null;

  const row = await database.getFirstAsync<CatalogRow>(
    'SELECT barcode, name, brand, category, unit, image_url, created_at FROM product_catalog WHERE barcode = ? LIMIT 1',
    [normalizedBarcode],
  );

  return row ? rowToCatalogProduct(row) : null;
}

export async function insertCatalogProductIfMissing(
  database: SQLiteDatabase,
  input: NewCatalogProduct,
): Promise<void> {
  await database.runAsync(
    'INSERT OR IGNORE INTO product_catalog (barcode, name, brand, category, unit, image_url, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [
      input.barcode.trim(),
      input.name,
      input.brand,
      input.category,
      input.unit || 'Pc',
      input.imageUrl,
      Date.now(),
    ],
  );
}

export async function insertCatalogProductsBatch(
  database: SQLiteDatabase,
  inputs: NewCatalogProduct[],
): Promise<void> {
  if (inputs.length === 0) return;

  const chunkSize = 50;
  const now = Date.now();

  await database.withTransactionAsync(async () => {
    for (let i = 0; i < inputs.length; i += chunkSize) {
      const chunk = inputs.slice(i, i + chunkSize);
      const placeholders = chunk.map(() => '(?, ?, ?, ?, ?, ?, ?)').join(', ');
      const sql = `INSERT OR IGNORE INTO product_catalog (barcode, name, brand, category, unit, image_url, created_at) VALUES ${placeholders}`;

      const params: (string | number | null)[] = [];
      for (const item of chunk) {
        params.push(
          item.barcode.trim(),
          item.name,
          item.brand,
          item.category,
          item.unit || 'Pc',
          item.imageUrl,
          now,
        );
      }

      await database.runAsync(sql, params);
    }
  });
}

