import { InventoryTransaction } from '@/types/inventory.types';
import { db } from '../configs/sqlite';

export const initInventoryTable = async () => {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS inventory_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('restock', 'sale')),
      quantity INTEGER NOT NULL,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );
  `);
};

export const insertInventoryTransaction = async (
  product_id: number,
  type: 'restock' | 'sale',
  quantity: number
) => {
  const result = await db.runAsync(
    'INSERT INTO inventory_transactions (product_id, type, quantity) VALUES (?, ?, ?)',
    [product_id, type, quantity]
  );
  
  // Update product quantity
  const quantityChange = type === 'restock' ? quantity : -quantity;
  await db.runAsync(
    'UPDATE products SET quantity = quantity + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [quantityChange, product_id]
  );
  
  return result.lastInsertRowId;
};

export const getInventoryTransactions = async (product_id?: number): Promise<InventoryTransaction[]> => {
  if (product_id) {
    return await db.getAllAsync<InventoryTransaction>(
      'SELECT * FROM inventory_transactions WHERE product_id = ? ORDER BY timestamp DESC',
      [product_id]
    );
  }
  return await db.getAllAsync<InventoryTransaction>(
    'SELECT * FROM inventory_transactions ORDER BY timestamp DESC'
  );
};

export const getInventoryTransactionsByDateRange = async (
  startDate: string,
  endDate: string
): Promise<InventoryTransaction[]> => {
  return await db.getAllAsync<InventoryTransaction>(
    'SELECT * FROM inventory_transactions WHERE timestamp BETWEEN ? AND ? ORDER BY timestamp DESC',
    [startDate, endDate]
  );
};
