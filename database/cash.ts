import { db } from '../configs/sqlite';
import * as Crypto from 'expo-crypto';
import {
  getCurrentLocalTimestamp,
  getTodayDateString,
} from '../utils/timezone';
import { Pesos } from '../lib/money';
import {
  CashSession,
  CashSessionSummary,
  CashEntry,
  NewCashEntry,
  CashSessionStatus,
  CashEntryType,
} from '../types/cash.types';

export const initCashTables = async (): Promise<void> => {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS cash_sessions (
      id TEXT PRIMARY KEY,
      business_date TEXT UNIQUE NOT NULL,
      opening_cash INTEGER NOT NULL,
      actual_cash INTEGER,
      expected_cash INTEGER,
      variance INTEGER,
      status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'closed')),
      opening_timestamp TEXT NOT NULL,
      closing_timestamp TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cash_entries (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL REFERENCES cash_sessions(id) ON DELETE CASCADE,
      type TEXT NOT NULL CHECK(type IN ('expense', 'owner_drawing', 'owner_addition')),
      amount INTEGER NOT NULL,
      notes TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_cash_sessions_date ON cash_sessions(business_date);
    CREATE INDEX IF NOT EXISTS idx_cash_entries_session ON cash_entries(session_id);
    CREATE INDEX IF NOT EXISTS idx_cash_entries_timestamp ON cash_entries(timestamp);
  `);
};

export const getCurrentSession = async (): Promise<CashSession | null> => {
  const today = getTodayDateString();
  const row = await db.getFirstAsync<{
    id: string;
    business_date: string;
    opening_cash: number;
    actual_cash: number | null;
    expected_cash: number | null;
    variance: number | null;
    status: CashSessionStatus;
    opening_timestamp: string;
    closing_timestamp: string | null;
    created_at: number;
    updated_at: number;
  }>('SELECT * FROM cash_sessions WHERE business_date = ?', [today]);

  if (!row) return null;

  return {
    id: row.id,
    businessDate: row.business_date,
    openingCash: row.opening_cash as Pesos,
    actualCash: row.actual_cash as Pesos | null,
    expectedCash: row.expected_cash as Pesos | null,
    variance: row.variance as Pesos | null,
    status: row.status,
    openingTimestamp: row.opening_timestamp,
    closingTimestamp: row.closing_timestamp,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

export const openSession = async (
  openingCash: Pesos,
): Promise<CashSession> => {
  const existing = await getCurrentSession();
  if (existing) {
    throw new Error('A cash session is already open for today');
  }

  const id = Crypto.randomUUID();
  const today = getTodayDateString();
  const timestamp = getCurrentLocalTimestamp();
  const now = Date.now();

  await db.runAsync(
    `INSERT INTO cash_sessions (
      id, business_date, opening_cash, status, opening_timestamp, created_at, updated_at
    ) VALUES (?, ?, ?, 'open', ?, ?, ?)`,
    [id, today, openingCash, timestamp, now, now],
  );

  return {
    id,
    businessDate: today,
    openingCash,
    actualCash: null,
    expectedCash: null,
    variance: null,
    status: 'open',
    openingTimestamp: timestamp,
    closingTimestamp: null,
    createdAt: now,
    updatedAt: now,
  };
};

export const getCashSessionSummary = async (
  sessionId: string,
): Promise<CashSessionSummary> => {
  const sessionRow = await db.getFirstAsync<{
    id: string;
    business_date: string;
    opening_cash: number;
    actual_cash: number | null;
    expected_cash: number | null;
    variance: number | null;
    status: CashSessionStatus;
    opening_timestamp: string;
    closing_timestamp: string | null;
    created_at: number;
    updated_at: number;
  }>('SELECT * FROM cash_sessions WHERE id = ?', [sessionId]);

  if (!sessionRow) {
    throw new Error(`Cash session ${sessionId} not found`);
  }

  const session: CashSession = {
    id: sessionRow.id,
    businessDate: sessionRow.business_date,
    openingCash: sessionRow.opening_cash as Pesos,
    actualCash: sessionRow.actual_cash as Pesos | null,
    expectedCash: sessionRow.expected_cash as Pesos | null,
    variance: sessionRow.variance as Pesos | null,
    status: sessionRow.status,
    openingTimestamp: sessionRow.opening_timestamp,
    closingTimestamp: sessionRow.closing_timestamp,
    createdAt: sessionRow.created_at,
    updatedAt: sessionRow.updated_at,
  };

  const endTimestamp = session.closingTimestamp;

  const salesResult = await db.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(total), 0) as total FROM sales
     WHERE payment_type = 'cash'
       AND timestamp >= ?
       AND (? IS NULL OR timestamp <= ?)`,
    [session.openingTimestamp, endTimestamp, endTimestamp],
  );
  const cashSales = salesResult?.total ?? 0;

  const paymentsResult = await db.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(amount), 0) as total FROM payments
     WHERE payment_method = 'cash'
       AND date >= ?
       AND (? IS NULL OR date <= ?)`,
    [session.openingTimestamp, endTimestamp, endTimestamp],
  );
  const cashUtangPayments = paymentsResult?.total ?? 0;

  const entriesResult = await db.getFirstAsync<{
    owner_additions: number;
    expenses: number;
    owner_drawings: number;
  }>(
    `SELECT
       COALESCE(SUM(CASE WHEN type = 'owner_addition' THEN amount ELSE 0 END), 0) as owner_additions,
       COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expenses,
       COALESCE(SUM(CASE WHEN type = 'owner_drawing' THEN amount ELSE 0 END), 0) as owner_drawings
     FROM cash_entries
     WHERE session_id = ?`,
    [sessionId],
  );

  const ownerAdditions = entriesResult?.owner_additions ?? 0;
  const expenses = entriesResult?.expenses ?? 0;
  const ownerDrawings = entriesResult?.owner_drawings ?? 0;

  const expectedCash =
    session.openingCash +
    cashSales +
    cashUtangPayments +
    ownerAdditions -
    expenses -
    ownerDrawings;

  return {
    session,
    expectedCash: expectedCash as Pesos,
    cashSales: cashSales as Pesos,
    cashUtangPayments: cashUtangPayments as Pesos,
    ownerAdditions: ownerAdditions as Pesos,
    expenses: expenses as Pesos,
    ownerDrawings: ownerDrawings as Pesos,
  };
};

export const closeSession = async (
  sessionId: string,
  actualCash: Pesos,
): Promise<void> => {
  const summary = await getCashSessionSummary(sessionId);
  if (summary.session?.status === 'closed') {
    throw new Error('Cash session is already closed');
  }

  const expectedCash = summary.expectedCash;
  const variance = actualCash - expectedCash;
  const closingTimestamp = getCurrentLocalTimestamp();
  const now = Date.now();

  await db.runAsync(
    `UPDATE cash_sessions
     SET status = 'closed',
         actual_cash = ?,
         expected_cash = ?,
         variance = ?,
         closing_timestamp = ?,
         updated_at = ?
     WHERE id = ?`,
    [actualCash, expectedCash, variance, closingTimestamp, now, sessionId],
  );
};

export const insertCashEntry = async (
  sessionId: string,
  entry: NewCashEntry,
): Promise<CashEntry> => {
  const session = await db.getFirstAsync<{ status: string }>(
    'SELECT status FROM cash_sessions WHERE id = ?',
    [sessionId],
  );
  if (!session) {
    throw new Error('Cash session not found');
  }
  if (session.status === 'closed') {
    throw new Error('Cannot add entries to a closed cash session');
  }

  const id = Crypto.randomUUID();
  const timestamp = getCurrentLocalTimestamp();
  const now = Date.now();

  await db.runAsync(
    `INSERT INTO cash_entries (id, session_id, type, amount, notes, timestamp, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, sessionId, entry.type, entry.amount, entry.notes, timestamp, now],
  );

  return {
    id,
    sessionId,
    type: entry.type,
    amount: entry.amount,
    notes: entry.notes,
    timestamp,
    createdAt: now,
  };
};

