import { CatalogProduct, CatalogRow, NewCatalogProduct } from '@/types/catalog.types';
import { db } from '../configs/sqlite';

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

export const getCatalogProduct = async (barcode: string): Promise<CatalogProduct | null> => {
  const result = await db.getFirstAsync<CatalogRow>(
    'SELECT * FROM product_catalog WHERE barcode = ?',
    [barcode]
  );
  return result ? rowToCatalogProduct(result) : null;
};

export const insertCatalogProduct = async (product: NewCatalogProduct): Promise<void> => {
  await db.runAsync(
    `INSERT OR REPLACE INTO product_catalog (
      barcode, name, brand, category, unit, image_url, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      product.barcode,
      product.name,
      product.brand ?? null,
      product.category ?? null,
      product.unit || 'Pc',
      product.imageUrl ?? null,
      Date.now(),
    ]
  );
};

export const getAllCatalogProducts = async (): Promise<CatalogProduct[]> => {
  const rows = await db.getAllAsync<CatalogRow>(
    'SELECT * FROM product_catalog ORDER BY name'
  );
  return rows.map(rowToCatalogProduct);
};
