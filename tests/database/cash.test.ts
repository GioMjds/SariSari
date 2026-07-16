import { db } from '../../configs/sqlite';
import { initProductsTable } from '../../database/products';
import { initSalesTables } from '../../database/sales';
import { initCreditsTable } from '../../database/credits';
import { initInventoryTable } from '../../database/inventory';
import { runMigrations } from '../../database/migrations';
import { resetMockDb } from '../__setup__/expo-sqlite-mock';
import {
  initCashTables,
  openSession,
  closeSession,
  insertCashEntry,
  deleteCashEntry,
  getCurrentSession,
  getCashSessionSummary,
  listCashSessions,
  listCashEntries,
} from '../../database/cash';
import * as Crypto from 'expo-crypto';

describe('Cash Control Database Operations', () => {
  beforeAll(async () => {
    resetMockDb();
    await initProductsTable();
    await initInventoryTable();
    await initSalesTables();
    await initCreditsTable();
    await initCashTables();
    await runMigrations();

    let counter = 0;
    (Crypto.randomUUID as any).mockImplementation(() => `uuid-${counter++}`);
  });

  beforeEach(async () => {
    await db.runAsync('DELETE FROM cash_entries');
    await db.runAsync('DELETE FROM cash_sessions');
    await db.runAsync('DELETE FROM sales');
    await db.runAsync('DELETE FROM payments');
    await db.runAsync('DELETE FROM customers');
  });

  test('openSession creates open cash session', async () => {
    const session = await openSession(1000);
    expect(session.openingCash).toBe(1000);
    expect(session.status).toBe('open');
    expect(session.actualCash).toBeNull();
    expect(session.expectedCash).toBeNull();
    expect(session.variance).toBeNull();
    expect(session.closingTimestamp).toBeNull();

    const current = await getCurrentSession();
    expect(current).toBeDefined();
    expect(current?.id).toBe(session.id);
    expect(current?.status).toBe('open');
  });

  test('cannot open session twice on same day due to unique constraint', async () => {
    await openSession(1000);
    await expect(openSession(2000)).rejects.toThrow();
  });

  test('expected cash math including post-open, credit, legacy, and post-close exclusions', async () => {
    const session = await openSession(1000);
    const tOpen = session.openingTimestamp;

    // Create helper timestamps
    const tBefore = new Date(new Date(tOpen).getTime() - 10000).toISOString();
    const tAfter = tOpen; // Exact same time as session start

    // Setup: We need a customer for payments FK
    await db.runAsync("INSERT INTO customers (id, name) VALUES (1, 'Suki Test')");

    // 1. Sales setup
    // Included: cash sale after open
    await db.runAsync(
      "INSERT INTO sales (total, payment_type, timestamp) VALUES (?, 'cash', ?)",
      [200, tAfter]
    );
    // Excluded: cash sale before open
    await db.runAsync(
      "INSERT INTO sales (total, payment_type, timestamp) VALUES (?, 'cash', ?)",
      [100, tBefore]
    );
    // Excluded: credit sale after open
    await db.runAsync(
      "INSERT INTO sales (total, payment_type, timestamp) VALUES (?, 'credit', ?)",
      [300, tAfter]
    );

    // 2. Payments setup
    // Included: cash payment after open
    await db.runAsync(
      "INSERT INTO payments (customer_id, amount, payment_method, date) VALUES (1, ?, 'cash', ?)",
      [150, tAfter]
    );
    // Excluded: cash payment before open
    await db.runAsync(
      "INSERT INTO payments (customer_id, amount, payment_method, date) VALUES (1, ?, 'cash', ?)",
      [50, tBefore]
    );
    // Excluded: non-cash payment (GCash) after open
    await db.runAsync(
      "INSERT INTO payments (customer_id, amount, payment_method, date) VALUES (1, ?, 'gcash', ?)",
      [250, tAfter]
    );
    // Excluded: legacy blank/null payment method after open
    await db.runAsync(
      "INSERT INTO payments (customer_id, amount, payment_method, date) VALUES (1, ?, NULL, ?)",
      [75, tAfter]
    );

    // 3. Cash Entries setup (manual transactions)
    await insertCashEntry(session.id, {
      type: 'owner_addition',
      amount: 500,
      notes: 'Added change drawer bills',
    });
    await insertCashEntry(session.id, {
      type: 'expense',
      amount: 120,
      notes: 'Paid for ice delivery',
    });
    await insertCashEntry(session.id, {
      type: 'owner_drawing',
      amount: 300,
      notes: 'Owner personal cash draw',
    });

    // expected = openingCash (1000) + cashSales (200) + cashUtangPayments (150) + ownerAdditions (500) - expenses (120) - ownerDrawings (300) = 1430
    let summary = await getCashSessionSummary(session.id);
    expect(summary.cashSales).toBe(200);
    expect(summary.cashUtangPayments).toBe(150);
    expect(summary.ownerAdditions).toBe(500);
    expect(summary.expenses).toBe(120);
    expect(summary.ownerDrawings).toBe(300);
    expect(summary.expectedCash).toBe(1430);

    // Close session with actual cash count of 1400 (variance should be 1400 - 1430 = -30)
    await closeSession(session.id, 1400);

    const closedSession = (await getCurrentSession())!;
    expect(closedSession.status).toBe('closed');
    expect(closedSession.actualCash).toBe(1400);
    expect(closedSession.expectedCash).toBe(1430);
    expect(closedSession.variance).toBe(-30);
    expect(closedSession.closingTimestamp).not.toBeNull();

    const tClose = closedSession.closingTimestamp!;
    const tAfterClose = new Date(new Date(tClose).getTime() + 10000).toISOString();

    // Try inserting sales and payments AFTER closing timestamp to verify exclusion
    await db.runAsync(
      "INSERT INTO sales (total, payment_type, timestamp) VALUES (?, 'cash', ?)",
      [400, tAfterClose]
    );
    await db.runAsync(
      "INSERT INTO payments (customer_id, amount, payment_method, date) VALUES (1, ?, 'cash', ?)",
      [350, tAfterClose]
    );

    // Re-evaluate summary - should remain identical to when it was closed
    summary = await getCashSessionSummary(session.id);
    expect(summary.cashSales).toBe(200);
    expect(summary.cashUtangPayments).toBe(150);
    expect(summary.expectedCash).toBe(1430);
  });

  test('locking validations on closed sessions', async () => {
    const session = await openSession(1000);
    const entry = await insertCashEntry(session.id, {
      type: 'expense',
      amount: 100,
      notes: 'Pre-close expense',
    });

    // Close session
    await closeSession(session.id, 900);

    // Cannot write entry to closed session
    await expect(
      insertCashEntry(session.id, {
        type: 'expense',
        amount: 50,
        notes: 'Should fail',
      })
    ).rejects.toThrow('Cannot add entries to a closed cash session');

    // Cannot delete entry from closed session
    await expect(
      deleteCashEntry(entry.id)
    ).rejects.toThrow('Cannot delete entries from a closed cash session');

    // Cannot close an already closed session
    await expect(
      closeSession(session.id, 900)
    ).rejects.toThrow('Cash session is already closed');
  });

  test('can list cash sessions and list cash entries', async () => {
    // We cannot create multiple sessions on the same date due to the UNIQUE constraint.
    // However, we can bypass the constraint for testing listing by manually inserting rows into cash_sessions with different dates.
    const now = Date.now();
    await db.runAsync(
      `INSERT INTO cash_sessions (id, business_date, opening_cash, status, opening_timestamp, created_at, updated_at)
       VALUES (?, ?, ?, 'open', ?, ?, ?)`,
      ['id-1', '2026-07-15', 1000, '2026-07-15T08:00:00.000Z', now - 86400000, now - 86400000]
    );
    await db.runAsync(
      `INSERT INTO cash_sessions (id, business_date, opening_cash, status, opening_timestamp, created_at, updated_at)
       VALUES (?, ?, ?, 'open', ?, ?, ?)`,
      ['id-2', '2026-07-16', 2000, '2026-07-16T08:00:00.000Z', now, now]
    );

    const sessions = await listCashSessions();
    expect(sessions.length).toBe(2);
    // Ordered by business_date DESC
    expect(sessions[0].businessDate).toBe('2026-07-16');
    expect(sessions[1].businessDate).toBe('2026-07-15');

    // Insert entries for id-2
    await insertCashEntry('id-2', { type: 'owner_addition', amount: 100, notes: 'A' });
    await new Promise(resolve => setTimeout(resolve, 5));
    await insertCashEntry('id-2', { type: 'expense', amount: 50, notes: 'B' });

    const entries = await listCashEntries('id-2');
    expect(entries.length).toBe(2);
    // Ordered by timestamp DESC (since they're created sequentially, B has later timestamp)
    expect(entries[0].notes).toBe('B');
    expect(entries[1].notes).toBe('A');

    // Delete cash entry
    await deleteCashEntry(entries[0].id);
    const entriesAfterDelete = await listCashEntries('id-2');
    expect(entriesAfterDelete.length).toBe(1);
    expect(entriesAfterDelete[0].notes).toBe('A');
  });
});
