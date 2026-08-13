import { db } from '../configs/sqlite';
import { getCurrentLocalTimestamp, getTodayDateString } from '@/utils/timezone';
import { useBackupCounter } from '../stores/backupCounter';
import * as Crypto from 'expo-crypto';
import {
  Sale,
  SaleItemWithProduct,
  SaleWithItems,
  SaleStats,
} from '@/types/sales.types';
import { OverrideReasonCode } from '@/types';
import { getAppSetting } from './settings';

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

export class SaleAlreadyCancelledError extends Error {
  saleId: number;
  constructor(saleId: number) {
    super(`Sale ${saleId} has already been cancelled`);
    this.name = 'SaleAlreadyCancelledError';
    this.saleId = saleId;
  }
}

export class SaleLockedError extends Error {
  saleId: number;
  constructor(saleId: number) {
    super(
      `Sale ${saleId} belongs to a closed cash session and cannot be corrected`,
    );
    this.name = 'SaleLockedError';
    this.saleId = saleId;
  }
}

export class VoidWindowExceededError extends Error {
  saleId: number;
  windowHours: number;
  hoursSinceSale: number;
  constructor(saleId: number, windowHours: number, hoursSinceSale: number) {
    super(
      `Sale ${saleId} is outside the ${windowHours}-hour correction window (${hoursSinceSale.toFixed(1)}h since sale)`,
    );
    this.name = 'VoidWindowExceededError';
    this.saleId = saleId;
    this.windowHours = windowHours;
    this.hoursSinceSale = hoursSinceSale;
  }
}

export class NoOpenCashSessionError extends Error {
  constructor() {
    super('No open cash session exists for today');
    this.name = 'NoOpenCashSessionError';
  }
}

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

