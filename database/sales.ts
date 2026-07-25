import { db } from '../configs/sqlite';
import { getCurrentLocalTimestamp, getTodayDateString } from '@/utils/timezone';
import { useBackupCounter } from '../stores/backupCounter';
import {
  Sale,
  SaleItemWithProduct,
  SaleWithItems,
  SaleStats,
} from '@/types/sales.types';

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
      sold_unit_name TEXT,
      sold_unit_qty INTEGER,
      conversion_factor INTEGER,
      cost_price INTEGER,
      FOREIGN KEY (sale_id) REFERENCES sales(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE INDEX IF NOT EXISTS idx_sales_timestamp ON sales(timestamp);
    CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
    CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON sale_items(product_id);
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

export interface InsertSaleItemInput {
  product_id: number;
  quantity: number;
  price: number;
  selected_unit?: 'retail' | 'wholesale';
  sold_unit_name?: string;
  sold_unit_qty?: number;
  conversion_factor?: number | null;
  cost_price?: number | null;
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
  items: InsertSaleItemInput[],
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
      const productRow = await db.getFirstAsync<{
        quantity: number;
        cost_price: number | null;
        wholesale_cost_price: number | null;
        retail_unit_name: string;
        wholesale_unit_name: string | null;
        conversion_factor: number | null;
      }>(
        'SELECT quantity, cost_price, wholesale_cost_price, retail_unit_name, wholesale_unit_name, conversion_factor FROM products WHERE id = ?',
        [item.product_id],
      );
      const available = productRow?.quantity ?? 0;
      if (item.quantity <= 0) {
        throw new Error(
          `Invalid quantity for product ${item.product_id}: ${item.quantity}`,
        );
      }
      const isWholesale =
        item.selected_unit === 'wholesale' &&
        productRow?.conversion_factor != null &&
        productRow.conversion_factor >= 2;
      const piecesRequired = isWholesale
        ? item.quantity * productRow!.conversion_factor!
        : item.quantity;

      if (available < piecesRequired) {
        throw new InsufficientStockError(
          item.product_id,
          available,
          piecesRequired,
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
      const productRow = await db.getFirstAsync<{
        cost_price: number | null;
        wholesale_cost_price: number | null;
        retail_unit_name: string;
        wholesale_unit_name: string | null;
        conversion_factor: number | null;
      }>(
        'SELECT cost_price, wholesale_cost_price, retail_unit_name, wholesale_unit_name, conversion_factor FROM products WHERE id = ?',
        [item.product_id],
      );

      const isWholesale =
        item.selected_unit === 'wholesale' &&
        productRow?.conversion_factor != null &&
        productRow.conversion_factor >= 2;
      const piecesDeducted = isWholesale
        ? item.quantity * productRow!.conversion_factor!
        : item.quantity;
      const soldUnitName =
        item.sold_unit_name ||
        (isWholesale
          ? productRow?.wholesale_unit_name || 'Case'
          : productRow?.retail_unit_name || 'Pc');
      const soldUnitQty = item.sold_unit_qty ?? item.quantity;
      const conversionFactor = isWholesale
        ? productRow?.conversion_factor
        : null;
      const costPriceSnapshot =
        item.cost_price !== undefined
          ? item.cost_price
          : isWholesale
            ? (productRow?.wholesale_cost_price ?? null)
            : (productRow?.cost_price ?? null);

      await db.runAsync(
        `INSERT INTO sale_items (
          sale_id, product_id, quantity, price, sold_unit_name, sold_unit_qty, conversion_factor, cost_price
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          saleId,
          item.product_id,
          piecesDeducted,
          item.price,
          soldUnitName,
          soldUnitQty,
          conversionFactor ?? null,
          costPriceSnapshot ?? null,
        ],
      );

      await db.runAsync(
        'UPDATE products SET quantity = quantity - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [piecesDeducted, item.product_id],
      );

      await db.runAsync(
        'INSERT INTO inventory_transactions (product_id, type, quantity) VALUES (?, ?, ?)',
        [item.product_id, 'sale', piecesDeducted],
      );
    }

    // 4. For credit sales, write a linked ledger entry. This is what the
    //    customer detail screen reads to compute the running balance, so it
    //    must land in the same transaction as the sale header. We capture
    //    the new credit_transactions.id and store it on the sales row so
    //    `deleteSale` can reverse the credit entry.
    if (payment_type === 'credit') {
      if (!customer_credit_id) {
        throw new Error(
          'Credit sale requires a customer_credit_id to link the utang entry',
        );
      }
      const creditResult = await db.runAsync(
        'INSERT INTO credit_transactions (customer_id, amount, status, date) VALUES (?, ?, ?, ?)',
        [customer_credit_id, total, 'unpaid', timestamp],
      );
      const creditTxnId = creditResult.lastInsertRowId;
      await db.runAsync(
        'UPDATE sales SET credit_transaction_id = ? WHERE id = ?',
        [creditTxnId, saleId],
      );
    }

    await db.execAsync('COMMIT;');

    // Fire-and-forget backup counter bump. A failed bump MUST NOT
    // affect the sale — the sale is the source of truth; backups are
    // best-effort. The 20-sale scheduler will retry on the next sale.
    try {
      useBackupCounter.getState().bump();
    } catch {
      // intentional swallow — see spec §7 "What never throws across a sale"
    }

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

  if (sales.length === 0) return [];

  // Fetch all sale items in a single query
  const allItems = await db.getAllAsync<
    SaleItemWithProduct & { sale_id: number }
  >(
    `SELECT si.*, p.name as product_name
     FROM sale_items si
     JOIN products p ON si.product_id = p.id`,
  );

  // Group items by sale_id in memory
  const itemsBySaleId: Record<number, SaleItemWithProduct[]> = {};
  for (const item of allItems) {
    if (!itemsBySaleId[item.sale_id]) {
      itemsBySaleId[item.sale_id] = [];
    }
    itemsBySaleId[item.sale_id].push({
      id: item.id,
      sale_id: item.sale_id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price,
      product_name: item.product_name,
    });
  }

  return sales.map((sale) => {
    const items = itemsBySaleId[sale.id] || [];
    return { ...sale, items, items_count: items.length };
  });
};

export const getRecentSales = async (
  limit: number,
): Promise<SaleWithItems[]> => {
  const sales = await db.getAllAsync<Sale>(
    'SELECT * FROM sales ORDER BY timestamp DESC LIMIT ?',
    [limit],
  );

  if (sales.length === 0) return [];

  const saleIds = sales.map((s) => s.id);
  const placeholders = saleIds.map(() => '?').join(',');
  const allItems = await db.getAllAsync<
    SaleItemWithProduct & { sale_id: number }
  >(
    `SELECT si.*, p.name as product_name
     FROM sale_items si
     JOIN products p ON si.product_id = p.id
     WHERE si.sale_id IN (${placeholders})`,
    saleIds,
  );

  const itemsBySaleId: Record<number, SaleItemWithProduct[]> = {};
  for (const item of allItems) {
    if (!itemsBySaleId[item.sale_id]) {
      itemsBySaleId[item.sale_id] = [];
    }
    itemsBySaleId[item.sale_id].push({
      id: item.id,
      sale_id: item.sale_id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price,
      product_name: item.product_name,
    });
  }

  return sales.map((sale) => {
    const items = itemsBySaleId[sale.id] || [];
    return { ...sale, items, items_count: items.length };
  });
};

export const hasSales = async (): Promise<boolean> => {
  const row = await db.getFirstAsync<{ exists_val: number }>(
    'SELECT EXISTS(SELECT 1 FROM sales) as exists_val',
  );
  return !!row?.exists_val;
};

export const getSalesByDateRange = async (
  startDate: string,
  endDate: string,
): Promise<SaleWithItems[]> => {
  const sales = await db.getAllAsync<Sale>(
    'SELECT * FROM sales WHERE timestamp BETWEEN ? AND ? ORDER BY timestamp DESC',
    [startDate, endDate],
  );

  if (sales.length === 0) return [];

  const allItems: (SaleItemWithProduct & { sale_id: number })[] = [];
  const MAX_VARS = 900;
  const saleIds = sales.map((s) => s.id);
  for (let i = 0; i < saleIds.length; i += MAX_VARS) {
    const chunk = saleIds.slice(i, i + MAX_VARS);
    const placeholders = chunk.map(() => '?').join(',');
    const rows = await db.getAllAsync<
      SaleItemWithProduct & { sale_id: number }
    >(
      `SELECT si.*, p.name as product_name
        FROM sale_items si
        JOIN products p ON si.product_id = p.id
        WHERE si.sale_id IN (${placeholders})`,
      chunk,
    );
    allItems.push(...rows);
  }

  // Group items by sale_id in memory
  const itemsBySaleId: Record<number, SaleItemWithProduct[]> = {};
  for (const item of allItems) {
    if (!itemsBySaleId[item.sale_id]) {
      itemsBySaleId[item.sale_id] = [];
    }
    itemsBySaleId[item.sale_id].push({
      id: item.id,
      sale_id: item.sale_id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price,
      product_name: item.product_name,
    });
  }

  return sales.map((sale) => {
    const items = itemsBySaleId[sale.id] || [];
    return { ...sale, items, items_count: items.length };
  });
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

export const getTodayStats = async (): Promise<SaleStats> => {
  const todayString = getTodayDateString();

  const stats = await db.getFirstAsync<{
    total: number;
    items_sold: number;
    credit_sales: number;
    transaction_count: number;
  }>(
    `SELECT
      COALESCE(SUM(total), 0) as total,
      COALESCE(SUM((SELECT SUM(quantity) FROM sale_items WHERE sale_id = sales.id)), 0) as items_sold,
      COALESCE(SUM(CASE WHEN payment_type = 'credit' THEN 1 ELSE 0 END), 0) as credit_sales,
      COUNT(*) as transaction_count
      FROM sales
      WHERE date(timestamp) = ?`,
    [todayString],
  );

  return (
    stats || {
      total: 0,
      items_sold: 0,
      credit_sales: 0,
      transaction_count: 0,
    }
  );
};

export const deleteSale = async (id: number) => {
  await db.withTransactionAsync(async () => {
    const sale = await db.getFirstAsync<
      Sale & { credit_transaction_id: number | null; timestamp: string }
    >('SELECT id, credit_transaction_id, timestamp FROM sales WHERE id = ?', [
      id,
    ]);
    if (!sale) return;
    const isLocked = await db.getFirstAsync<{ id: string }>(
      `SELECT id FROM cash_sessions
       WHERE status = 'closed'
         AND ? >= opening_timestamp
         AND ? <= closing_timestamp
       LIMIT 1`,
      [sale.timestamp, sale.timestamp],
    );
    if (isLocked) {
      throw new Error(
        'Cannot delete a sale belonging to a closed cash session',
      );
    }
    const items = await getSaleItems(id);
    // 1. Reverse the credit transaction (if this was a credit sale) before
    //    we lose the sales.credit_transaction_id back-pointer. The CASCADE
    //    on payment_allocations.credit_transaction_id cleans up the FIFO
    //    slice rows; the SET NULL on payments.credit_transaction_id just
    //    nulls the back-pointer on payment rows (we don't want to delete
    //    them — payment history is independent of sale history).
    if (sale.credit_transaction_id) {
      await db.runAsync('DELETE FROM credit_transactions WHERE id = ?', [
        sale.credit_transaction_id,
      ]);
    }
    // 2. Restore stock for each item and record the reversal in the
    //    inventory movement history so the ledger agrees with the column.
    for (const item of items) {
      await db.runAsync(
        'UPDATE products SET quantity = quantity + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [item.quantity, item.product_id],
      );
      await db.runAsync(
        'INSERT INTO inventory_transactions (product_id, type, quantity) VALUES (?, ?, ?)',
        [item.product_id, 'restock', item.quantity],
      );
    }
    // 3. Drop the sale header and its items.
    await db.runAsync('DELETE FROM sale_items WHERE sale_id = ?', [id]);
    await db.runAsync('DELETE FROM sales WHERE id = ?', [id]);
  });
};
