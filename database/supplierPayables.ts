import { db } from '../configs/sqlite';
import type {
  NewSupplierPayment,
  PayablesDueSummary,
  SupplierBalance,
  SupplierPayable,
  SupplierPayment,
  SupplierPaymentMethod,
} from '../types/supplierPayables.types';
import {
  addDaysToDate,
  getCurrentLocalTimestamp,
  getTodayDateString,
} from '../utils/timezone';

const METHODS: SupplierPaymentMethod[] = ['cash', 'bank_transfer', 'other'];

export class SupplierOverpaymentError extends Error {
  owed: number;
  constructor(owed: number) {
    super(`Payment is more than the ${owed} owed to this supplier`);
    this.name = 'SupplierOverpaymentError';
    this.owed = owed;
  }
}

export class OpeningBalanceExistsError extends Error {
  constructor() {
    super('This supplier already has an opening balance');
    this.name = 'OpeningBalanceExistsError';
  }
}

export class ReceiptHasPaymentsError extends Error {
  receiptId: number;
  constructor(receiptId: number) {
    super(`Delivery receipt ${receiptId} has supplier payments; reverse them first`);
    this.name = 'ReceiptHasPaymentsError';
    this.receiptId = receiptId;
  }
}

const assertPesos = (amount: number) => {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error('Amount must be a whole peso amount above zero');
  }
};

interface PayableRow {
  id: number;
  supplier_id: string;
  receipt_id: number | null;
  invoice_no: string | null;
  amount: number;
  amount_paid: number;
  due_date: string | null;
  created_at: string;
}

const mapPayable = (r: PayableRow): SupplierPayable => ({
  id: r.id,
  supplierId: r.supplier_id,
  receiptId: r.receipt_id,
  invoiceNo: r.invoice_no,
  amount: r.amount,
  amountPaid: r.amount_paid,
  dueDate: r.due_date,
  createdAt: r.created_at,
});

const OPEN = 'p.cancelled_at IS NULL AND p.amount_paid < p.amount';

const getOwed = async (supplierId: string): Promise<number> => {
  const row = await db.getFirstAsync<{ owed: number }>(
    `SELECT COALESCE(SUM(p.amount - p.amount_paid), 0) AS owed
     FROM supplier_payables p WHERE p.supplier_id = ? AND ${OPEN}`,
    [supplierId],
  );
  return row?.owed ?? 0;
};

/** Inserts a payable. Caller must be inside a transaction when combined with other writes. */
export const insertPayableTx = async (
  supplierId: string,
  receiptId: number | null,
  amount: number,
  dueDate: string | null,
): Promise<number> => {
  assertPesos(amount);
  const result = await db.runAsync(
    `INSERT INTO supplier_payables (supplier_id, receipt_id, amount, due_date, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [supplierId, receiptId, amount, dueDate, getCurrentLocalTimestamp()],
  );
  return result.lastInsertRowId;
};

/** Records a payment and spreads it FIFO over open payables. Caller provides the transaction. */
export const insertSupplierPaymentTx = async (
  payment: NewSupplierPayment,
): Promise<number> => {
  assertPesos(payment.amount);
  if (!METHODS.includes(payment.paymentMethod)) {
    throw new Error(`Invalid payment method: ${payment.paymentMethod}`);
  }
  const owed = await getOwed(payment.supplierId);
  if (payment.amount > owed) throw new SupplierOverpaymentError(owed);

  const result = await db.runAsync(
    `INSERT INTO supplier_payments (supplier_id, amount, payment_method, business_date, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      payment.supplierId,
      payment.amount,
      payment.paymentMethod,
      getTodayDateString(),
      payment.notes?.trim() || null,
      getCurrentLocalTimestamp(),
    ],
  );
  const paymentId = result.lastInsertRowId;

  const open = await db.getAllAsync<{ id: number; amount: number; amount_paid: number }>(
    `SELECT p.id, p.amount, p.amount_paid FROM supplier_payables p
     WHERE p.supplier_id = ? AND ${OPEN}
     ORDER BY p.due_date IS NULL, p.due_date, p.created_at, p.id`,
    [payment.supplierId],
  );
  let remaining = payment.amount;
  for (const p of open) {
    if (remaining <= 0) break;
    const slice = Math.min(remaining, p.amount - p.amount_paid);
    await db.runAsync(
      'UPDATE supplier_payables SET amount_paid = amount_paid + ? WHERE id = ?',
      [slice, p.id],
    );
    await db.runAsync(
      'INSERT INTO supplier_payment_allocations (payment_id, payable_id, amount) VALUES (?, ?, ?)',
      [paymentId, p.id, slice],
    );
    remaining -= slice;
  }
  return paymentId;
};

export const insertSupplierPayment = async (
  payment: NewSupplierPayment,
): Promise<number> => {
  let id = 0;
  await db.withTransactionAsync(async () => {
    id = await insertSupplierPaymentTx(payment);
  });
  return id;
};

/** One opening balance per supplier, for debt that predates the app. */
export const createOpeningBalance = async (
  supplierId: string,
  amount: number,
  dueDate: string | null,
): Promise<number> => {
  let id = 0;
  await db.withTransactionAsync(async () => {
    const existing = await db.getFirstAsync<{ id: number }>(
      'SELECT id FROM supplier_payables WHERE supplier_id = ? AND receipt_id IS NULL AND cancelled_at IS NULL',
      [supplierId],
    );
    if (existing) throw new OpeningBalanceExistsError();
    id = await insertPayableTx(supplierId, null, amount, dueDate);
  });
  return id;
};

