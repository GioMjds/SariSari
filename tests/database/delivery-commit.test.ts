import { db } from '@/configs/sqlite';
import {
  QuickAddBarcodeExistsError,
  ReceiptEmptyError,
  ReceiptNotDraftError,
  commitDeliveryReceipt,
  getDeliveryReceipt,
  saveDeliveryDraft,
} from '@/database/deliveries';
import type { DeliveryLineInput } from '@/types/deliveries.types';
import { resetMockDb } from '../__setup__/expo-sqlite-mock';
import {
  seedProduct,
  seedSupplier,
  setupDeliveryDb,
  stockOf,
} from '../helpers/deliveryFixtures';

const retail = (
  productId: number,
  expected: number,
  received: number,
  cost: number,
): DeliveryLineInput => ({
  productId,
  newProduct: null,
  enteredUnit: 'retail',
  enteredExpectedQty: expected,
  enteredReceivedQty: received,
  enteredUnitCost: cost,
});

describe('commitDeliveryReceipt', () => {
  beforeAll(async () => {
    await setupDeliveryDb();
  });
  beforeEach(() => {
    resetMockDb();
  });

  it('writes one restock row per received line, updates stock and cost, flips status', async () => {
    const sup = await seedSupplier('c-1');
    const a = await seedProduct({ name: 'A', sku: 'CA', qty: 5, cost: 10 });
    const b = await seedProduct({ name: 'B', sku: 'CB', qty: 0, cost: 20 });
    const id = await saveDeliveryDraft({
      supplierId: sup,
      invoiceNo: 'INV-9',
      lines: [retail(a, 10, 8, 12), retail(b, 4, 4, 25)],
    });

    await commitDeliveryReceipt(id);

    expect(await stockOf(a)).toEqual({ quantity: 13, cost_price: 12 });
    expect(await stockOf(b)).toEqual({ quantity: 4, cost_price: 25 });

    const rows = await db.getAllAsync<{
      product_id: number;
      quantity: number;
      unit_cost: number;
      supplier_id: string;
      receipt_id: number;
    }>(
      'SELECT product_id, quantity, unit_cost, supplier_id, receipt_id FROM inventory_transactions WHERE receipt_id = ? ORDER BY id',
      [id],
    );
    expect(rows).toEqual([
      {
        product_id: a,
        quantity: 8,
        unit_cost: 12,
        supplier_id: sup,
        receipt_id: id,
      },
      {
        product_id: b,
        quantity: 4,
        unit_cost: 25,
        supplier_id: sup,
        receipt_id: id,
      },
    ]);

    const detail = await getDeliveryReceipt(id);
    expect(detail?.status).toBe('committed');
    expect(detail?.committedAt).not.toBeNull();
  });

  it('review focus: double commit throws ReceiptNotDraftError and does not restock twice', async () => {
    const sup = await seedSupplier('c-2');
    const a = await seedProduct({ name: 'A', sku: 'CA2', qty: 0 });
    const id = await saveDeliveryDraft({
      supplierId: sup,
      lines: [retail(a, 3, 3, 10)],
    });
    await commitDeliveryReceipt(id);
    await expect(commitDeliveryReceipt(id)).rejects.toBeInstanceOf(
      ReceiptNotDraftError,
    );
    expect((await stockOf(a)).quantity).toBe(3);
  });

  it('zero-received line writes no stock row but the line is kept', async () => {
    const sup = await seedSupplier('c-3');
    const a = await seedProduct({ name: 'A', sku: 'CA3', qty: 1, cost: 5 });
    const b = await seedProduct({ name: 'B', sku: 'CB3', qty: 1, cost: 5 });
    const id = await saveDeliveryDraft({
      supplierId: sup,
      lines: [retail(a, 6, 0, 7), retail(b, 2, 2, 7)],
    });
    await commitDeliveryReceipt(id);
    expect(await stockOf(a)).toEqual({ quantity: 1, cost_price: 5 });
    const detail = await getDeliveryReceipt(id);
    expect(detail?.lines).toHaveLength(2);
    expect(detail?.lines.find((l) => l.productId === a)?.shortageQty).toBe(6);
  });

  it('an empty or all-zero receipt throws ReceiptEmptyError and stays a draft', async () => {
    const sup = await seedSupplier('c-4');
    const a = await seedProduct({ name: 'A', sku: 'CA4' });
    const id = await saveDeliveryDraft({
      supplierId: sup,
      lines: [retail(a, 3, 0, 5)],
    });
    await expect(commitDeliveryReceipt(id)).rejects.toBeInstanceOf(
      ReceiptEmptyError,
    );
    expect((await getDeliveryReceipt(id))?.status).toBe('draft');
  });

  it('wholesale entry restocks converted pieces at per-piece cost', async () => {
    const sup = await seedSupplier('c-5');
    const a = await seedProduct({
      name: 'Soda',
      sku: 'CA5',
      qty: 0,
      cost: 9,
      wholesale: { unitName: 'Case', price: 300, cost: 216, factor: 24 },
    });
    const id = await saveDeliveryDraft({
      supplierId: sup,
      lines: [
        {
          productId: a,
          newProduct: null,
          enteredUnit: 'wholesale',
          enteredExpectedQty: 3,
          enteredReceivedQty: 3,
          enteredUnitCost: 240,
        },
      ],
    });
    await commitDeliveryReceipt(id);
    expect(await stockOf(a)).toEqual({ quantity: 72, cost_price: 10 });
  });

  it('review focus: same product on two lines adds both quantities', async () => {
    const sup = await seedSupplier('c-6');
    const a = await seedProduct({ name: 'A', sku: 'CA6', qty: 2, cost: 5 });
    const id = await saveDeliveryDraft({
      supplierId: sup,
      lines: [retail(a, 4, 4, 6), retail(a, 3, 3, 7)],
    });
    await commitDeliveryReceipt(id);
    expect(await stockOf(a)).toEqual({ quantity: 9, cost_price: 7 });
    const rows = await db.getAllAsync(
      'SELECT id FROM inventory_transactions WHERE receipt_id = ?',
      [id],
    );
    expect(rows).toHaveLength(2);
  });

  it('review focus: over-delivery restocks the full received qty with zero shortage', async () => {
    const sup = await seedSupplier('c-7');
    const a = await seedProduct({ name: 'A', sku: 'CA7', qty: 0 });
    const id = await saveDeliveryDraft({
      supplierId: sup,
      lines: [retail(a, 5, 9, 4)],
    });
    await commitDeliveryReceipt(id);
    expect((await stockOf(a)).quantity).toBe(9);
    expect((await getDeliveryReceipt(id))?.lines[0]?.shortageQty).toBe(0);
  });

  it('creates a quick-add product in the same transaction and links the line', async () => {
    const sup = await seedSupplier('c-8');
    const id = await saveDeliveryDraft({
      supplierId: sup,
      lines: [
        {
          productId: null,
          newProduct: {
            name: 'Mystery Candy',
            price: 150,
            barcode: '4800000000099',
          },
          enteredUnit: 'retail',
          enteredExpectedQty: 20,
          enteredReceivedQty: 18,
          enteredUnitCost: 100,
        },
      ],
    });
    await commitDeliveryReceipt(id);
    const detail = await getDeliveryReceipt(id);
    const pid = detail?.lines[0]?.productId;
    expect(pid).toBeGreaterThan(0);
    const product = await db.getFirstAsync<{
      name: string;
      price: number;
      barcode: string;
      supplier_id: string;
    }>('SELECT name, price, barcode, supplier_id FROM products WHERE id = ?', [
      pid ?? 0,
    ]);
    expect(product).toEqual({
      name: 'Mystery Candy',
      price: 150,
      barcode: '4800000000099',
      supplier_id: sup,
    });
    expect(await stockOf(pid ?? 0)).toEqual({ quantity: 18, cost_price: 100 });
  });

  it('failure on a later line rolls back everything (no partial restock, no quick-add product)', async () => {
    const sup = await seedSupplier('c-9');
    const a = await seedProduct({ name: 'A', sku: 'CA9', qty: 0 });
    const quick = (name: string, barcode?: string): DeliveryLineInput => ({
      productId: null,
      newProduct: barcode
        ? { name, price: 100, barcode }
        : { name, price: 100 },
      enteredUnit: 'retail',
      enteredExpectedQty: 1,
      enteredReceivedQty: 1,
      enteredUnitCost: 50,
    });
    const id = await saveDeliveryDraft({
      supplierId: sup,
      lines: [
        retail(a, 2, 2, 5),
        quick('Ghost'),
        quick('Late', '4800000000077'),
      ],
    });
    // Barcode becomes taken after the draft was saved, so line 3 fails mid-loop
    await seedProduct({
      name: 'Taken',
      sku: 'CA9B',
      barcode: '4800000000077',
    });
    await expect(commitDeliveryReceipt(id)).rejects.toBeInstanceOf(
      QuickAddBarcodeExistsError,
    );
    const detail = await getDeliveryReceipt(id);
    expect(detail?.status).toBe('draft');
    expect(
      detail?.lines.every((l) => l.productId === (l.newProduct ? null : a)),
    ).toBe(true);
    expect((await stockOf(a)).quantity).toBe(0);
    const ghosts = await db.getAllAsync(
      "SELECT id FROM products WHERE name = 'Ghost'",
    );
    expect(ghosts).toHaveLength(0);
    const txs = await db.getAllAsync(
      'SELECT id FROM inventory_transactions WHERE receipt_id = ?',
      [id],
    );
    expect(txs).toHaveLength(0);
  });

  it('overlapping commits of one receipt: exactly one succeeds, no double restock', async () => {
    const sup = await seedSupplier('c-11');
    const a = await seedProduct({ name: 'A', sku: 'CA11', qty: 0 });
    const id = await saveDeliveryDraft({
      supplierId: sup,
      lines: [retail(a, 3, 3, 10)],
    });
    const results = await Promise.allSettled([
      commitDeliveryReceipt(id),
      commitDeliveryReceipt(id),
    ]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    const rejected = results.filter((r) => r.status === 'rejected');
    expect(rejected).toHaveLength(1);
    expect((rejected[0] as PromiseRejectedResult).reason).toBeInstanceOf(
      ReceiptNotDraftError,
    );
    expect((await stockOf(a)).quantity).toBe(3);
    const rows = await db.getAllAsync(
      'SELECT id FROM inventory_transactions WHERE receipt_id = ?',
      [id],
    );
    expect(rows).toHaveLength(1);
  });

  it('releases the in-flight guard after a failed commit so a fixed draft can commit', async () => {
    const sup = await seedSupplier('c-12');
    const a = await seedProduct({ name: 'A', sku: 'CA12', qty: 0 });
    const id = await saveDeliveryDraft({
      supplierId: sup,
      lines: [
        {
          productId: null,
          newProduct: { name: 'Late2', price: 100, barcode: '4800000000066' },
          enteredUnit: 'retail',
          enteredExpectedQty: 1,
          enteredReceivedQty: 1,
          enteredUnitCost: 50,
        },
      ],
    });
    await seedProduct({
      name: 'Taken',
      sku: 'CA12B',
      barcode: '4800000000066',
    });
    await expect(commitDeliveryReceipt(id)).rejects.toBeInstanceOf(
      QuickAddBarcodeExistsError,
    );
    await saveDeliveryDraft({
      receiptId: id,
      supplierId: sup,
      lines: [retail(a, 2, 2, 5)],
    });
    await commitDeliveryReceipt(id);
    expect((await stockOf(a)).quantity).toBe(2);
  });
});
