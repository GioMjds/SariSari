import { db } from '@/configs/sqlite';
import { resetMockDb } from '../__setup__/expo-sqlite-mock';
import { seedSupplier, setupDeliveryDb } from '../helpers/deliveryFixtures';

describe('migration v23: delivery receipts', () => {
  beforeAll(async () => {
    await setupDeliveryDb();
  });
  beforeEach(() => {
    resetMockDb();
  });

  it('sets user_version to at least 23', async () => {
    const row = await db.getFirstAsync<{ user_version: number }>(
      'PRAGMA user_version',
    );
    expect(row?.user_version).toBeGreaterThanOrEqual(23);
  });

  it('adds receipt_id to inventory_transactions', async () => {
    const cols = await db.getAllAsync<{ name: string }>(
      'PRAGMA table_info(inventory_transactions)',
    );
    expect(cols.some((c) => c.name === 'receipt_id')).toBe(true);
  });

  it('allows only one draft per supplier', async () => {
    await seedSupplier('sup-a');
    await db.runAsync(
      "INSERT INTO delivery_receipts (supplier_id, status) VALUES ('sup-a', 'draft')",
    );
    await expect(
      db.runAsync(
        "INSERT INTO delivery_receipts (supplier_id, status) VALUES ('sup-a', 'draft')",
      ),
    ).rejects.toThrow();
    await db.runAsync(
      "INSERT INTO delivery_receipts (supplier_id, status) VALUES ('sup-a', 'committed')",
    );
  });

  it('rejects an unknown status', async () => {
    await seedSupplier('sup-b');
    await expect(
      db.runAsync(
        "INSERT INTO delivery_receipts (supplier_id, status) VALUES ('sup-b', 'bogus')",
      ),
    ).rejects.toThrow();
  });
});
