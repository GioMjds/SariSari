import { db } from '../configs/sqlite';
import { Pesos } from '../lib/money';
import {
  computeDigitalEffect,
  walletWouldGoNegative,
} from '../lib/digitalServices';
import { getCurrentLocalTimestamp } from '../utils/timezone';
import type {
  CashMovement,
  DigitalServicesSummary,
  DigitalTransaction,
  DigitalTransactionType,
  DigitalWallet,
  DigitalWalletType,
  NewDigitalTransaction,
  NewDigitalWallet,
  UpdateDigitalWallet,
} from '../types/digitalServices.types';

interface WalletRow {
  id: number;
  name: string;
  wallet_type: DigitalWalletType;
  current_balance: number;
  is_active: number;
  created_at: string;
}

interface TransactionRow {
  id: number;
  wallet_id: number;
  wallet_name: string;
  transaction_type: DigitalTransactionType;
  principal_amount: number;
  service_fee: number;
  wallet_delta: number;
  cash_drawer_delta: number;
  reference_number: string | null;
  customer_phone: string | null;
  note: string | null;
  created_at: string;
  voided_at: string | null;
}

const mapWallet = (row: WalletRow): DigitalWallet => ({
  id: row.id,
  name: row.name,
  walletType: row.wallet_type,
  currentBalance: row.current_balance as Pesos,
  isActive: row.is_active === 1,
  createdAt: row.created_at,
});

const mapTransaction = (row: TransactionRow): DigitalTransaction => ({
  id: row.id,
  walletId: row.wallet_id,
  walletName: row.wallet_name,
  transactionType: row.transaction_type,
  principalAmount: row.principal_amount as Pesos,
  serviceFee: row.service_fee as Pesos,
  walletDelta: row.wallet_delta,
  cashDrawerDelta: row.cash_drawer_delta,
  referenceNumber: row.reference_number,
  customerPhone: row.customer_phone,
  note: row.note,
  createdAt: row.created_at,
  voidedAt: row.voided_at,
});

const TRANSACTION_SELECT = `
  SELECT t.*, w.name AS wallet_name
  FROM digital_transactions t
  JOIN digital_wallets w ON w.id = t.wallet_id`;

/**
 * Single ledger of physical drawer effects (ADR-003). Each source contributes
 * one signed row; nothing is copied, so the ledger cannot drift from its sources.
 */
const CASH_MOVEMENTS_VIEW_SQL = `
  CREATE VIEW cash_movements AS
    SELECT 'cash_sale' AS source,
           CAST(id AS TEXT) AS source_id,
           substr(timestamp, 1, 10) AS business_date,
           total AS amount_delta,
           'Cash sale' AS label
      FROM sales
     WHERE payment_type = 'cash' AND cancelled_at IS NULL
    UNION ALL
    SELECT 'utang_payment',
           CAST(id AS TEXT),
           substr(date, 1, 10),
           amount,
           'Utang payment (cash)'
      FROM payments
     WHERE payment_method = 'cash'
    UNION ALL
    SELECT entry_type,
           id,
           business_date,
           -amount,
           CASE entry_type WHEN 'expense' THEN 'Expense' ELSE 'Owner draw' END
      FROM financial_entries
    UNION ALL
    SELECT 'e_service',
           CAST(id AS TEXT),
           substr(created_at, 1, 10),
           cash_drawer_delta,
           'E-service ' || transaction_type
      FROM digital_transactions
     WHERE voided_at IS NULL AND cash_drawer_delta <> 0`;

