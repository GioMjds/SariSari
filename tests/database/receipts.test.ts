import { db } from '../../configs/sqlite';
import { runMigrations } from '../../database/migrations';
import { resetMockDb } from '../__setup__/expo-sqlite-mock';
import { createFinancialEntry, initFinancialEntriesTable } from '../../database/financial';
import { initProductsTable } from '../../database/products';
import { initInventoryTable } from '../../database/inventory';
import { initSalesTables } from '../../database/sales';
import { initCreditsTable } from '../../database/credits';
import { addEntryReceipt, listEntryReceipts, deleteEntryReceipt } from '../../database/receipts';
import { Pesos } from '../../lib/money';
import * as Crypto from 'expo-crypto';

describe('Financial Entry Receipts (Migration 13)', () => {
  let counter = 0;

  beforeAll(() => {
    (Crypto.randomUUID as any).mockImplementation(() => `uuid-${counter++}`);
  });

  beforeEach(async () => {
    resetMockDb();
    await initProductsTable();
    await initInventoryTable();
    await initSalesTables();
    await initCreditsTable();
    await initFinancialEntriesTable();
    await runMigrations();
  });

  test('allows receipts up to slot 4 only for expense entries', async () => {
    const expense = await createFinancialEntry({
      type: 'expense',
      amount: 100 as Pesos,
      businessDate: '2026-07-20',
      expenseCategory: 'transport',
    });

    const receipt = await addEntryReceipt(expense.id, 'receipts/rcpt-1.jpg', 0);
    expect(receipt.slot).toBe(0);

    const receipts = await listEntryReceipts(expense.id);
    expect(receipts).toHaveLength(1);

    const drawing = await createFinancialEntry({
      type: 'owner_drawing',
      amount: 500 as Pesos,
      businessDate: '2026-07-20',
      expenseCategory: null,
    });

    await expect(
      addEntryReceipt(drawing.id, 'receipts/rcpt-2.jpg', 0),
    ).rejects.toThrow('Receipts are allowed only for expense entries');
  });

  test('deletes receipt by id', async () => {
    const expense = await createFinancialEntry({
      type: 'expense',
      amount: 100 as Pesos,
      businessDate: '2026-07-20',
      expenseCategory: 'transport',
    });

    const receipt = await addEntryReceipt(expense.id, 'receipts/rcpt-1.jpg', 0);
    await deleteEntryReceipt(receipt.id);

    const receipts = await listEntryReceipts(expense.id);
    expect(receipts).toHaveLength(0);
  });
});
