import { db } from '@/configs/sqlite';
import { resetMockDb } from '../__setup__/expo-sqlite-mock';
import { seedProduct, setupDeliveryDb } from '../helpers/deliveryFixtures';

describe('migration v24: price history and reprice flags', () => {
  beforeAll(async () => {
    await setupDeliveryDb();
  });
  beforeEach(() => {
    resetMockDb();
  });

  it('sets user_version to at least 24', async () => {
    const row = await db.getFirstAsync<{ user_version: number }>(
      'PRAGMA user_version',
    );
    expect(row?.user_version).toBeGreaterThanOrEqual(24);
  });

  it('creates product_price_changes with the expected columns', async () => {
    const cols = await db.getAllAsync<{ name: string }>(
      'PRAGMA table_info(product_price_changes)',
    );
    expect(cols.map((c) => c.name).sort()).toEqual(
      [
        'created_at',
        'field',
        'id',
        'new_value',
        'old_value',
        'product_id',
        'receipt_id',
        'source',
      ].sort(),
    );
  });

  it('creates reprice_flags with the expected columns', async () => {
    const cols = await db.getAllAsync<{ name: string }>(
      'PRAGMA table_info(reprice_flags)',
    );
    expect(cols.map((c) => c.name).sort()).toEqual(
      [
        'baseline_cost',
        'created_at',
        'new_cost',
        'price_at_flag',
        'product_id',
        'receipt_id',
      ].sort(),
    );
  });

  it('rejects an unknown field and an unknown source', async () => {
    const p = await seedProduct({ name: 'A', sku: 'M-A', cost: 10 });
    await expect(
      db.runAsync(
        "INSERT INTO product_price_changes (product_id, field, old_value, new_value, source, created_at) VALUES (?, 'bogus', 1, 2, 'delivery', 'x')",
        [p],
      ),
    ).rejects.toThrow();
    await expect(
      db.runAsync(
        "INSERT INTO product_price_changes (product_id, field, old_value, new_value, source, created_at) VALUES (?, 'cost', 1, 2, 'bogus', 'x')",
        [p],
      ),
    ).rejects.toThrow();
  });

  it('allows only one flag per product', async () => {
    const p = await seedProduct({ name: 'B', sku: 'M-B', cost: 10 });
    const insert = () =>
      db.runAsync(
        "INSERT INTO reprice_flags (product_id, baseline_cost, new_cost, price_at_flag, created_at) VALUES (?, 10, 12, 13, 'x')",
        [p],
      );
    await insert();
    await expect(insert()).rejects.toThrow();
  });
});
