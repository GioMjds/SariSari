import { db } from '@/configs/sqlite';
import {
  ReceiptAlreadyVoidedError,
  ReceiptNotCommittedError,
  VoidWouldGoNegativeError,
  commitDeliveryReceipt,
  getDeliveryReceipt,
  saveDeliveryDraft,
  voidDeliveryReceipt,
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

describe('voidDeliveryReceipt', () => {
  beforeAll(async () => {
    await setupDeliveryDb();
  });
  beforeEach(() => {
    resetMockDb();
  });

  it('reverses stock with negative adjustment rows tagged with the receipt id', async () => {
    const sup = await seedSupplier('v-1');
    const a = await seedProduct({ name: 'A', sku: 'VA', qty: 5, cost: 10 });
    const id = await saveDeliveryDraft({
      supplierId: sup,
      lines: [retail(a, 4, 4, 12)],
    });
    await commitDeliveryReceipt(id);
    expect((await stockOf(a)).quantity).toBe(9);

    await voidDeliveryReceipt(id, 'Wrong supplier');

    expect(await stockOf(a)).toEqual({ quantity: 5, cost_price: 12 });
    const rows = await db.getAllAsync<{
      type: string;
      adjustment_sign: string | null;
      quantity: number;
    }>(
      "SELECT type, adjustment_sign, quantity FROM inventory_transactions WHERE receipt_id = ? AND type = 'adjustment'",
      [id],
    );
    expect(rows).toEqual([
      { type: 'adjustment', adjustment_sign: 'negative', quantity: 4 },
    ]);
    const detail = await getDeliveryReceipt(id);
    expect(detail?.status).toBe('voided');
    expect(detail?.voidReason).toBe('Wrong supplier');
    expect(detail?.voidedAt).not.toBeNull();
  });

  it('review focus: refuses when stock was sold since, names the product, changes nothing', async () => {
    const sup = await seedSupplier('v-2');
    const a = await seedProduct({
      name: 'Sold Out Item',
      sku: 'VB',
      qty: 0,
      cost: 10,
    });
    const id = await saveDeliveryDraft({
      supplierId: sup,
      lines: [retail(a, 5, 5, 12)],
    });
    await commitDeliveryReceipt(id);
    await db.runAsync('UPDATE products SET quantity = 2 WHERE id = ?', [a]);

    const err = await voidDeliveryReceipt(id, 'oops').catch((e: unknown) => e);
    expect(err).toBeInstanceOf(VoidWouldGoNegativeError);
    expect((err as VoidWouldGoNegativeError).shortfalls).toEqual([
      { productId: a, productName: 'Sold Out Item', needed: 5, onHand: 2 },
    ]);
    expect((await stockOf(a)).quantity).toBe(2);
    expect((await getDeliveryReceipt(id))?.status).toBe('committed');
  });

  it('review focus: same product on two lines is reversed as one total, checked against stock once', async () => {
    const sup = await seedSupplier('v-3');
    const a = await seedProduct({ name: 'A', sku: 'VC', qty: 0 });
    const id = await saveDeliveryDraft({
      supplierId: sup,
      lines: [retail(a, 4, 4, 6), retail(a, 3, 3, 7)],
    });
    await commitDeliveryReceipt(id);
    await db.runAsync('UPDATE products SET quantity = 6 WHERE id = ?', [a]);
    await expect(voidDeliveryReceipt(id, 'x')).rejects.toBeInstanceOf(
      VoidWouldGoNegativeError,
    );
    await db.runAsync('UPDATE products SET quantity = 7 WHERE id = ?', [a]);
    await voidDeliveryReceipt(id, 'x');
    expect((await stockOf(a)).quantity).toBe(0);
  });

  it('refuses a draft and an already-voided receipt', async () => {
    const sup = await seedSupplier('v-4');
    const a = await seedProduct({ name: 'A', sku: 'VD' });
    const id = await saveDeliveryDraft({
      supplierId: sup,
      lines: [retail(a, 1, 1, 5)],
    });
    await expect(voidDeliveryReceipt(id, 'x')).rejects.toBeInstanceOf(
      ReceiptNotCommittedError,
    );
    await commitDeliveryReceipt(id);
    await voidDeliveryReceipt(id, 'x');
    await expect(voidDeliveryReceipt(id, 'again')).rejects.toBeInstanceOf(
      ReceiptAlreadyVoidedError,
    );
  });

  it('requires a non-empty reason', async () => {
    const sup = await seedSupplier('v-5');
    const a = await seedProduct({ name: 'A', sku: 'VE' });
    const id = await saveDeliveryDraft({
      supplierId: sup,
      lines: [retail(a, 1, 1, 5)],
    });
    await commitDeliveryReceipt(id);
    await expect(voidDeliveryReceipt(id, '   ')).rejects.toThrow('reason');
  });

  it('overlapping voids: exactly one succeeds and stock is reversed once', async () => {
    const sup = await seedSupplier('v-6');
    const a = await seedProduct({ name: 'A', sku: 'VF', qty: 10, cost: 10 });
    const id = await saveDeliveryDraft({
      supplierId: sup,
      lines: [retail(a, 4, 4, 12)],
    });
    await commitDeliveryReceipt(id);
    expect((await stockOf(a)).quantity).toBe(14);

    const results = await Promise.allSettled([
      voidDeliveryReceipt(id, 'first'),
      voidDeliveryReceipt(id, 'second'),
    ]);

    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    const rejected = results.filter((r) => r.status === 'rejected');
    expect(rejected).toHaveLength(1);
    expect((rejected[0] as PromiseRejectedResult).reason).toBeInstanceOf(
      ReceiptAlreadyVoidedError,
    );
    expect((await stockOf(a)).quantity).toBe(10);
    const rows = await db.getAllAsync<{ id: number }>(
      "SELECT id FROM inventory_transactions WHERE receipt_id = ? AND type = 'adjustment'",
      [id],
    );
    expect(rows).toHaveLength(1);
  });

  it('releases the in-flight guard after a failed void so a later void works', async () => {
    const sup = await seedSupplier('v-7');
    const a = await seedProduct({ name: 'A', sku: 'VG', qty: 0, cost: 10 });
    const id = await saveDeliveryDraft({
      supplierId: sup,
      lines: [retail(a, 3, 3, 12)],
    });
    await commitDeliveryReceipt(id);
    await db.runAsync('UPDATE products SET quantity = 1 WHERE id = ?', [a]);
    await expect(voidDeliveryReceipt(id, 'x')).rejects.toBeInstanceOf(
      VoidWouldGoNegativeError,
    );

    await db.runAsync('UPDATE products SET quantity = 3 WHERE id = ?', [a]);
    await voidDeliveryReceipt(id, 'x');

    expect((await stockOf(a)).quantity).toBe(0);
    expect((await getDeliveryReceipt(id))?.status).toBe('voided');
  });
});
