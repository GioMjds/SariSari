import { db } from '@/configs/sqlite';
import {
  commitDeliveryReceipt,
  saveDeliveryDraft,
  voidDeliveryReceipt,
} from '@/database/deliveries';
import { insertInventoryTransaction } from '@/database/inventory';
import {
  dismissRepriceFlag,
  getPriceHistory,
  getRepriceFlags,
  getRepriceFlagsForReceipt,
} from '@/database/priceHistory';
import type { DeliveryLineInput } from '@/types/deliveries.types';
import { resetMockDb } from '../__setup__/expo-sqlite-mock';
import {
  seedProduct,
  seedSupplier,
  setupDeliveryDb,
} from '../helpers/deliveryFixtures';
import { expectRejection } from '../helpers/expectRejection';

const retail = (
  productId: number,
  qty: number,
  cost: number,
): DeliveryLineInput => ({
  productId,
  newProduct: null,
  enteredUnit: 'retail',
  enteredExpectedQty: qty,
  enteredReceivedQty: qty,
  enteredUnitCost: cost,
});

const totalRows = async (table: string): Promise<number> => {
  const row = await db.getFirstAsync<{ n: number }>(
    `SELECT COUNT(*) AS n FROM ${table}`,
  );
  return row?.n ?? 0;
};

describe('cost history on restock', () => {
  beforeAll(async () => {
    await setupDeliveryDb();
  });
  beforeEach(() => {
    resetMockDb();
  });

  it('delivery commit logs a cost rise and flags the product for that receipt', async () => {
    const sup = await seedSupplier('ph-1');
    const a = await seedProduct({
      name: 'A',
      sku: 'PH-A',
      cost: 10,
      price: 13,
    });
    const id = await saveDeliveryDraft({
      supplierId: sup,
      lines: [retail(a, 5, 12)],
    });

    await commitDeliveryReceipt(id);

    const history = await getPriceHistory(a);
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({
      field: 'cost',
      oldValue: 10,
      newValue: 12,
      source: 'delivery',
      receiptId: id,
    });
    const flags = await getRepriceFlagsForReceipt(id);
    expect(flags).toHaveLength(1);
    expect(flags[0]).toMatchObject({
      productId: a,
      baselineCost: 10,
      newCost: 12,
      priceAtFlag: 13,
    });
  });

  it('delivery commit with an unchanged cost logs nothing', async () => {
    const sup = await seedSupplier('ph-2');
    const a = await seedProduct({
      name: 'A',
      sku: 'PH-B',
      cost: 10,
      price: 13,
    });
    const id = await saveDeliveryDraft({
      supplierId: sup,
      lines: [retail(a, 5, 10)],
    });
    await commitDeliveryReceipt(id);
    expect(await getPriceHistory(a)).toEqual([]);
    expect(await getRepriceFlags()).toEqual([]);
  });

  it('delivery commit with a lower cost logs history and does not flag', async () => {
    const sup = await seedSupplier('ph-3');
    const a = await seedProduct({
      name: 'A',
      sku: 'PH-C',
      cost: 10,
      price: 13,
    });
    const id = await saveDeliveryDraft({
      supplierId: sup,
      lines: [retail(a, 5, 8)],
    });
    await commitDeliveryReceipt(id);
    const history = await getPriceHistory(a);
    expect(history[0]).toMatchObject({ oldValue: 10, newValue: 8 });
    expect(await getRepriceFlags()).toEqual([]);
  });

  it('a product with no previous cost logs a first cost and is not flagged', async () => {
    const sup = await seedSupplier('ph-4');
    const a = await seedProduct({ name: 'A', sku: 'PH-D', price: 13 });
    const id = await saveDeliveryDraft({
      supplierId: sup,
      lines: [retail(a, 5, 9)],
    });
    await commitDeliveryReceipt(id);
    const history = await getPriceHistory(a);
    expect(history[0]).toMatchObject({ oldValue: null, newValue: 9 });
    expect(await getRepriceFlags()).toEqual([]);
  });

  it('a failed commit leaves no history rows and no flags', async () => {
    const sup = await seedSupplier('ph-5');
    const a = await seedProduct({
      name: 'A',
      sku: 'PH-E',
      cost: 10,
      price: 13,
    });
    const id = await saveDeliveryDraft({
      supplierId: sup,
      lines: [retail(a, 5, 12)],
    });
    // Force a failure after the stock, history, and flag writes: the status
    // flip is the last statement of the commit transaction.
    await db.execAsync(`
      CREATE TRIGGER fail_commit BEFORE UPDATE OF status ON delivery_receipts
      BEGIN SELECT RAISE(ABORT, 'forced failure'); END;
    `);
    try {
      await expectRejection(commitDeliveryReceipt(id), 'forced failure');
    } finally {
      await db.execAsync('DROP TRIGGER fail_commit;');
    }
    expect(await totalRows('product_price_changes')).toBe(0);
    expect(await totalRows('reprice_flags')).toBe(0);
  });

  it('review focus: a manual restock with no receipt flags with source restock', async () => {
    const a = await seedProduct({
      name: 'A',
      sku: 'PH-F',
      cost: 10,
      price: 13,
    });
    await insertInventoryTransaction({
      product_id: a,
      type: 'restock',
      quantity: 3,
      unit_cost: 14,
    });
    const history = await getPriceHistory(a);
    expect(history[0]).toMatchObject({
      source: 'restock',
      receiptId: null,
      newValue: 14,
    });
    const flags = await getRepriceFlags();
    expect(flags).toHaveLength(1);
    expect(flags[0]?.receiptId).toBeNull();
    expect(await getRepriceFlagsForReceipt(1)).toEqual([]);
  });

  it('a restock with no unit cost logs nothing', async () => {
    const a = await seedProduct({
      name: 'A',
      sku: 'PH-G',
      cost: 10,
      price: 13,
    });
    await insertInventoryTransaction({
      product_id: a,
      type: 'restock',
      quantity: 3,
    });
    expect(await getPriceHistory(a)).toEqual([]);
  });

  it('review focus: two deliveries raising the cost keep the first baseline', async () => {
    const sup = await seedSupplier('ph-6');
    const a = await seedProduct({
      name: 'A',
      sku: 'PH-H',
      cost: 10,
      price: 13,
    });
    const first = await saveDeliveryDraft({
      supplierId: sup,
      lines: [retail(a, 5, 12)],
    });
    await commitDeliveryReceipt(first);
    const second = await saveDeliveryDraft({
      supplierId: sup,
      lines: [retail(a, 5, 15)],
    });
    await commitDeliveryReceipt(second);

    const flags = await getRepriceFlags();
    expect(flags).toHaveLength(1);
    expect(flags[0]).toMatchObject({
      baselineCost: 10,
      newCost: 15,
      priceAtFlag: 13,
      receiptId: second,
    });
    expect(await getRepriceFlagsForReceipt(first)).toEqual([]);
  });

  it('review focus: voiding the delivery keeps the flag, and dismiss still works', async () => {
    const sup = await seedSupplier('ph-7');
    const a = await seedProduct({
      name: 'A',
      sku: 'PH-I',
      cost: 10,
      price: 13,
    });
    const id = await saveDeliveryDraft({
      supplierId: sup,
      lines: [retail(a, 5, 12)],
    });
    await commitDeliveryReceipt(id);
    await voidDeliveryReceipt(id, 'wrong supplier');

    expect(await getRepriceFlags()).toHaveLength(1);
    await dismissRepriceFlag(a);
    expect(await getRepriceFlags()).toEqual([]);
  });
});
