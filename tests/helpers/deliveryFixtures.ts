import { db } from '@/configs/sqlite';
import {
  initProductsTable,
  initInventoryTable,
  initSalesTables,
  initSuppliersTable,
  initCreditsTable,
  runMigrations,
} from '@/database';
import { insertProduct } from '@/database/products';

export const setupDeliveryDb = async (): Promise<void> => {
  await initProductsTable();
  await initSuppliersTable();
  await initInventoryTable();
  await initSalesTables();
  await initCreditsTable();
  await runMigrations();
};

export const seedSupplier = async (
  id: string,
  name: string = id,
): Promise<string> => {
  await db.runAsync(
    'INSERT OR IGNORE INTO suppliers (id, name, created_at) VALUES (?, ?, ?)',
    [id, name, Date.now()],
  );
  return id;
};

export interface SeedProductOptions {
  name: string;
  sku: string;
  qty?: number;
  cost?: number;
  price?: number;
  supplierId?: string | null;
  barcode?: string | null;
  wholesale?: { unitName: string; price: number; cost: number; factor: number };
}

export const seedProduct = async (o: SeedProductOptions): Promise<number> =>
  insertProduct(
    o.name,
    o.sku,
    o.price ?? 2000,
    o.qty ?? 0,
    o.cost,
    undefined,
    o.barcode ?? null,
    o.supplierId ?? null,
    null,
    'Pc',
    o.wholesale?.unitName ?? null,
    o.wholesale?.price ?? null,
    o.wholesale?.cost ?? null,
    o.wholesale?.factor ?? null,
  );

export const stockOf = async (
  productId: number,
): Promise<{ quantity: number; cost_price: number | null }> => {
  const row = await db.getFirstAsync<{
    quantity: number;
    cost_price: number | null;
  }>('SELECT quantity, cost_price FROM products WHERE id = ?', [productId]);
  if (!row) throw new Error(`product ${productId} missing`);
  return row;
};
