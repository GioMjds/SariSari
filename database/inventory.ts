import { InsertInventoryV2, InventoryTransaction } from '@/types/inventory.types';
import { db } from '../configs/sqlite';

export const initInventoryTable = async () => {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS inventory_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('restock', 'sale', 'damaged', 'adjustment')),
      quantity INTEGER NOT NULL,
      note TEXT,
      adjustment_sign TEXT,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id),
      CHECK(
        (type = 'adjustment' AND adjustment_sign IN ('positive', 'negative')) OR
        (type != 'adjustment' AND adjustment_sign IS NULL)
      )
    );
  `);
};

export const insertInventoryTransaction = async (tx: InsertInventoryV2) => {
  const { product_id, type, quantity, note = null, adjustment_sign = null } = tx;

  if (quantity <= 0) {
    throw new Error('Quantity must be greater than 0');
  }
  if (type === 'adjustment' && !adjustment_sign) {
    throw new Error('Adjustment transactions must specify adjustment_sign');
  }
  if (type !== 'adjustment' && adjustment_sign) {
    throw new Error('Non-adjustment transactions must not specify adjustment_sign');
  }

  let insertedId = 0;
  await db.withTransactionAsync(async () => {
    // 1. Check product existence and current quantity
    const product = await db.getFirstAsync<{ quantity: number }>(
      'SELECT quantity FROM products WHERE id = ?',
      [product_id]
    );

    if (!product) {
      throw new Error(`Product with ID ${product_id} not found`);
    }

    // 2. Determine quantity change
    let quantityChange = 0;
    if (type === 'restock') {
      quantityChange = quantity;
    } else if (type === 'sale' || type === 'damaged') {
      quantityChange = -quantity;
    } else if (type === 'adjustment') {
      quantityChange = adjustment_sign === 'positive' ? quantity : -quantity;
    }

    const newQuantity = product.quantity + quantityChange;
    if (newQuantity < 0) {
      throw new Error("Can't go below zero.");
    }

    // 3. Insert into inventory_transactions
    const result = await db.runAsync(
      'INSERT INTO inventory_transactions (product_id, type, quantity, note, adjustment_sign) VALUES (?, ?, ?, ?, ?)',
      [product_id, type, quantity, note, adjustment_sign],
    );

    // 4. Update products table
    await db.runAsync(
      'UPDATE products SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newQuantity, product_id],
    );

    insertedId = result.lastInsertRowId;
  });

  return insertedId;
};

export const getInventoryTransactions = async (
  product_id?: number,
): Promise<InventoryTransaction[]> => {
  if (product_id) {
    return await db.getAllAsync<InventoryTransaction>(
      'SELECT * FROM inventory_transactions WHERE product_id = ? ORDER BY timestamp DESC',
      [product_id],
    );
  }
  return await db.getAllAsync<InventoryTransaction>(
    'SELECT * FROM inventory_transactions ORDER BY timestamp DESC',
  );
};

export const getInventoryTransactionsByDateRange = async (
  startDate: string,
  endDate: string,
): Promise<InventoryTransaction[]> => {
  return await db.getAllAsync<InventoryTransaction>(
    'SELECT * FROM inventory_transactions WHERE timestamp BETWEEN ? AND ? ORDER BY timestamp DESC',
    [startDate, endDate],
  );
};

export const getInventoryTransactionsByProductAndDateRange = async (
  product_id: number,
  startDate: string,
  endDate: string,
): Promise<InventoryTransaction[]> => {
  return await db.getAllAsync<InventoryTransaction>(
    'SELECT * FROM inventory_transactions WHERE product_id = ? AND timestamp BETWEEN ? AND ? ORDER BY timestamp DESC',
    [product_id, startDate, endDate],
  );
};
