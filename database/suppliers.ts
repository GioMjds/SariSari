import * as Crypto from 'expo-crypto';
import { Supplier, NewSupplier } from '@/types/suppliers.types';
import { db } from '../configs/sqlite';

export const initSuppliersTable = async () => {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS suppliers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      contact TEXT,
      notes TEXT,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);
  `);
};

interface SupplierRow {
  id: string;
  name: string;
  contact: string | null;
  notes: string | null;
  created_at: number;
}

function rowToSupplier(row: SupplierRow): Supplier {
  return {
    id: row.id,
    name: row.name,
    contact: row.contact,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

export const listSuppliers = async (): Promise<Supplier[]> => {
  const rows = await db.getAllAsync<SupplierRow>(
    'SELECT * FROM suppliers ORDER BY name',
  );
  return rows.map(rowToSupplier);
};

export const getSupplier = async (id: string): Promise<Supplier | null> => {
  const row = await db.getFirstAsync<SupplierRow>(
    'SELECT * FROM suppliers WHERE id = ?',
    [id],
  );
  return row ? rowToSupplier(row) : null;
};

export const createSupplier = async (input: NewSupplier): Promise<Supplier> => {
  const id = Crypto.randomUUID();
  const createdAt = Date.now();
  await db.runAsync(
    'INSERT INTO suppliers (id, name, contact, notes, created_at) VALUES (?, ?, ?, ?, ?)',
    [id, input.name, input.contact ?? null, input.notes ?? null, createdAt],
  );
  return { id, createdAt, ...input };
};

export const updateSupplier = async (
  id: string,
  patch: Partial<NewSupplier>,
): Promise<void> => {
  const current = await db.getFirstAsync<SupplierRow>(
    'SELECT * FROM suppliers WHERE id = ?',
    [id],
  );
  if (!current) {
    throw new Error(`Supplier with ID ${id} not found`);
  }

  const name = patch.name !== undefined ? patch.name : current.name;
  const contact = patch.contact !== undefined ? patch.contact : current.contact;
  const notes = patch.notes !== undefined ? patch.notes : current.notes;

  await db.runAsync(
    'UPDATE suppliers SET name = ?, contact = ?, notes = ? WHERE id = ?',
    [name, contact ?? null, notes ?? null, id],
  );
};

export const deleteSupplier = async (id: string): Promise<void> => {
  await db.runAsync('DELETE FROM suppliers WHERE id = ?', [id]);
};
