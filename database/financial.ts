import { db } from '../configs/sqlite';
import * as Crypto from 'expo-crypto';
import { Pesos } from '../lib/money';
import {
  ExpenseCategory,
  FinancialEntry,
  FinancialTotals,
  NewFinancialEntry,
  UpdateFinancialEntry,
} from '../types/financial.types';

const VALID_CATEGORIES: ExpenseCategory[] = [
  'transport',
  'utilities',
  'supplies_packaging',
  'rent',
  'repairs',
  'other',
];

const validateEntryData = (
  type: string,
  amount: number,
  businessDate: string,
  category: ExpenseCategory | null,
) => {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error('Amount must be positive whole pesos');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(businessDate)) {
    throw new Error('Invalid local business date format (expected YYYY-MM-DD)');
  }
  if (type === 'expense') {
    if (!category || !VALID_CATEGORIES.includes(category)) {
      throw new Error('Expense entries require an expense category');
    }
  } else if (type === 'owner_drawing') {
    if (category !== null) {
      throw new Error('Owner drawings must not have an expense category');
    }
  } else {
    throw new Error('Invalid entry type');
  }
};

export const initFinancialEntriesTable = async () => {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS financial_entries (
      id TEXT PRIMARY KEY,
      entry_type TEXT NOT NULL CHECK(entry_type IN ('expense', 'owner_drawing')),
      amount INTEGER NOT NULL CHECK(amount > 0),
      business_date TEXT NOT NULL,
      expense_category TEXT CHECK(expense_category IN ('transport', 'utilities', 'supplies_packaging', 'rent', 'repairs', 'other')),
      note TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      CHECK (
        (entry_type = 'expense' AND expense_category IS NOT NULL) OR
        (entry_type = 'owner_drawing' AND expense_category IS NULL)
      )
    );
    CREATE INDEX IF NOT EXISTS idx_financial_entries_date ON financial_entries(business_date);
  `);
};

export const listFinancialEntries = async (
  startDate: string,
  endDate: string,
): Promise<FinancialEntry[]> => {
  const rows = await db.getAllAsync<{
    id: string;
    entry_type: 'expense' | 'owner_drawing';
    amount: number;
    business_date: string;
    expense_category: ExpenseCategory | null;
    note: string | null;
    created_at: number;
    updated_at: number;
  }>(
    `SELECT * FROM financial_entries
     WHERE business_date BETWEEN ? AND ?
     ORDER BY business_date DESC, created_at DESC`,
    [startDate, endDate],
  );

  return rows.map((r) => ({
    id: r.id,
    type: r.entry_type,
    amount: r.amount as Pesos,
    businessDate: r.business_date,
    expenseCategory: r.expense_category,
    note: r.note,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
};

export const createFinancialEntry = async (
  entry: NewFinancialEntry,
): Promise<FinancialEntry> => {
  validateEntryData(
    entry.type,
    entry.amount,
    entry.businessDate,
    entry.expenseCategory,
  );

  const id = Crypto.randomUUID();
  const now = Date.now();

  await db.runAsync(
    `INSERT INTO financial_entries (
      id, entry_type, amount, business_date, expense_category, note, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      entry.type,
      entry.amount,
      entry.businessDate,
      entry.expenseCategory,
      entry.note ?? null,
      now,
      now,
    ],
  );

  return {
    id,
    type: entry.type,
    amount: entry.amount,
    businessDate: entry.businessDate,
    expenseCategory: entry.expenseCategory,
    note: entry.note ?? null,
    createdAt: now,
    updatedAt: now,
  };
};

export const updateFinancialEntry = async (
  id: string,
  entry: UpdateFinancialEntry,
): Promise<FinancialEntry> => {
  const existing = await db.getFirstAsync<{
    id: string;
    entry_type: 'expense' | 'owner_drawing';
    amount: number;
    business_date: string;
    expense_category: ExpenseCategory | null;
    note: string | null;
    created_at: number;
    updated_at: number;
  }>('SELECT * FROM financial_entries WHERE id = ?', [id]);

  if (!existing) {
    throw new Error('Financial entry not found');
  }

  const updatedType =
    entry.type !== undefined ? entry.type : existing.entry_type;
  const updatedAmount =
    entry.amount !== undefined ? entry.amount : (existing.amount as Pesos);
  const updatedBusinessDate =
    entry.businessDate !== undefined
      ? entry.businessDate
      : existing.business_date;
  const updatedExpenseCategory =
    entry.expenseCategory !== undefined
      ? entry.expenseCategory
      : existing.expense_category;
  const updatedNote =
    entry.note !== undefined ? entry.note : existing.note;

  validateEntryData(
    updatedType,
    updatedAmount,
    updatedBusinessDate,
    updatedExpenseCategory,
  );

  const now = Date.now();
  await db.runAsync(
    `UPDATE financial_entries
     SET entry_type = ?, amount = ?, business_date = ?, expense_category = ?, note = ?, updated_at = ?
     WHERE id = ?`,
    [
      updatedType,
      updatedAmount,
      updatedBusinessDate,
      updatedExpenseCategory,
      updatedNote ?? null,
      now,
      id,
    ],
  );

  return {
    id,
    type: updatedType,
    amount: updatedAmount,
    businessDate: updatedBusinessDate,
    expenseCategory: updatedExpenseCategory,
    note: updatedNote ?? null,
    createdAt: existing.created_at,
    updatedAt: now,
  };
};

export const deleteFinancialEntry = async (id: string): Promise<void> => {
  await db.runAsync('DELETE FROM financial_entries WHERE id = ?', [id]);
};

export const getFinancialTotals = async (
  startDate: string,
  endDate: string,
): Promise<FinancialTotals> => {
  const row = await db.getFirstAsync<{
    paid_expenses: number;
    owner_drawings: number;
  }>(
    `SELECT
       COALESCE(SUM(CASE WHEN entry_type = 'expense' THEN amount ELSE 0 END), 0) AS paid_expenses,
       COALESCE(SUM(CASE WHEN entry_type = 'owner_drawing' THEN amount ELSE 0 END), 0) AS owner_drawings
     FROM financial_entries
     WHERE business_date BETWEEN ? AND ?`,
    [startDate, endDate],
  );

  return {
    paidExpenses: (row?.paid_expenses ?? 0) as Pesos,
    ownerDrawings: (row?.owner_drawings ?? 0) as Pesos,
  };
};
