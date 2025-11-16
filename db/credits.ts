import { db } from '../configs/sqlite';

export interface CustomerCredit {
  id: number;
  customer_name: string;
  amount_owed: number;
  last_payment: string | null;
  created_at: string;
  updated_at: string;
}

export const initCreditsTable = async () => {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS customer_credits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_name TEXT NOT NULL,
      amount_owed REAL NOT NULL DEFAULT 0,
      last_payment TEXT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
};

export const insertCustomerCredit = async (customer_name: string, amount_owed: number = 0) => {
  const result = await db.runAsync(
    'INSERT INTO customer_credits (customer_name, amount_owed) VALUES (?, ?)',
    [customer_name, amount_owed]
  );
  return result.lastInsertRowId;
};

export const updateCustomerCredit = async (id: number, customer_name: string, amount_owed: number) => {
  await db.runAsync(
    'UPDATE customer_credits SET customer_name = ?, amount_owed = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [customer_name, amount_owed, id]
  );
};

export const addCreditAmount = async (id: number, amount: number) => {
  await db.runAsync(
    'UPDATE customer_credits SET amount_owed = amount_owed + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [amount, id]
  );
};

export const recordPayment = async (id: number, payment_amount: number) => {
  await db.runAsync(
    'UPDATE customer_credits SET amount_owed = amount_owed - ?, last_payment = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [payment_amount, id]
  );
};

export const deleteCustomerCredit = async (id: number) => {
  await db.runAsync('DELETE FROM customer_credits WHERE id = ?', [id]);
};

export const getCustomerCredit = async (id: number): Promise<CustomerCredit | null> => {
  const result = await db.getFirstAsync<CustomerCredit>('SELECT * FROM customer_credits WHERE id = ?', [id]);
  return result || null;
};

export const getAllCustomerCredits = async (): Promise<CustomerCredit[]> => {
  return await db.getAllAsync<CustomerCredit>('SELECT * FROM customer_credits ORDER BY customer_name');
};

export const getCustomersWithOutstandingCredit = async (): Promise<CustomerCredit[]> => {
  return await db.getAllAsync<CustomerCredit>(
    'SELECT * FROM customer_credits WHERE amount_owed > 0 ORDER BY amount_owed DESC'
  );
};
