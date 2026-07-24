import { db } from '../configs/sqlite';
import * as Crypto from 'expo-crypto';

export interface FinancialReceipt {
  id: string;
  financialEntryId: string;
  relativePath: string;
  slot: number;
  createdAt: number;
}

export const addEntryReceipt = async (
  financialEntryId: string,
  relativePath: string,
  slot: number,
): Promise<FinancialReceipt> => {
  if (slot < 0 || slot > 4) {
    throw new Error('Receipt slot must be between 0 and 4');
  }

  const entry = await db.getFirstAsync<{ entry_type: string }>(
    'SELECT entry_type FROM financial_entries WHERE id = ?',
    [financialEntryId],
  );

  if (!entry) {
    throw new Error('Financial entry not found');
  }

  if (entry.entry_type !== 'expense') {
    throw new Error('Receipts are allowed only for expense entries');
  }

  const id = Crypto.randomUUID();
  const now = Date.now();

  await db.runAsync(
    `INSERT INTO financial_entry_receipts (
      id, financial_entry_id, relative_path, slot, created_at
    ) VALUES (?, ?, ?, ?, ?)`,
    [id, financialEntryId, relativePath, slot, now],
  );

  return {
    id,
    financialEntryId,
    relativePath,
    slot,
    createdAt: now,
  };
};

export const listEntryReceipts = async (
  financialEntryId: string,
): Promise<FinancialReceipt[]> => {
  const rows = await db.getAllAsync<{
    id: string;
    financial_entry_id: string;
    relative_path: string;
    slot: number;
    created_at: number;
  }>(
    `SELECT * FROM financial_entry_receipts
     WHERE financial_entry_id = ?
     ORDER BY slot ASC`,
    [financialEntryId],
  );

  return rows.map((r) => ({
    id: r.id,
    financialEntryId: r.financial_entry_id,
    relativePath: r.relative_path,
    slot: r.slot,
    createdAt: r.created_at,
  }));
};

export const deleteEntryReceipt = async (id: string): Promise<void> => {
  await db.runAsync('DELETE FROM financial_entry_receipts WHERE id = ?', [id]);
};
