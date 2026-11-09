import { db } from '@/configs/sqlite';
import {
  applyInventoryTransaction,
  insertInventoryTransaction,
} from '@/database/inventory';
import { resetMockDb } from './__setup__/expo-sqlite-mock';
import {
  seedProduct,
  seedSupplier,
  setupDeliveryDb,
  stockOf,
} from './helpers/deliveryFixtures';

describe('applyInventoryTransaction', () => {
  beforeAll(async () => {
    await setupDeliveryDb();
  });
  beforeEach(() => {
    resetMockDb();
  });

  it('restock updates quantity and cost_price and stores receipt_id', async () => {
    const supplier = await seedSupplier('sup-x');
    const pid = await seedProduct({
      name: 'Rice',
      sku: 'R1',
      qty: 5,
      cost: 40,
    });
    await db.withTransactionAsync(async () => {
      await applyInventoryTransaction({
        product_id: pid,
        type: 'restock',
        quantity: 10,
        unit_cost: 45,
        supplier_id: supplier,
        receipt_id: 7,
      });
    });
    expect(await stockOf(pid)).toEqual({ quantity: 15, cost_price: 45 });
    const row = await db.getFirstAsync<{ receipt_id: number | null }>(
      "SELECT receipt_id FROM inventory_transactions WHERE product_id = ? AND type = 'restock' ORDER BY id DESC",
      [pid],
    );
    expect(row?.receipt_id).toBe(7);
  });

  it('refuses to go below zero', async () => {
    const pid = await seedProduct({ name: 'Egg', sku: 'E1', qty: 2 });
    await expect(
      applyInventoryTransaction({
        product_id: pid,
        type: 'adjustment',
        adjustment_sign: 'negative',
        quantity: 3,
      }),
    ).rejects.toThrow("Can't go below zero.");
    expect((await stockOf(pid)).quantity).toBe(2);
  });

  it('insertInventoryTransaction wrapper still works and returns the id', async () => {
    const pid = await seedProduct({ name: 'Salt', sku: 'S1', qty: 1 });
    const id = await insertInventoryTransaction({
      product_id: pid,
      type: 'restock',
      quantity: 4,
    });
    expect(id).toBeGreaterThan(0);
    expect((await stockOf(pid)).quantity).toBe(5);
  });
});
