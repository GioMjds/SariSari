import type {
  PriceChange,
  PriceChangeSource,
  PriceField,
  RepriceFlag,
} from '@/types/pricing.types';
import { db } from '../configs/sqlite';

export class InvalidRepriceError extends Error {
  constructor(public readonly price: number) {
    super('Price must be a number greater than zero');
    this.name = 'InvalidRepriceError';
  }
}

/**
 * Appends one history row when the value changed. Does NOT open a
 * transaction: callers run this inside their own db.withTransactionAsync so
 * history commits or rolls back with the product update.
 */
export const recordPriceChange = async (
  productId: number,
  field: PriceField,
  oldValue: number | null,
  newValue: number,
  source: PriceChangeSource,
  receiptId: number | null = null,
): Promise<boolean> => {
  if (oldValue === newValue) return false;
  await db.runAsync(
    `INSERT INTO product_price_changes
       (product_id, field, old_value, new_value, source, receipt_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      productId,
      field,
      oldValue,
      newValue,
      source,
      receiptId,
      new Date().toISOString(),
    ],
  );
  return true;
};

/** Removes a flag if present. Does NOT open a transaction. */
export const clearRepriceFlag = async (productId: number): Promise<void> => {
  await db.runAsync('DELETE FROM reprice_flags WHERE product_id = ?', [
    productId,
  ]);
};

/**
 * Applies the flag rules after a cost change. Call only when the cost
 * actually changed. Does NOT open a transaction.
 *
 * - No flag yet: flag only when there was a previous cost and it rose.
 * - Flag exists, cost still above the baseline: keep the baseline cost and
 *   price, track the latest cost.
 * - Flag exists, cost back at or under the baseline: remove the flag.
 */
export const evaluateRepriceFlag = async (
  productId: number,
  oldCost: number | null,
  newCost: number,
  currentPrice: number,
  receiptId: number | null = null,
): Promise<void> => {
  const existing = await db.getFirstAsync<{ baseline_cost: number }>(
    'SELECT baseline_cost FROM reprice_flags WHERE product_id = ?',
    [productId],
  );

  if (existing) {
    if (newCost > existing.baseline_cost) {
      await db.runAsync(
        'UPDATE reprice_flags SET new_cost = ?, receipt_id = ? WHERE product_id = ?',
        [newCost, receiptId, productId],
      );
    } else {
      await clearRepriceFlag(productId);
    }
    return;
  }

  if (oldCost === null || newCost <= oldCost) return;

  await db.runAsync(
    `INSERT INTO reprice_flags
       (product_id, baseline_cost, new_cost, price_at_flag, receipt_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      productId,
      oldCost,
      newCost,
      currentPrice,
      receiptId,
      new Date().toISOString(),
    ],
  );
};

interface FlagRow {
  product_id: number;
  product_name: string;
  baseline_cost: number;
  new_cost: number;
  price_at_flag: number;
  current_price: number;
  receipt_id: number | null;
  created_at: string;
}

const FLAG_SELECT = `
  SELECT f.product_id, p.name AS product_name, f.baseline_cost, f.new_cost,
         f.price_at_flag, p.price AS current_price, f.receipt_id, f.created_at
  FROM reprice_flags f
  JOIN products p ON p.id = f.product_id`;

const mapFlag = (r: FlagRow): RepriceFlag => ({
  productId: r.product_id,
  productName: r.product_name,
  baselineCost: r.baseline_cost,
  newCost: r.new_cost,
  priceAtFlag: r.price_at_flag,
  currentPrice: r.current_price,
  receiptId: r.receipt_id,
  createdAt: r.created_at,
});

export const getRepriceFlags = async (): Promise<RepriceFlag[]> => {
  const rows = await db.getAllAsync<FlagRow>(
    `${FLAG_SELECT} ORDER BY f.created_at DESC, f.product_id DESC`,
  );
  return rows.map(mapFlag);
};

export const getRepriceFlagsForReceipt = async (
  receiptId: number,
): Promise<RepriceFlag[]> => {
  const rows = await db.getAllAsync<FlagRow>(
    `${FLAG_SELECT} WHERE f.receipt_id = ? ORDER BY p.name COLLATE NOCASE, f.product_id`,
    [receiptId],
  );
  return rows.map(mapFlag);
};

interface ChangeRow {
  id: number;
  product_id: number;
  field: PriceField;
  old_value: number | null;
  new_value: number;
  source: PriceChangeSource;
  receipt_id: number | null;
  created_at: string;
}

export const getPriceHistory = async (
  productId: number,
  limit: number = 10,
): Promise<PriceChange[]> => {
  const rows = await db.getAllAsync<ChangeRow>(
    `SELECT id, product_id, field, old_value, new_value, source, receipt_id, created_at
     FROM product_price_changes
     WHERE product_id = ?
     ORDER BY created_at DESC, id DESC
     LIMIT ?`,
    [productId, Math.max(1, Math.floor(limit))],
  );
  return rows.map((r) => ({
    id: r.id,
    productId: r.product_id,
    field: r.field,
    oldValue: r.old_value,
    newValue: r.new_value,
    source: r.source,
    receiptId: r.receipt_id,
    createdAt: r.created_at,
  }));
};

/** "Keep price": the owner accepts the current price at the new cost. */
export const dismissRepriceFlag = async (productId: number): Promise<void> => {
  await clearRepriceFlag(productId);
};

/**
 * Sets a new selling price chosen by the owner, records it, and clears the
 * flag, in one transaction. A price below cost is allowed: the owner decides.
 */
export const applyReprice = async (
  productId: number,
  newPrice: number,
): Promise<void> => {
  if (!Number.isFinite(newPrice) || newPrice <= 0) {
    throw new InvalidRepriceError(newPrice);
  }
  await db.withTransactionAsync(async () => {
    const product = await db.getFirstAsync<{ price: number }>(
      'SELECT price FROM products WHERE id = ?',
      [productId],
    );
    if (!product) {
      throw new Error(`Product with ID ${productId} not found`);
    }
    await db.runAsync(
      'UPDATE products SET price = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newPrice, productId],
    );
    await recordPriceChange(
      productId,
      'price',
      product.price,
      newPrice,
      'reprice',
    );
    await clearRepriceFlag(productId);
  });
};
