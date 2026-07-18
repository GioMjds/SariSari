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