export const insertSale = async (
  items: InsertSaleItemInput[],
  payment_type: 'cash' | 'credit' = 'cash',
  customer_name?: string,
  customer_credit_id?: number,
  overrideReasonCode?: OverrideReasonCode,
  overrideReasonNote?: string | null,
): Promise<number> => {
  if (!items || items.length === 0) {
    throw new Error('Cannot insert a sale with no items');
  }

  const total = items.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0,
  );
  const timestamp = getCurrentLocalTimestamp();

  try {
    await db.execAsync('BEGIN TRANSACTION;');

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

    const saleResult = await db.runAsync(
      'INSERT INTO sales (total, payment_type, customer_name, customer_credit_id, timestamp, override_reason_code, override_reason_note) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        total,
        payment_type,
        customer_name || null,
        customer_credit_id || null,
        timestamp,
        overrideReasonCode || null,
        overrideReasonNote || null,
      ],
    );
    const saleId = saleResult.lastInsertRowId;

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

    if (payment_type === 'credit') {
      if (!customer_credit_id) {
        throw new Error(
          'Credit sale requires a customer_credit_id to link the utang entry',
        );
      }
      const creditResult = await db.runAsync(
        "INSERT INTO credit_transactions (customer_id, amount, status, date, override_reason_code, override_reason_note) VALUES (?, ?, 'unpaid', ?, ?, ?)",
        [
          customer_credit_id,
          total,
          timestamp,
          overrideReasonCode || null,
          overrideReasonNote || null,
        ],
      );
      const creditTxnId = creditResult.lastInsertRowId;
      await db.runAsync(
        'UPDATE sales SET credit_transaction_id = ? WHERE id = ?',
        [creditTxnId, saleId],
      );
    }

    await db.execAsync('COMMIT;');

    try {
      useBackupCounter.getState().bump();
    } catch {}

    return saleId;
  } catch (err) {
    try {
      await db.execAsync('ROLLBACK;');
    } catch {}
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
    itemsBySaleId[item.sale_id]!.push({
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
    itemsBySaleId[item.sale_id]!.push({
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
    itemsBySaleId[item.sale_id]!.push({
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
    if (sale.credit_transaction_id) {
      await db.runAsync('DELETE FROM credit_transactions WHERE id = ?', [
        sale.credit_transaction_id,
      ]);
    }
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

interface CorrectionActor {
  actorUser: string;
  witnessUser: string | null;
  reasonCode: string;
  note?: string | undefined;
}

interface CorrectionSaleRow {
  id: number;
  total: number;
  payment_type: 'cash' | 'credit';
  timestamp: string;
  cancelled_at: string | null;
  credit_transaction_id: number | null;
}

const assertCanCorrectSale = async (
  saleId: number,
  correctionKind: 'void' | 'refund' | 'price_correction',
): Promise<{
  sale: CorrectionSaleRow;
  items: SaleItemWithProduct[];
  voidWindowHours: number;
}> => {
  const sale = await db.getFirstAsync<CorrectionSaleRow>(
    'SELECT id, total, payment_type, timestamp, cancelled_at, credit_transaction_id FROM sales WHERE id = ?',
    [saleId],
  );
  if (!sale) {
    throw new Error(`Sale ${saleId} not found`);
  }
  if (sale.cancelled_at) {
    throw new SaleAlreadyCancelledError(saleId);
  }

  // The locked-cash-session guard mirrors `deleteSale` at line 477-489.
  const isLocked = await db.getFirstAsync<{ id: string }>(
    `SELECT id FROM cash_sessions
     WHERE status = 'closed'
       AND ? >= opening_timestamp
       AND ? <= closing_timestamp
     LIMIT 1`,
    [sale.timestamp, sale.timestamp],
  );
  if (isLocked) {
    throw new SaleLockedError(saleId);
  }

  const windowSetting = await getAppSetting('void_window_hours');
  const voidWindowHours = windowSetting ? Number(windowSetting) : 24;
  const saleMs = Date.parse(sale.timestamp);
  const hoursSinceSale = (Date.now() - saleMs) / 36e5;
  if (
    correctionKind !== 'price_correction' &&
    hoursSinceSale > voidWindowHours
  ) {
    throw new VoidWindowExceededError(saleId, voidWindowHours, hoursSinceSale);
  }

  const items = await getSaleItems(saleId);
  return { sale, items, voidWindowHours };
};

export const voidSale = async (
  saleId: number,
  args: CorrectionActor,
): Promise<number> => {
  let correctionId = 0;
  await db.withTransactionAsync(async () => {
    const { sale, items } = await assertCanCorrectSale(saleId, 'void');

    const correctionResult = await db.runAsync(
      `INSERT INTO sale_corrections (
        sale_id, kind, actor_reason_code, actor_note, actor_user, witness_user
      ) VALUES (?, 'void', ?, ?, ?, ?)`,
      [
        saleId,
        args.reasonCode,
        args.note ?? null,
        args.actorUser,
        args.witnessUser,
      ],
    );
    correctionId = Number(correctionResult.lastInsertRowId);

    for (const item of items) {
      await db.runAsync(
        'UPDATE products SET quantity = quantity + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [item.quantity, item.product_id],
      );
      await db.runAsync(
        `INSERT INTO inventory_transactions
          (product_id, type, quantity, adjustment_sign, note)
         VALUES (?, 'adjustment', ?, 'positive', ?)`,
        [item.product_id, item.quantity, `void:${correctionId}`],
      );
    }

    if (sale.payment_type === 'cash') {
      const session = await db.getFirstAsync<{ id: string }>(
        `SELECT id FROM cash_sessions
         WHERE status = 'open'
           AND substr(?, 1, 10) = business_date
         LIMIT 1`,
        [sale.timestamp],
      );
      if (!session) throw new NoOpenCashSessionError();
      await db.runAsync(
        `INSERT INTO cash_entries (
          id, session_id, type, amount, notes, timestamp, created_at
        ) VALUES (?, ?, 'cash_refund', ?, ?, ?, ?)`,
        [
          Crypto.randomUUID(),
          session.id,
          sale.total,
          `void:${saleId}:${correctionId}`,
          getCurrentLocalTimestamp(),
          Date.now(),
        ],
      );
    } else {
      await db.runAsync(
        `UPDATE credit_transactions
         SET status = 'cancelled',
             cancelled_at = ?,
             cancelled_by_correction_id = ?
         WHERE id = ?`,
        [getCurrentLocalTimestamp(), correctionId, sale.credit_transaction_id],
      );
    }

    await db.runAsync(
      `UPDATE sales
       SET cancelled_at = ?,
           cancelled_by_kind = 'void',
           cancelled_by_correction_id = ?
       WHERE id = ?`,
      [getCurrentLocalTimestamp(), correctionId, saleId],
    );
  });
  return correctionId;
};

export const refundSale = async (
  saleId: number,
  args: CorrectionActor & { reasonCode: 'returned_damaged' | 'returned_other' },
): Promise<number> => {
  let correctionId = 0;
  await db.withTransactionAsync(async () => {
    const { sale, items } = await assertCanCorrectSale(saleId, 'refund');

    const correctionResult = await db.runAsync(
      `INSERT INTO sale_corrections (
        sale_id, kind, actor_reason_code, actor_note, actor_user, witness_user, refund_payment_type
      ) VALUES (?, 'refund', ?, ?, ?, ?, 'cash')`,
      [
        saleId,
        args.reasonCode,
        args.note ?? null,
        args.actorUser,
        args.witnessUser,
      ],
    );
    correctionId = Number(correctionResult.lastInsertRowId);

    for (const item of items) {
      await db.runAsync(
        'UPDATE products SET quantity = quantity + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [item.quantity, item.product_id],
      );
      await db.runAsync(
        `INSERT INTO inventory_transactions
          (product_id, type, quantity, adjustment_sign, note)
         VALUES (?, 'adjustment', ?, 'positive', ?)`,
        [
          item.product_id,
          item.quantity,
          `refund:${correctionId}:${args.reasonCode}`,
        ],
      );
    }

    if (sale.payment_type === 'cash') {
      const session = await db.getFirstAsync<{ id: string }>(
        `SELECT id FROM cash_sessions
         WHERE status = 'open'
           AND substr(?, 1, 10) = business_date
         LIMIT 1`,
        [sale.timestamp],
      );
      if (!session) throw new NoOpenCashSessionError();
      await db.runAsync(
        `INSERT INTO cash_entries (
          id, session_id, type, amount, notes, timestamp, created_at
        ) VALUES (?, ?, 'cash_refund', ?, ?, ?, ?)`,
        [
          Crypto.randomUUID(),
          session.id,
          sale.total,
          `refund:${saleId}:${correctionId}`,
          getCurrentLocalTimestamp(),
          Date.now(),
        ],
      );
    } else {
      await db.runAsync(
        `UPDATE credit_transactions
         SET status = 'cancelled',
             cancelled_at = ?,
             cancelled_by_correction_id = ?
         WHERE id = ?`,
        [getCurrentLocalTimestamp(), correctionId, sale.credit_transaction_id],
      );
    }

    await db.runAsync(
      `UPDATE sales
       SET cancelled_at = ?,
           cancelled_by_kind = 'refund',
           cancelled_by_correction_id = ?
       WHERE id = ?`,
      [getCurrentLocalTimestamp(), correctionId, saleId],
    );
  });
  return correctionId;
};

export const correctSalePrice = async (
  saleId: number,
  args: CorrectionActor & {
    priceChanges: { saleItemId: number; newPrice: number }[];
  },
): Promise<number> => {
  let correctionId = 0;
  await db.withTransactionAsync(async () => {
    const { sale, items } = await assertCanCorrectSale(
      saleId,
      'price_correction',
    );

    const correctionResult = await db.runAsync(
      `INSERT INTO sale_corrections (
        sale_id, kind, actor_reason_code, actor_note, actor_user, witness_user
      ) VALUES (?, 'price_correction', ?, ?, ?, ?)`,
      [
        saleId,
        args.reasonCode,
        args.note ?? null,
        args.actorUser,
        args.witnessUser,
      ],
    );
    correctionId = Number(correctionResult.lastInsertRowId);

    let totalDelta = 0;
    for (const change of args.priceChanges) {
      const item = items.find((i) => i.id === change.saleItemId);
      if (!item) continue;
      if (change.newPrice === item.price) continue;
      const priceDelta = change.newPrice - item.price;
      totalDelta += priceDelta * item.quantity;

      await db.runAsync(
        `INSERT INTO sale_correction_lines (
          correction_id, sale_item_id, old_price, new_price, price_delta
        ) VALUES (?, ?, ?, ?, ?)`,
        [
          correctionId,
          change.saleItemId,
          item.price,
          change.newPrice,
          priceDelta,
        ],
      );
      await db.runAsync('UPDATE sale_items SET price = ? WHERE id = ?', [
        change.newPrice,
        change.saleItemId,
      ]);
    }

    if (totalDelta === 0) {
      return;
    }

    // Recompute the sale total from the line items (price × quantity).
    const recomputed = await db.getFirstAsync<{ total: number }>(
      `SELECT COALESCE(SUM(price * quantity), 0) as total FROM sale_items WHERE sale_id = ?`,
      [saleId],
    );
    const newTotal = recomputed?.total ?? sale.total;
    await db.runAsync('UPDATE sales SET total = ? WHERE id = ?', [
      newTotal,
      saleId,
    ]);

    if (sale.payment_type === 'cash') {
      const session = await db.getFirstAsync<{ id: string }>(
        `SELECT id FROM cash_sessions
         WHERE status = 'open'
           AND substr(?, 1, 10) = business_date
         LIMIT 1`,
        [sale.timestamp],
      );
      if (!session) throw new NoOpenCashSessionError();

      if (totalDelta < 0) {
        await db.runAsync(
          `INSERT INTO cash_entries (id, session_id, type, amount, notes, timestamp, created_at)
           VALUES (?, ?, 'cash_refund', ?, ?, ?, ?)`,
          [
            Crypto.randomUUID(),
            session.id,
            -totalDelta,
            `price_correction:${saleId}:${correctionId}`,
            getCurrentLocalTimestamp(),
            Date.now(),
          ],
        );
      } else {
        await db.runAsync(
          `INSERT INTO cash_entries (id, session_id, type, amount, notes, timestamp, created_at)
           VALUES (?, ?, 'owner_addition', ?, ?, ?, ?)`,
          [
            Crypto.randomUUID(),
            session.id,
            totalDelta,
            `price_correction:${saleId}:${correctionId}`,
            getCurrentLocalTimestamp(),
            Date.now(),
          ],
        );
      }
    } else if (sale.credit_transaction_id) {
      // Credit case: amount = amount + totalDelta (lowering the debt
      // means reducing amount). The customer's running balance
      // recomputes live per project convention.
      await db.runAsync(
        'UPDATE credit_transactions SET amount = amount + ? WHERE id = ?',
        [totalDelta, sale.credit_transaction_id],
      );
    }
  });
  return correctionId;
};