export const initDigitalServicesTables = async (): Promise<void> => {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS digital_wallets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      wallet_type TEXT NOT NULL CHECK(wallet_type IN ('gcash', 'maya', 'telco_load', 'bank', 'other')),
      current_balance INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS digital_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wallet_id INTEGER NOT NULL REFERENCES digital_wallets(id),
      transaction_type TEXT NOT NULL CHECK(transaction_type IN ('cash_in', 'cash_out', 'eload', 'replenish', 'adjustment')),
      principal_amount INTEGER NOT NULL,
      service_fee INTEGER NOT NULL DEFAULT 0 CHECK(service_fee >= 0),
      wallet_delta INTEGER NOT NULL,
      cash_drawer_delta INTEGER NOT NULL,
      reference_number TEXT,
      customer_phone TEXT,
      note TEXT,
      created_at TEXT NOT NULL,
      voided_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_digital_transactions_created ON digital_transactions(created_at);
    CREATE INDEX IF NOT EXISTS idx_digital_transactions_wallet ON digital_transactions(wallet_id);
  `);
};

/** Run after migrations so every source table exists. Recreated each launch. */
export const initCashMovementsView = async (): Promise<void> => {
  await db.execAsync('DROP VIEW IF EXISTS cash_movements;');
  await db.execAsync(CASH_MOVEMENTS_VIEW_SQL);
};

export const listWallets = async (
  includeInactive = false,
): Promise<DigitalWallet[]> => {
  const rows = await db.getAllAsync<WalletRow>(
    `SELECT * FROM digital_wallets
     ${includeInactive ? '' : 'WHERE is_active = 1'}
     ORDER BY is_active DESC, name COLLATE NOCASE`,
  );
  return rows.map(mapWallet);
};

export const createWallet = async (
  input: NewDigitalWallet,
): Promise<DigitalWallet> => {
  const name = input.name.trim();
  if (!name) throw new Error('Wallet name is required');
  const opening = Math.round(input.openingBalance);
  if (opening < 0) throw new Error('Opening balance cannot be negative');

  const result = await db.runAsync(
    `INSERT INTO digital_wallets (name, wallet_type, current_balance, created_at)
     VALUES (?, ?, ?, ?)`,
    [name, input.walletType, opening, getCurrentLocalTimestamp()],
  );
  const row = await db.getFirstAsync<WalletRow>(
    'SELECT * FROM digital_wallets WHERE id = ?',
    [result.lastInsertRowId],
  );
  if (!row) throw new Error('Wallet was not created');
  return mapWallet(row);
};

export const updateWallet = async (
  id: number,
  patch: UpdateDigitalWallet,
): Promise<void> => {
  const sets: string[] = [];
  const params: (string | number)[] = [];
  if (patch.name !== undefined) {
    const name = patch.name.trim();
    if (!name) throw new Error('Wallet name is required');
    sets.push('name = ?');
    params.push(name);
  }
  if (patch.isActive !== undefined) {
    sets.push('is_active = ?');
    params.push(patch.isActive ? 1 : 0);
  }
  if (sets.length === 0) return;
  params.push(id);
  await db.runAsync(
    `UPDATE digital_wallets SET ${sets.join(', ')} WHERE id = ?`,
    params,
  );
};

export const createDigitalTransaction = async (
  input: NewDigitalTransaction,
): Promise<number> => {
  const effect = computeDigitalEffect(input);
  let insertedId = 0;

  await db.withTransactionAsync(async () => {
    const wallet = await db.getFirstAsync<WalletRow>(
      'SELECT * FROM digital_wallets WHERE id = ?',
      [input.walletId],
    );
    if (!wallet) throw new Error('Wallet not found');
    if (wallet.is_active !== 1) throw new Error('Wallet is inactive');
    if (walletWouldGoNegative(wallet.current_balance, effect.walletDelta)) {
      throw new Error('Not enough float in this wallet');
    }

    const result = await db.runAsync(
      `INSERT INTO digital_transactions (
         wallet_id, transaction_type, principal_amount, service_fee,
         wallet_delta, cash_drawer_delta, reference_number, customer_phone,
         note, created_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.walletId,
        input.transactionType,
        effect.principalAmount,
        effect.serviceFee,
        effect.walletDelta,
        effect.cashDrawerDelta,
        input.referenceNumber?.trim() || null,
        input.customerPhone?.trim() || null,
        input.note?.trim() || null,
        getCurrentLocalTimestamp(),
      ],
    );
    insertedId = result.lastInsertRowId;

    await db.runAsync(
      'UPDATE digital_wallets SET current_balance = current_balance + ? WHERE id = ?',
      [effect.walletDelta, input.walletId],
    );
  });

  return insertedId;
};

