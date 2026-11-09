import { db } from '../configs/sqlite';
import {
  convertDeliveryLine,
  InvalidDeliveryLineError,
} from '../lib/deliveryReceipt';
import type {
  DeliveryLineInput,
  DeliveryReceiptDetail,
  DeliveryReceiptLine,
  DeliveryReceiptStatus,
  DeliveryReceiptSummary,
  SaveDeliveryDraftInput,
} from '../types/deliveries.types';
import { applyInventoryTransaction } from './inventory';

export class ReceiptNotDraftError extends Error {
  receiptId: number;
  status: string;
  constructor(receiptId: number, status: string) {
    super(`Delivery receipt ${receiptId} is ${status}, not a draft`);
    this.name = 'ReceiptNotDraftError';
    this.receiptId = receiptId;
    this.status = status;
  }
}

export class ReceiptEmptyError extends Error {
  receiptId: number;
  constructor(receiptId: number) {
    super(`Delivery receipt ${receiptId} has nothing received`);
    this.name = 'ReceiptEmptyError';
    this.receiptId = receiptId;
  }
}

export class DraftAlreadyExistsError extends Error {
  existingReceiptId: number;
  constructor(existingReceiptId: number) {
    super(
      `A draft delivery receipt ${existingReceiptId} already exists for this supplier`,
    );
    this.name = 'DraftAlreadyExistsError';
    this.existingReceiptId = existingReceiptId;
  }
}

export class QuickAddBarcodeExistsError extends Error {
  barcode: string;
  constructor(barcode: string) {
    super(`Barcode ${barcode} already belongs to a product`);
    this.name = 'QuickAddBarcodeExistsError';
    this.barcode = barcode;
  }
}

export class ReceiptNotCommittedError extends Error {
  receiptId: number;
  status: string;
  constructor(receiptId: number, status: string) {
    super(`Delivery receipt ${receiptId} is ${status}, not committed`);
    this.name = 'ReceiptNotCommittedError';
    this.receiptId = receiptId;
    this.status = status;
  }
}

export class ReceiptAlreadyVoidedError extends Error {
  receiptId: number;
  constructor(receiptId: number) {
    super(`Delivery receipt ${receiptId} is already voided`);
    this.name = 'ReceiptAlreadyVoidedError';
    this.receiptId = receiptId;
  }
}

export interface VoidShortfall {
  productId: number;
  productName: string;
  needed: number;
  onHand: number;
}

export class VoidWouldGoNegativeError extends Error {
  shortfalls: VoidShortfall[];
  constructor(shortfalls: VoidShortfall[]) {
    super(
      `Cannot void: stock too low for ${shortfalls.map((s) => s.productName).join(', ')}`,
    );
    this.name = 'VoidWouldGoNegativeError';
    this.shortfalls = shortfalls;
  }
}

interface ReceiptRow {
  id: number;
  supplier_id: string;
  status: DeliveryReceiptStatus;
  invoice_no: string | null;
  invoice_photo_uri: string | null;
  note: string | null;
  created_at: string;
  committed_at: string | null;
  voided_at: string | null;
  void_reason: string | null;
}

interface LineRow {
  id: number;
  receipt_id: number;
  product_id: number | null;
  product_name: string | null;
  new_product_name: string | null;
  new_product_price: number | null;
  new_product_barcode: string | null;
  entered_unit: 'retail' | 'wholesale';
  entered_expected_qty: number;
  entered_received_qty: number;
  entered_unit_cost: number;
  expected_qty: number;
  received_qty: number;
  expected_unit_cost: number | null;
  actual_unit_cost: number;
  shortage_qty: number;
  conversion_factor_used: number;
}

export const getReceiptRow = async (id: number): Promise<ReceiptRow | null> =>
  db.getFirstAsync<ReceiptRow>('SELECT * FROM delivery_receipts WHERE id = ?', [
    id,
  ]);

