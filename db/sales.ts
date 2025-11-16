import { db } from '../configs/sqlite';

export interface Sale {
  id: number;
  total: number;
  timestamp: string;
  payment_type: 'cash' | 'credit';
  customer_name?: string;
  customer_credit_id?: number;
}

export interface SaleItem {
  id: number;
  sale_id: number;
  product_id: number;
  quantity: number;
  price: number;
}

export interface SaleItemWithProduct extends SaleItem {
  product_name: string;
}

export interface SaleWithItems extends Sale {
  items: SaleItemWithProduct[];
  items_count: number;
}

export const initSalesTables = async () => {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      total REAL NOT NULL,
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
      price REAL NOT NULL,
      FOREIGN KEY (sale_id) REFERENCES sales(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );
  `);
};

export const insertSale = async (
  items: { product_id: number; quantity: number; price: number }[],
  payment_type: 'cash' | 'credit' = 'cash',
  customer_name?: string,
  customer_credit_id?: number
) => {
  const total = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
  
  // Insert sale
  const saleResult = await db.runAsync(
    'INSERT INTO sales (total, payment_type, customer_name, customer_credit_id) VALUES (?, ?, ?, ?)',
    [total, payment_type, customer_name || null, customer_credit_id || null]
  );
  const saleId = saleResult.lastInsertRowId;
  
  // If credit sale, update customer credit
  if (payment_type === 'credit' && customer_credit_id) {
    await db.runAsync(
      'UPDATE customer_credits SET amount_owed = amount_owed + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [total, customer_credit_id]
    );
  }
  
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
  
  const items = await db.getAllAsync<SaleItemWithProduct>(
    `SELECT si.*, p.name as product_name 
     FROM sale_items si 
     JOIN products p ON si.product_id = p.id 
     WHERE si.sale_id = ?`,
    [id]
  );
  
  return { ...sale, items, items_count: items.length };
};

export const getAllSales = async (): Promise<SaleWithItems[]> => {
  const sales = await db.getAllAsync<Sale>('SELECT * FROM sales ORDER BY timestamp DESC');
  
  const salesWithItems = await Promise.all(
    sales.map(async (sale) => {
      const items = await db.getAllAsync<SaleItemWithProduct>(
        `SELECT si.*, p.name as product_name 
         FROM sale_items si 
         JOIN products p ON si.product_id = p.id 
         WHERE si.sale_id = ?`,
        [sale.id]
      );
      return { ...sale, items, items_count: items.length };
    })
  );
  
  return salesWithItems;
};

export const getSalesByDateRange = async (startDate: string, endDate: string): Promise<SaleWithItems[]> => {
  const sales = await db.getAllAsync<Sale>(
    'SELECT * FROM sales WHERE timestamp BETWEEN ? AND ? ORDER BY timestamp DESC',
    [startDate, endDate]
  );
  
  const salesWithItems = await Promise.all(
    sales.map(async (sale) => {
      const items = await db.getAllAsync<SaleItemWithProduct>(
        `SELECT si.*, p.name as product_name 
         FROM sale_items si 
         JOIN products p ON si.product_id = p.id 
         WHERE si.sale_id = ?`,
        [sale.id]
      );
      return { ...sale, items, items_count: items.length };
    })
  );
  
  return salesWithItems;
};

export const getSaleItems = async (sale_id: number): Promise<SaleItemWithProduct[]> => {
  return await db.getAllAsync<SaleItemWithProduct>(
    `SELECT si.*, p.name as product_name 
     FROM sale_items si 
     JOIN products p ON si.product_id = p.id 
     WHERE si.sale_id = ?`,
    [sale_id]
  );
};

export const getTodayStats = async () => {
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  
  const stats = await db.getFirstAsync<{ 
    total: number; 
    items_sold: number; 
    credit_sales: number 
  }>(
    `SELECT 
      COALESCE(SUM(total), 0) as total,
      COALESCE(SUM((SELECT SUM(quantity) FROM sale_items WHERE sale_id = sales.id)), 0) as items_sold,
      COALESCE(SUM(CASE WHEN payment_type = 'credit' THEN 1 ELSE 0 END), 0) as credit_sales
     FROM sales 
     WHERE timestamp >= ? AND timestamp < ?`,
    [today, tomorrow]
  );
  
  return stats || { total: 0, items_sold: 0, credit_sales: 0 };
};

export const deleteSale = async (id: number) => {
  // Get sale items first to restore inventory
  const items = await getSaleItems(id);
  
  // Restore product quantities
  for (const item of items) {
    await db.runAsync(
      'UPDATE products SET quantity = quantity + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [item.quantity, item.product_id]
    );
  }
  
  // Delete sale items
  await db.runAsync('DELETE FROM sale_items WHERE sale_id = ?', [id]);
  
  // Delete sale
  await db.runAsync('DELETE FROM sales WHERE id = ?', [id]);
};