/** Append-only: a void keeps the row and reverses its wallet effect. */
export const voidDigitalTransaction = async (id: number): Promise<void> => {
  await db.withTransactionAsync(async () => {
    const row = await db.getFirstAsync<TransactionRow>(
      "SELECT *, '' AS wallet_name FROM digital_transactions WHERE id = ?",
      [id],
    );
    if (!row) throw new Error('Transaction not found');
    if (row.voided_at) throw new Error('Transaction is already voided');

    const wallet = await db.getFirstAsync<WalletRow>(
      'SELECT * FROM digital_wallets WHERE id = ?',
      [row.wallet_id],
    );
    if (!wallet) throw new Error('Wallet not found');
    if (walletWouldGoNegative(wallet.current_balance, -row.wallet_delta)) {
      throw new Error('Voiding would leave this wallet below zero');
    }

    await db.runAsync(
      'UPDATE digital_transactions SET voided_at = ? WHERE id = ?',
      [getCurrentLocalTimestamp(), id],
    );
    await db.runAsync(
      'UPDATE digital_wallets SET current_balance = current_balance - ? WHERE id = ?',
      [row.wallet_delta, row.wallet_id],
    );
  });
};

export const listDigitalTransactions = async (
  startDate: string,
  endDate: string,
  walletId?: number,
): Promise<DigitalTransaction[]> => {
  const rows = await db.getAllAsync<TransactionRow>(
    `${TRANSACTION_SELECT}
     WHERE substr(t.created_at, 1, 10) BETWEEN ? AND ?
       AND (? IS NULL OR t.wallet_id = ?)
     ORDER BY t.created_at DESC, t.id DESC`,
    [startDate, endDate, walletId ?? null, walletId ?? null],
  );
  return rows.map(mapTransaction);
};

export const getDigitalServicesSummary = async (
  startDate: string,
  endDate: string,
): Promise<DigitalServicesSummary> => {
  const rows = await db.getAllAsync<{
    transaction_type: DigitalTransactionType;
    count: number;
    fees: number;
    drawer: number;
  }>(
    `SELECT transaction_type,
            COUNT(*) AS count,
            COALESCE(SUM(service_fee), 0) AS fees,
            COALESCE(SUM(cash_drawer_delta), 0) AS drawer
       FROM digital_transactions
      WHERE voided_at IS NULL
        AND substr(created_at, 1, 10) BETWEEN ? AND ?
      GROUP BY transaction_type`,
    [startDate, endDate],
  );

  const byType: DigitalServicesSummary['byType'] = {
    cash_in: { count: 0, fees: 0 as Pesos },
    cash_out: { count: 0, fees: 0 as Pesos },
    eload: { count: 0, fees: 0 as Pesos },
    replenish: { count: 0, fees: 0 as Pesos },
    adjustment: { count: 0, fees: 0 as Pesos },
  };
  let serviceIncome = 0;
  let transactionCount = 0;
  let cashDrawerNet = 0;
  for (const row of rows) {
    byType[row.transaction_type] = {
      count: row.count,
      fees: row.fees as Pesos,
    };
    serviceIncome += row.fees;
    transactionCount += row.count;
    cashDrawerNet += row.drawer;
  }

  return {
    serviceIncome: serviceIncome as Pesos,
    transactionCount,
    cashDrawerNet,
    byType,
  };
};

export const listCashMovements = async (
  startDate: string,
  endDate: string,
): Promise<CashMovement[]> => {
  const rows = await db.getAllAsync<{
    source: CashMovement['source'];
    source_id: string;
    business_date: string;
    amount_delta: number;
    label: string;
  }>(
    `SELECT * FROM cash_movements
      WHERE business_date BETWEEN ? AND ?
      ORDER BY business_date DESC, source, source_id DESC`,
    [startDate, endDate],
  );
  return rows.map((row) => ({
    source: row.source,
    sourceId: row.source_id,
    businessDate: row.business_date,
    amountDelta: row.amount_delta,
    label: row.label,
  }));
};

export const getCashMovementsNet = async (
  startDate: string,
  endDate: string,
): Promise<number> => {
  const row = await db.getFirstAsync<{ net: number }>(
    `SELECT COALESCE(SUM(amount_delta), 0) AS net FROM cash_movements
      WHERE business_date BETWEEN ? AND ?`,
    [startDate, endDate],
  );
  return row?.net ?? 0;
};