/** Reverses a payment's allocations and deletes it. */
export const deleteSupplierPayment = async (id: number): Promise<void> => {
  await db.withTransactionAsync(async () => {
    const allocations = await db.getAllAsync<{ payable_id: number; amount: number }>(
      'SELECT payable_id, amount FROM supplier_payment_allocations WHERE payment_id = ?',
      [id],
    );
    for (const a of allocations) {
      await db.runAsync(
        'UPDATE supplier_payables SET amount_paid = amount_paid - ? WHERE id = ?',
        [a.amount, a.payable_id],
      );
    }
    await db.runAsync('DELETE FROM supplier_payments WHERE id = ?', [id]);
  });
};

/** Cancels a receipt's payable on void; refuses if any payment touched it. Caller provides the transaction. */
export const cancelReceiptPayableTx = async (receiptId: number): Promise<void> => {
  const payable = await db.getFirstAsync<{ id: number; amount_paid: number }>(
    'SELECT id, amount_paid FROM supplier_payables WHERE receipt_id = ? AND cancelled_at IS NULL',
    [receiptId],
  );
  if (!payable) return;
  if (payable.amount_paid > 0) throw new ReceiptHasPaymentsError(receiptId);
  await db.runAsync(
    'UPDATE supplier_payables SET cancelled_at = ? WHERE id = ?',
    [getCurrentLocalTimestamp(), payable.id],
  );
};

export const getSupplierBalances = async (): Promise<SupplierBalance[]> => {
  const rows = await db.getAllAsync<{
    supplier_id: string;
    supplier_name: string;
    payment_terms_days: number | null;
    owed: number;
    open_count: number;
    next_due_date: string | null;
  }>(
    `SELECT s.id AS supplier_id, s.name AS supplier_name, s.payment_terms_days,
            SUM(p.amount - p.amount_paid) AS owed,
            COUNT(p.id) AS open_count,
            MIN(p.due_date) AS next_due_date
     FROM supplier_payables p JOIN suppliers s ON s.id = p.supplier_id
     WHERE ${OPEN}
     GROUP BY s.id
     ORDER BY next_due_date IS NULL, next_due_date, s.name`,
  );
  return rows.map((r) => ({
    supplierId: r.supplier_id,
    supplierName: r.supplier_name,
    paymentTermsDays: r.payment_terms_days,
    owed: r.owed,
    openCount: r.open_count,
    nextDueDate: r.next_due_date,
  }));
};

/** Open payables for one supplier, oldest due first. */
export const getSupplierPayables = async (
  supplierId: string,
): Promise<SupplierPayable[]> => {
  const rows = await db.getAllAsync<PayableRow>(
    `SELECT p.*, r.invoice_no FROM supplier_payables p
     LEFT JOIN delivery_receipts r ON r.id = p.receipt_id
     WHERE p.supplier_id = ? AND ${OPEN}
     ORDER BY p.due_date IS NULL, p.due_date, p.created_at, p.id`,
    [supplierId],
  );
  return rows.map(mapPayable);
};

export const getSupplierPaymentHistory = async (
  supplierId: string,
): Promise<SupplierPayment[]> => {
  const rows = await db.getAllAsync<{
    id: number;
    supplier_id: string;
    amount: number;
    payment_method: SupplierPaymentMethod;
    business_date: string;
    notes: string | null;
    created_at: string;
  }>(
    'SELECT * FROM supplier_payments WHERE supplier_id = ? ORDER BY created_at DESC, id DESC',
    [supplierId],
  );
  return rows.map((r) => ({
    id: r.id,
    supplierId: r.supplier_id,
    amount: r.amount,
    paymentMethod: r.payment_method,
    businessDate: r.business_date,
    notes: r.notes,
    createdAt: r.created_at,
  }));
};

/** Overdue (due before today) and due-soon (today through today + soonDays) open payables. */
export const getPayablesDueSummary = async (
  today: string = getTodayDateString(),
  soonDays = 3,
): Promise<PayablesDueSummary> => {
  const soon = addDaysToDate(`${today}T12:00:00`, soonDays);
  const row = await db.getFirstAsync<{
    overdue_count: number;
    overdue_amount: number;
    soon_count: number;
    soon_amount: number;
  }>(
    `SELECT
       SUM(CASE WHEN p.due_date < ? THEN 1 ELSE 0 END) AS overdue_count,
       SUM(CASE WHEN p.due_date < ? THEN p.amount - p.amount_paid ELSE 0 END) AS overdue_amount,
       SUM(CASE WHEN p.due_date >= ? AND p.due_date <= ? THEN 1 ELSE 0 END) AS soon_count,
       SUM(CASE WHEN p.due_date >= ? AND p.due_date <= ? THEN p.amount - p.amount_paid ELSE 0 END) AS soon_amount
     FROM supplier_payables p
     WHERE ${OPEN} AND p.due_date IS NOT NULL`,
    [today, today, today, soon, today, soon],
  );
  return {
    overdueCount: row?.overdue_count ?? 0,
    overdueAmount: row?.overdue_amount ?? 0,
    dueSoonCount: row?.soon_count ?? 0,
    dueSoonAmount: row?.soon_amount ?? 0,
  };
};
