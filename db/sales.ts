import { db } from '../configs/sqlite';
import { getCurrentLocalTimestamp, getTodayDateString } from '@/utils/timezone';
import { Sale, SaleItemWithProduct, SaleWithItems } from '@/types/sales.types';

export const initSalesTables = async () => {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      total INTEGER NOT NULL,
      payment_type TEXT NOT NULL DEFAULT 'cash' CHECK(payment_type IN ('cash', 'credit')),
      customer_name TEXT,
      customer_credit_id INTEGER,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_credit_id) REFERENCES customer_credits(id)
    );

    CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      price INTEGER NOT NULL,
      FOREIGN KEY (sale_id) REFERENCES sales(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );
  `);
};

export class InsufficientStockError extends Error {
  productId: number;
  available: number;
  requested: number;
  constructor(productId: number, available: number, requested: number) {
    super(
      `Insufficient stock for product ${productId}: requested ${requested}, available ${available}`,
    );
    this.name = 'InsufficientStockError';
    this.productId = productId;
    this.available = available;
    this.requested = requested;
  }
}

/**
 * Insert a sale, its items, the stock deductions, the inventory movement
 * history, and (for credit sales) the utang ledger entry — all inside a
 * single SQLite transaction.
 *
 * Stock availability is validated against the current quantity BEFORE any
 * write happens, so a failed sale leaves no partial state behind. If the
 * caller relies on optimistic quantity caching on the client, validate
 * again with a fresh read inside the transaction (we do that here).
 */
export const insertSale = async (
  items: { product_id: number; quantity: number; price: number }[],
  payment_type: 'cash' | 'credit' = 'cash',
  customer_name?: string,
  customer_credit_id?: number,
): Promise<number> => {
  if (!items || items.length === 0) {
    throw new Error('Cannot insert a sale with no items');
  }

  const total = items.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0,
  );
  const timestamp = getCurrentLocalTimestamp();

  // Use execAsync with BEGIN/COMMIT so the whole sale is one transaction.
  // expo-sqlite's runAsync implicitly commits each call; we want all-or-nothing.
  try {
    await db.execAsync('BEGIN TRANSACTION;');

    // 1. Re-read each product's quantity inside the transaction so we can
    //    fail fast on a stale optimistic cache from the caller.
    for (const item of items) {
      const row = await db.getFirstAsync<{ quantity: number }>(
        'SELECT quantity FROM products WHERE id = ?',
        [item.product_id],
      );
      const available = row?.quantity ?? 0;
      if (item.quantity <= 0) {
        throw new Error(
          `Invalid quantity for product ${item.product_id}: ${item.quantity}`,
        );
      }
      if (available < item.quantity) {
        throw new InsufficientStockError(
          item.product_id,
          available,
          item.quantity,
        );
      }
    }

    // 2. Insert the sale header.
    const saleResult = await db.runAsync(
      'INSERT INTO sales (total, payment_type, customer_name, customer_credit_id, timestamp) VALUES (?, ?, ?, ?, ?)',
      [
        total,
        payment_type,
        customer_name || null,
        customer_credit_id || null,
        timestamp,
      ],
    );
    const saleId = saleResult.lastInsertRowId;

    // 3. For each line: insert sale_item, deduct stock, record inventory
    //    movement. Doing them in this order keeps the audit trail consistent:
    //    if any line fails the whole transaction rolls back.
    for (const item of items) {
      await db.runAsync(
        'INSERT INTO sale_items (sale_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
        [saleId, item.product_id, item.quantity, item.price],
      );

      await db.runAsync(
        'UPDATE products SET quantity = quantity - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [item.quantity, item.product_id],
      );

      await db.runAsync(
        'INSERT INTO inventory_transactions (product_id, type, quantity) VALUES (?, ?, ?)',
        [item.product_id, 'sale', item.quantity],
      );
    }

    // 4. For credit sales, write a linked ledger entry. This is what the
    //    customer detail screen reads to compute the running balance, so it
    //    must land in the same transaction as the sale header.
    if (payment_type === 'credit') {
      if (!customer_credit_id) {
        throw new Error(
          'Credit sale requires a customer_credit_id to link the utang entry',
        );
      }
      await db.runAsync(
        'INSERT INTO credit_transactions (customer_id, amount, status, date) VALUES (?, ?, ?, ?)',
        [customer_credit_id, total, 'unpaid', timestamp],
      );
    }

    await db.execAsync('COMMIT;');
    return saleId;
  } catch (err) {
    // ROLLBACK ignores failures (e.g. no active txn) — best-effort cleanup.
    try {
      await db.execAsync('ROLLBACK;');
    } catch {
      // already rolled back or no transaction; safe to ignore
    }
    throw err;
  }
};

export const getSale = async (id: number): Promise<SaleWithItems | null> => {
  const sale = await db.getFirstAsync<Sale>(
    'SELECT * FROM sales WHERE id = ?',
    [id],
  );
  if (!sale) return null;

  const items = await db.getAllAsync<SaleItemWithProduct>(
    `SELECT si.*, p.name as product_name
     FROM sale_items si
     JOIN products p ON si.product_id = p.id
     WHERE si.sale_id = ?`,
    [id],
  );

  return { ...sale, items, items_count: items.length };
};

export const getAllSales = async (): Promise<SaleWithItems[]> => {
  const sales = await db.getAllAsync<Sale>(
    'SELECT * FROM sales ORDER BY timestamp DESC',
  );

  const salesWithItems = await Promise.all(
    sales.map(async (sale) => {
      const items = await db.getAllAsync<SaleItemWithProduct>(
        `SELECT si.*, p.name as product_name
         FROM sale_items si
         JOIN products p ON si.product_id = p.id
         WHERE si.sale_id = ?`,
        [sale.id],
      );
      return { ...sale, items, items_count: items.length };
    }),
  );

  return salesWithItems;
};

export const getSalesByDateRange = async (
  startDate: string,
  endDate: string,
): Promise<SaleWithItems[]> => {
  const sales = await db.getAllAsync<Sale>(
    'SELECT * FROM sales WHERE timestamp BETWEEN ? AND ? ORDER BY timestamp DESC',
    [startDate, endDate],
  );

  const salesWithItems = await Promise.all(
    sales.map(async (sale) => {
      const items = await db.getAllAsync<SaleItemWithProduct>(
        `SELECT si.*, p.name as product_name
         FROM sale_items si
         JOIN products p ON si.product_id = p.id
         WHERE si.sale_id = ?`,
        [sale.id],
      );
      return { ...sale, items, items_count: items.length };
    }),
  );

  return salesWithItems;
};

export const getSaleItems = async (
  sale_id: number,
): Promise<SaleItemWithProduct[]> => {
  return await db.getAllAsync<SaleItemWithProduct>(
    `SELECT si.*, p.name as product_name
     FROM sale_items si
     JOIN products p ON si.product_id = p.id
     WHERE si.sale_id = ?`,
    [sale_id],
  );
};

export const getTodayStats = async () => {
  const todayString = getTodayDateString();

  const stats = await db.getFirstAsync<{
    total: number;
    items_sold: number;
    credit_sales: number;
  }>(
    `SELECT
      COALESCE(SUM(total), 0) as total,
      COALESCE(SUM((SELECT SUM(quantity) FROM sale_items WHERE sale_id = sales.id)), 0) as items_sold,
      COALESCE(SUM(CASE WHEN payment_type = 'credit' THEN 1 ELSE 0 END), 0) as credit_sales
     FROM sales
     WHERE date(timestamp) = ?`,
    [todayString],
  );

  return stats || { total: 0, items_sold: 0, credit_sales: 0 };
};

export const deleteSale = async (id: number) => {
  // Wrap restore + delete in a transaction so we don't end up with stock
  // restored for a sale that's still in the table (or vice-versa).
  const items = await getSaleItems(id);

  try {
    await db.execAsync('BEGIN TRANSACTION;');

    for (const item of items) {
      await db.runAsync(
        'UPDATE products SET quantity = quantity + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [item.quantity, item.product_id],
      );
    }

    await db.runAsync('DELETE FROM sale_items WHERE sale_id = ?', [id]);
    await db.runAsync('DELETE FROM sales WHERE id = ?', [id]);

    await db.execAsync('COMMIT;');
  } catch (err) {
    try {
      await db.execAsync('ROLLBACK;');
    } catch {
      // ignore
    }
    throw err;
  }
};