export const deleteCashEntry = async (entryId: string): Promise<void> => {
  const entry = await db.getFirstAsync<{ session_id: string }>(
    'SELECT session_id FROM cash_entries WHERE id = ?',
    [entryId],
  );
  if (!entry) return;

  const session = await db.getFirstAsync<{ status: string }>(
    'SELECT status FROM cash_sessions WHERE id = ?',
    [entry.session_id],
  );
  if (session?.status === 'closed') {
    throw new Error('Cannot delete entries from a closed cash session');
  }

  await db.runAsync('DELETE FROM cash_entries WHERE id = ?', [entryId]);
};

export const listCashSessions = async (): Promise<CashSession[]> => {
  const rows = await db.getAllAsync<{
    id: string;
    business_date: string;
    opening_cash: number;
    actual_cash: number | null;
    expected_cash: number | null;
    variance: number | null;
    status: CashSessionStatus;
    opening_timestamp: string;
    closing_timestamp: string | null;
    created_at: number;
    updated_at: number;
  }>('SELECT * FROM cash_sessions ORDER BY business_date DESC');

  return rows.map((row) => ({
    id: row.id,
    businessDate: row.business_date,
    openingCash: row.opening_cash as Pesos,
    actualCash: row.actual_cash as Pesos | null,
    expectedCash: row.expected_cash as Pesos | null,
    variance: row.variance as Pesos | null,
    status: row.status,
    openingTimestamp: row.opening_timestamp,
    closingTimestamp: row.closing_timestamp,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
};

export const listCashEntries = async (
  sessionId: string,
): Promise<CashEntry[]> => {
  const rows = await db.getAllAsync<{
    id: string;
    session_id: string;
    type: CashEntryType;
    amount: number;
    notes: string;
    timestamp: string;
    created_at: number;
  }>(
    'SELECT * FROM cash_entries WHERE session_id = ? ORDER BY timestamp DESC',
    [sessionId],
  );

  return rows.map((row) => ({
    id: row.id,
    sessionId: row.session_id,
    type: row.type,
    amount: row.amount as Pesos,
    notes: row.notes,
    timestamp: row.timestamp,
    createdAt: row.created_at,
  }));
};