export const getOpenDraftForSupplier = async (
  supplierId: string,
): Promise<number | null> => {
  const row = await db.getFirstAsync<{ id: number }>(
    "SELECT id FROM delivery_receipts WHERE supplier_id = ? AND status = 'draft'",
    [supplierId],
  );
  return row?.id ?? null;
};

const insertLine = async (
  receiptId: number,
  line: DeliveryLineInput,
): Promise<void> => {
  let conversionFactor: number | null = null;
  let expectedUnitCost: number | null = null;

  if (line.productId !== null) {
    const product = await db.getFirstAsync<{
      conversion_factor: number | null;
      cost_price: number | null;
    }>('SELECT conversion_factor, cost_price FROM products WHERE id = ?', [
      line.productId,
    ]);
    if (!product) {
      throw new InvalidDeliveryLineError(`Product ${line.productId} not found`);
    }
    conversionFactor = product.conversion_factor;
    expectedUnitCost = product.cost_price;
  } else {
    const quick = line.newProduct;
    if (!quick || quick.name.trim() === '') {
      throw new InvalidDeliveryLineError('New product name is required');
    }
    if (!Number.isInteger(quick.price) || quick.price < 0) {
      throw new InvalidDeliveryLineError(
        'New product price must be whole pesos',
      );
    }
    if (line.enteredUnit !== 'retail') {
      throw new InvalidDeliveryLineError(
        'New products are received in retail pieces',
      );
    }
    const barcode = quick.barcode?.trim() || null;
    if (barcode) {
      const clash = await db.getFirstAsync<{ id: number }>(
        'SELECT id FROM products WHERE barcode = ? OR wholesale_barcode = ?',
        [barcode, barcode],
      );
      if (clash) throw new QuickAddBarcodeExistsError(barcode);
    }
  }

  const c = convertDeliveryLine({
    enteredUnit: line.enteredUnit,
    enteredExpectedQty: line.enteredExpectedQty,
    enteredReceivedQty: line.enteredReceivedQty,
    enteredUnitCost: line.enteredUnitCost,
    conversionFactor,
  });

  await db.runAsync(
    `INSERT INTO delivery_receipt_lines (
       receipt_id, product_id, new_product_name, new_product_price, new_product_barcode,
       entered_unit, entered_expected_qty, entered_received_qty, entered_unit_cost,
       expected_qty, received_qty, expected_unit_cost, actual_unit_cost,
       shortage_qty, conversion_factor_used
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      receiptId,
      line.productId,
      line.newProduct?.name.trim() ?? null,
      line.newProduct?.price ?? null,
      line.newProduct?.barcode?.trim() || null,
      line.enteredUnit,
      line.enteredExpectedQty,
      line.enteredReceivedQty,
      line.enteredUnitCost,
      c.expectedQty,
      c.receivedQty,
      expectedUnitCost,
      c.actualUnitCost,
      c.shortageQty,
      c.conversionFactorUsed,
    ],
  );
};

/**
 * Creates or updates the draft header and replaces all its lines.
 * The supplier of an existing draft cannot change.
 */
export const saveDeliveryDraft = async (
  input: SaveDeliveryDraftInput,
): Promise<number> => {
  let receiptId = input.receiptId ?? 0;

  await db.withTransactionAsync(async () => {
    if (input.receiptId !== undefined) {
      const existing = await getReceiptRow(input.receiptId);
      if (!existing) {
        throw new Error(`Delivery receipt ${input.receiptId} not found`);
      }
      if (existing.status !== 'draft') {
        throw new ReceiptNotDraftError(existing.id, existing.status);
      }
      await db.runAsync(
        'UPDATE delivery_receipts SET invoice_no = ?, invoice_photo_uri = ?, note = ? WHERE id = ?',
        [
          input.invoiceNo ?? null,
          input.invoicePhotoUri ?? null,
          input.note ?? null,
          existing.id,
        ],
      );
      await db.runAsync(
        'DELETE FROM delivery_receipt_lines WHERE receipt_id = ?',
        [existing.id],
      );
    } else {
      const openDraft = await getOpenDraftForSupplier(input.supplierId);
      if (openDraft !== null) throw new DraftAlreadyExistsError(openDraft);
      const result = await db.runAsync(
        'INSERT INTO delivery_receipts (supplier_id, status, invoice_no, invoice_photo_uri, note, received_at) VALUES (?, ?, ?, ?, ?, ?)',
        [
          input.supplierId,
          'draft',
          input.invoiceNo ?? null,
          input.invoicePhotoUri ?? null,
          input.note ?? null,
          new Date().toISOString(),
        ],
      );
      receiptId = result.lastInsertRowId;
    }

    for (const line of input.lines) {
      await insertLine(receiptId, line);
    }
  });

  return receiptId;
};

export const discardDeliveryDraft = async (id: number): Promise<void> => {
  await db.withTransactionAsync(async () => {
    const existing = await getReceiptRow(id);
    if (!existing) return;
    if (existing.status !== 'draft') {
      throw new ReceiptNotDraftError(id, existing.status);
    }
    await db.runAsync(
      'DELETE FROM delivery_receipt_lines WHERE receipt_id = ?',
      [id],
    );
    await db.runAsync('DELETE FROM delivery_receipts WHERE id = ?', [id]);
  });
};

const mapLine = (r: LineRow): DeliveryReceiptLine => ({
  id: r.id,
  receiptId: r.receipt_id,
  productId: r.product_id,
  productName: r.product_name ?? r.new_product_name ?? 'Unknown product',
  newProduct:
    r.new_product_name !== null
      ? {
          name: r.new_product_name,
          price: r.new_product_price ?? 0,
          barcode: r.new_product_barcode,
        }
      : null,
  enteredUnit: r.entered_unit,
  enteredExpectedQty: r.entered_expected_qty,
  enteredReceivedQty: r.entered_received_qty,
  enteredUnitCost: r.entered_unit_cost,
  expectedQty: r.expected_qty,
  receivedQty: r.received_qty,
  expectedUnitCost: r.expected_unit_cost,
  actualUnitCost: r.actual_unit_cost,
  shortageQty: r.shortage_qty,
  conversionFactorUsed: r.conversion_factor_used,
});

const SUMMARY_SELECT = `
  SELECT r.id, r.supplier_id, s.name AS supplier_name, r.status, r.invoice_no,
         r.created_at, r.committed_at, r.voided_at,
         COUNT(l.id) AS line_count,
         COALESCE(SUM(l.received_qty * l.actual_unit_cost), 0) AS total_cost,
         COALESCE(SUM(l.shortage_qty), 0) AS shortage_qty
  FROM delivery_receipts r
  JOIN suppliers s ON s.id = r.supplier_id
  LEFT JOIN delivery_receipt_lines l ON l.receipt_id = r.id`;

interface SummaryRow {
  id: number;
  supplier_id: string;
  supplier_name: string;
  status: DeliveryReceiptStatus;
  invoice_no: string | null;
  created_at: string;
  committed_at: string | null;
  voided_at: string | null;
  line_count: number;
  total_cost: number;
  shortage_qty: number;
}

const mapSummary = (r: SummaryRow): DeliveryReceiptSummary => ({
  id: r.id,
  supplierId: r.supplier_id,
  supplierName: r.supplier_name,
  status: r.status,
  invoiceNo: r.invoice_no,
  createdAt: r.created_at,
  committedAt: r.committed_at,
  voidedAt: r.voided_at,
  lineCount: r.line_count,
  totalCost: r.total_cost,
  shortageQty: r.shortage_qty,
});

export const getDeliveryReceipt = async (
  id: number,
): Promise<DeliveryReceiptDetail | null> => {
  const summary = await db.getFirstAsync<SummaryRow>(
    `${SUMMARY_SELECT} WHERE r.id = ? GROUP BY r.id`,
    [id],
  );
  if (!summary) return null;
  const header = await getReceiptRow(id);
  const lines = await db.getAllAsync<LineRow>(
    `SELECT l.*, p.name AS product_name
     FROM delivery_receipt_lines l
     LEFT JOIN products p ON p.id = l.product_id
     WHERE l.receipt_id = ? ORDER BY l.id`,
    [id],
  );
  return {
    ...mapSummary(summary),
    invoicePhotoUri: header?.invoice_photo_uri ?? null,
    note: header?.note ?? null,
    voidReason: header?.void_reason ?? null,
    lines: lines.map(mapLine),
  };
};

export const listDeliveryReceipts = async (
  filter: {
    supplierId?: string;
    status?: DeliveryReceiptStatus;
    since?: string;
  } = {},
): Promise<DeliveryReceiptSummary[]> => {
  const where: string[] = [];
  const params: string[] = [];
  if (filter.supplierId) {
    where.push('r.supplier_id = ?');
    params.push(filter.supplierId);
  }
  if (filter.status) {
    where.push('r.status = ?');
    params.push(filter.status);
  }
  if (filter.since) {
    where.push('r.created_at >= ?');
    params.push(filter.since);
  }
  const clause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
  const rows = await db.getAllAsync<SummaryRow>(
    `${SUMMARY_SELECT} ${clause} GROUP BY r.id ORDER BY r.id DESC`,
    params,
  );
  return rows.map(mapSummary);
};

const createQuickAddProduct = async (
  line: LineRow,
  supplierId: string,
  receiptId: number,
): Promise<number> => {
  const barcode = line.new_product_barcode?.trim() || null;
  if (barcode) {
    const clash = await db.getFirstAsync<{ id: number }>(
      'SELECT id FROM products WHERE barcode = ? OR wholesale_barcode = ?',
      [barcode, barcode],
    );
    if (clash) throw new QuickAddBarcodeExistsError(barcode);
  }
  const result = await db.runAsync(
    `INSERT INTO products (name, sku, price, quantity, cost_price, barcode, supplier_id)
     VALUES (?, ?, ?, 0, ?, ?, ?)`,
    [
      line.new_product_name ?? 'New product',
      `DLV-${receiptId}-${line.id}`,
      line.new_product_price ?? 0,
      line.actual_unit_cost,
      barcode,
      supplierId,
    ],
  );
  return result.lastInsertRowId;
};

/**
 * Commits a draft: creates quick-add products, restocks every received line
 * through applyInventoryTransaction, and flips the status, all in one
 * transaction. A second call throws ReceiptNotDraftError, so a double tap
 * cannot restock twice.
 */
// withTransactionAsync is not exclusive, so overlapping commits of one receipt must be rejected here.
const commitsInFlight = new Set<number>();

export const commitDeliveryReceipt = async (
  receiptId: number,
): Promise<void> => {
  if (commitsInFlight.has(receiptId)) {
    throw new ReceiptNotDraftError(receiptId, 'being committed');
  }
  commitsInFlight.add(receiptId);
  try {
    await runCommit(receiptId);
  } finally {
    commitsInFlight.delete(receiptId);
  }
};

const runCommit = async (receiptId: number): Promise<void> => {
  await db.withTransactionAsync(async () => {
    const receipt = await getReceiptRow(receiptId);
    if (!receipt) throw new Error(`Delivery receipt ${receiptId} not found`);
    if (receipt.status !== 'draft') {
      throw new ReceiptNotDraftError(receiptId, receipt.status);
    }

    const lines = await db.getAllAsync<LineRow>(
      'SELECT l.*, NULL AS product_name FROM delivery_receipt_lines l WHERE l.receipt_id = ? ORDER BY l.id',
      [receiptId],
    );
    if (lines.length === 0 || lines.every((l) => l.received_qty === 0)) {
      throw new ReceiptEmptyError(receiptId);
    }

    const note = receipt.invoice_no
      ? `Delivery receipt #${receiptId} (invoice ${receipt.invoice_no})`
      : `Delivery receipt #${receiptId}`;

    for (const line of lines) {
      let productId = line.product_id;
      if (productId === null) {
        productId = await createQuickAddProduct(
          line,
          receipt.supplier_id,
          receiptId,
        );
        await db.runAsync(
          'UPDATE delivery_receipt_lines SET product_id = ? WHERE id = ?',
          [productId, line.id],
        );
      }
      if (line.received_qty > 0) {
        await applyInventoryTransaction({
          product_id: productId,
          type: 'restock',
          quantity: line.received_qty,
          unit_cost: line.actual_unit_cost,
          supplier_id: receipt.supplier_id,
          receipt_id: receiptId,
          note,
        });
      }
    }

    const flipped = await db.runAsync(
      "UPDATE delivery_receipts SET status = 'committed', committed_at = ? WHERE id = ? AND status = 'draft'",
      [new Date().toISOString(), receiptId],
    );
    if (flipped.changes !== 1) {
      throw new ReceiptNotDraftError(receiptId, 'not a draft');
    }
  });
};

