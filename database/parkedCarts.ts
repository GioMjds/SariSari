import type { SQLiteDatabase } from 'expo-sqlite';
import type { NewSaleItem } from '@/types';

export interface ParkedCartRow {
  id: number;
  label: string;
  customer_id: number | null;
  customer_name: string | null;
  payment_type: 'cash' | 'credit';
  payload_json: string;
  created_at: string;
  expires_at: string;
}

export interface ParkedCart {
  id: number;
  label: string;
  customerId: number | null;
  customerName: string | null;
  paymentType: 'cash' | 'credit';
  cartItems: NewSaleItem[];
  createdAt: string;
  expiresAt: string;
}

export interface ParkCartInput {
  label: string;
  customer_id?: number | null;
  customer_name?: string | null;
  payment_type: 'cash' | 'credit';
  cartItems: NewSaleItem[];
}

export async function ensureParkedCartsTable(
  db: SQLiteDatabase,
): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS parked_carts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      label TEXT NOT NULL,
      customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
      customer_name TEXT,
      payment_type TEXT NOT NULL DEFAULT 'cash',
      payload_json TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      expires_at TEXT NOT NULL
    );
  `);
}

export async function getParkedCarts(
  db: SQLiteDatabase,
): Promise<ParkedCart[]> {
  await ensureParkedCartsTable(db);
  await cleanupExpiredCarts(db);

  const rows = await db.getAllAsync<ParkedCartRow>(
    `SELECT * FROM parked_carts 
     WHERE datetime(expires_at) > datetime('now')
     ORDER BY datetime(created_at) DESC;`,
  );

  return rows.map((row) => ({
    id: row.id,
    label: row.label,
    customerId: row.customer_id,
    customerName: row.customer_name,
    paymentType: row.payment_type,
    cartItems: JSON.parse(row.payload_json) as NewSaleItem[],
    createdAt: row.created_at,
    expiresAt: row.expires_at,
  }));
}

export async function parkCart(
  db: SQLiteDatabase,
  input: ParkCartInput,
): Promise<number> {
  await ensureParkedCartsTable(db);

  if (!input.cartItems || input.cartItems.length === 0) {
    throw new Error('Cannot park an empty cart.');
  }

  const existing = await getParkedCarts(db);
  if (existing.length >= 3) {
    throw new Error('Maximum limit of 3 parked carts reached.');
  }

  // Expires in 24 hours by default
  const now = new Date();
  const expires = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

  const result = await db.runAsync(
    `INSERT INTO parked_carts (label, customer_id, customer_name, payment_type, payload_json, expires_at)
     VALUES (?, ?, ?, ?, ?, ?);`,
    [
      input.label,
      input.customer_id ?? null,
      input.customer_name ?? null,
      input.payment_type,
      JSON.stringify(input.cartItems),
      expires,
    ],
  );

  return result.lastInsertRowId;
}

export async function swapParkedCart(
  db: SQLiteDatabase,
  parkInput: ParkCartInput,
  discardId: number,
): Promise<{ newParkedId: number }> {
  await ensureParkedCartsTable(db);

  if (!parkInput.cartItems || parkInput.cartItems.length === 0) {
    throw new Error('Cannot park an empty cart.');
  }

  let newParkedId = 0;
  await db.withTransactionAsync(async () => {
    await discardParkedCart(db, discardId);

    const existing = await getParkedCarts(db);
    if (existing.length >= 3) {
      throw new Error('Maximum limit of 3 parked carts reached.');
    }

    const now = new Date();
    const expires = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

    const result = await db.runAsync(
      `INSERT INTO parked_carts (label, customer_id, customer_name, payment_type, payload_json, expires_at)
       VALUES (?, ?, ?, ?, ?, ?);`,
      [
        parkInput.label,
        parkInput.customer_id ?? null,
        parkInput.customer_name ?? null,
        parkInput.payment_type,
        JSON.stringify(parkInput.cartItems),
        expires,
      ],
    );

    newParkedId = result.lastInsertRowId;
  });

  return { newParkedId };
}

export async function discardParkedCart(
  db: SQLiteDatabase,
  id: number,
): Promise<void> {
  await ensureParkedCartsTable(db);
  await db.runAsync('DELETE FROM parked_carts WHERE id = ?;', [id]);
}

export async function cleanupExpiredCarts(db: SQLiteDatabase): Promise<void> {
  await ensureParkedCartsTable(db);
  await db.runAsync(
    "DELETE FROM parked_carts WHERE datetime(expires_at) <= datetime('now');",
  );
}
