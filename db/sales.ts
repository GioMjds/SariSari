import { db } from '../configs/sqlite';

export interface Sale {
  id: number;
  total: number;
  timestamp: string;
}

export interface SaleItem {
  id: number;
  sale_id: number;
  product_id: number;
  quantity: number;
  price: number;
}

export interface SaleWithItems extends Sale {
  items: SaleItem[];
}

export const initSalesTables = async () => {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      total REAL NOT NULL,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      FOREIGN KEY (sale_id) REFERENCES sales(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );
  `);
};

export const insertSale = async (items: { product_id: number; quantity: number; price: number }[]) => {
  const total = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
  
  // Insert sale
  const saleResult = await db.runAsync(
    'INSERT INTO sales (total) VALUES (?)',
    [total]
  );
  const saleId = saleResult.lastInsertRowId;
  
  // Insert sale items and update inventory
  for (const item of items) {
    await db.runAsync(
      'INSERT INTO sale_items (sale_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
      [saleId, item.product_id, item.quantity, item.price]
    );
    
    // Update product quantity
    await db.runAsync(
      'UPDATE products SET quantity = quantity - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [item.quantity, item.product_id]
    );
    
    // Record inventory transaction
    await db.runAsync(
      'INSERT INTO inventory_transactions (product_id, type, quantity) VALUES (?, ?, ?)',
      [item.product_id, 'sale', item.quantity]
    );
  }
  
  return saleId;
};

export const getSale = async (id: number): Promise<SaleWithItems | null> => {
  const sale = await db.getFirstAsync<Sale>('SELECT * FROM sales WHERE id = ?', [id]);
  if (!sale) return null;
  
  const items = await db.getAllAsync<SaleItem>(
    'SELECT * FROM sale_items WHERE sale_id = ?',
    [id]
  );
  
  return { ...sale, items };
};

export const getAllSales = async (): Promise<Sale[]> => {
  return await db.getAllAsync<Sale>('SELECT * FROM sales ORDER BY timestamp DESC');
};

export const getSalesByDateRange = async (startDate: string, endDate: string): Promise<Sale[]> => {
  return await db.getAllAsync<Sale>(
    'SELECT * FROM sales WHERE timestamp BETWEEN ? AND ? ORDER BY timestamp DESC',
    [startDate, endDate]
  );
};

export const getSaleItems = async (sale_id: number): Promise<SaleItem[]> => {
  return await db.getAllAsync<SaleItem>(
    'SELECT * FROM sale_items WHERE sale_id = ?',
    [sale_id]
  );
};
