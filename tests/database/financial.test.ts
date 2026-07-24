import { db } from '../../configs/sqlite';
import {
  initFinancialEntriesTable,
  createFinancialEntry,
  listFinancialEntries,
  updateFinancialEntry,
  deleteFinancialEntry,
  getFinancialTotals,
} from '../../database/financial';
import { initProductsTable } from '../../database/products';
import { initInventoryTable } from '../../database/inventory';
import { initSalesTables } from '../../database/sales';
import { initCreditsTable } from '../../database/credits';
import { runMigrations } from '../../database/migrations';
import { resetMockDb } from '../__setup__/expo-sqlite-mock';
import { Pesos } from '../../lib/money';

import * as Crypto from 'expo-crypto';

describe('Financial Database Operations', () => {
  beforeAll(async () => {
    let counter = 0;
    (Crypto.randomUUID as any).mockImplementation(
      () => `financial-uuid-${counter++}`,
    );
  });

  beforeEach(async () => {
    resetMockDb();
    await initProductsTable();
    await initInventoryTable();
    await initSalesTables();
    await initCreditsTable();
    await initFinancialEntriesTable();
    await runMigrations();
    await db.runAsync('DELETE FROM financial_entries');
  });

  test('createFinancialEntry creates expense entry and validates inputs', async () => {
    const entry = await createFinancialEntry({
      type: 'expense',
      amount: 150 as Pesos,
      businessDate: '2026-07-24',
      expenseCategory: 'transport',
      note: 'Jeepney fare to market',
    });

    expect(entry.id).toBeDefined();
    expect(entry.type).toBe('expense');
    expect(entry.amount).toBe(150);
    expect(entry.businessDate).toBe('2026-07-24');
    expect(entry.expenseCategory).toBe('transport');
    expect(entry.note).toBe('Jeepney fare to market');
  });

  test('createFinancialEntry throws on invalid amount or category', async () => {
    await expect(
      createFinancialEntry({
        type: 'expense',
        amount: -50 as Pesos,
        businessDate: '2026-07-24',
        expenseCategory: 'transport',
        note: null,
      }),
    ).rejects.toThrow('Amount must be positive whole pesos');

    await expect(
      createFinancialEntry({
        type: 'expense',
        amount: 100 as Pesos,
        businessDate: '2026-07-24',
        expenseCategory: null,
        note: null,
      }),
    ).rejects.toThrow('Expense entries require an expense category');

    await expect(
      createFinancialEntry({
        type: 'owner_drawing',
        amount: 100 as Pesos,
        businessDate: '2026-07-24',
        expenseCategory: 'other',
        note: null,
      }),
    ).rejects.toThrow('Owner drawings must not have an expense category');
  });

  test('listFinancialEntries filters by date range', async () => {
    await createFinancialEntry({
      type: 'expense',
      amount: 200 as Pesos,
      businessDate: '2026-07-20',
      expenseCategory: 'utilities',
      note: null,
    });
    await createFinancialEntry({
      type: 'owner_drawing',
      amount: 500 as Pesos,
      businessDate: '2026-07-24',
      expenseCategory: null,
      note: 'Personal withdrawal',
    });

    const entries = await listFinancialEntries('2026-07-24', '2026-07-25');
    expect(entries).toHaveLength(1);
    expect(entries[0].type).toBe('owner_drawing');
    expect(entries[0].amount).toBe(500);
  });

  test('updateFinancialEntry supports partial updates and maintains integrity', async () => {
    const created = await createFinancialEntry({
      type: 'expense',
      amount: 100 as Pesos,
      businessDate: '2026-07-24',
      expenseCategory: 'rent',
      note: 'Deposit',
    });

    const updated = await updateFinancialEntry(created.id, {
      amount: 120 as Pesos,
      note: 'Updated Deposit',
    });

    expect(updated.amount).toBe(120);
    expect(updated.note).toBe('Updated Deposit');
    expect(updated.type).toBe('expense');
    expect(updated.expenseCategory).toBe('rent');
  });

  test('updateFinancialEntry throws if ID not found', async () => {
    await expect(
      updateFinancialEntry('non-existent-id', { amount: 50 as Pesos }),
    ).rejects.toThrow('Financial entry not found');
  });

  test('deleteFinancialEntry removes the record', async () => {
    const created = await createFinancialEntry({
      type: 'expense',
      amount: 80 as Pesos,
      businessDate: '2026-07-24',
      expenseCategory: 'other',
      note: null,
    });

    await deleteFinancialEntry(created.id);
    const entries = await listFinancialEntries('2026-07-01', '2026-07-31');
    expect(entries.find((e) => e.id === created.id)).toBeUndefined();
  });

  test('getFinancialTotals calculates correct sums for expenses and drawings', async () => {
    await createFinancialEntry({
      type: 'expense',
      amount: 150 as Pesos,
      businessDate: '2026-07-24',
      expenseCategory: 'transport',
      note: null,
    });
    await createFinancialEntry({
      type: 'expense',
      amount: 250 as Pesos,
      businessDate: '2026-07-24',
      expenseCategory: 'utilities',
      note: null,
    });
    await createFinancialEntry({
      type: 'owner_drawing',
      amount: 1000 as Pesos,
      businessDate: '2026-07-24',
      expenseCategory: null,
      note: null,
    });

    const totals = await getFinancialTotals('2026-07-01', '2026-07-31');
    expect(totals.paidExpenses).toBe(400);
    expect(totals.ownerDrawings).toBe(1000);
  });
});