// withTransactionAsync is not exclusive, so overlapping voids of one receipt must be rejected here.
const voidsInFlight = new Set<number>();

/**
 * Voids a committed receipt: refuses if any product no longer has enough
 * stock to reverse, otherwise writes offsetting negative adjustments and
 * marks the receipt voided. cost_price is not rolled back. Owner PIN gating
 * is done by the caller. An overlapping call for the same receipt throws
 * ReceiptAlreadyVoidedError.
 */
export const voidDeliveryReceipt = async (
  receiptId: number,
  reason: string,
): Promise<void> => {
  const trimmedReason = reason.trim();
  if (trimmedReason === '') {
    throw new Error('A void reason is required');
  }
  if (voidsInFlight.has(receiptId)) {
    throw new ReceiptAlreadyVoidedError(receiptId);
  }
  voidsInFlight.add(receiptId);
  try {
    await runVoid(receiptId, trimmedReason);
  } finally {
    voidsInFlight.delete(receiptId);
  }
};

const runVoid = async (
  receiptId: number,
  trimmedReason: string,
): Promise<void> => {
  await db.withTransactionAsync(async () => {
    const receipt = await getReceiptRow(receiptId);
    if (!receipt) throw new Error(`Delivery receipt ${receiptId} not found`);
    if (receipt.status === 'voided')
      throw new ReceiptAlreadyVoidedError(receiptId);
    if (receipt.status !== 'committed') {
      throw new ReceiptNotCommittedError(receiptId, receipt.status);
    }

    const totals = await db.getAllAsync<{
      product_id: number;
      product_name: string;
      received: number;
      on_hand: number;
    }>(
      `SELECT l.product_id AS product_id, p.name AS product_name,
              SUM(l.received_qty) AS received, p.quantity AS on_hand
       FROM delivery_receipt_lines l
       JOIN products p ON p.id = l.product_id
       WHERE l.receipt_id = ? AND l.received_qty > 0
       GROUP BY l.product_id`,
      [receiptId],
    );

    const shortfalls: VoidShortfall[] = totals
      .filter((t) => t.on_hand < t.received)
      .map((t) => ({
        productId: t.product_id,
        productName: t.product_name,
        needed: t.received,
        onHand: t.on_hand,
      }));
    if (shortfalls.length > 0) throw new VoidWouldGoNegativeError(shortfalls);

    for (const t of totals) {
      await applyInventoryTransaction({
        product_id: t.product_id,
        type: 'adjustment',
        adjustment_sign: 'negative',
        quantity: t.received,
        receipt_id: receiptId,
        note: `Void of delivery receipt #${receiptId}: ${trimmedReason}`,
      });
    }

    const flipped = await db.runAsync(
      "UPDATE delivery_receipts SET status = 'voided', voided_at = ?, void_reason = ? WHERE id = ? AND status = 'committed'",
      [new Date().toISOString(), trimmedReason, receiptId],
    );
    if (flipped.changes !== 1) {
      throw new ReceiptAlreadyVoidedError(receiptId);
    }
  });
};
