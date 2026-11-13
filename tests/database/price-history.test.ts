import { db } from '@/configs/sqlite';
import {
  InvalidRepriceError,
  applyReprice,
  clearRepriceFlag,
  dismissRepriceFlag,
  evaluateRepriceFlag,
  getPriceHistory,
  getRepriceFlags,
  getRepriceFlagsForReceipt,
  recordPriceChange,
} from '@/database/priceHistory';
import { deleteProduct } from '@/database/products';
import { resetMockDb } from '../__setup__/expo-sqlite-mock';
import { seedProduct, setupDeliveryDb } from '../helpers/deliveryFixtures';

const priceOf = async (productId: number): Promise<number> => {
  const row = await db.getFirstAsync<{ price: number }>(
    'SELECT price FROM products WHERE id = ?',
    [productId],
  );
  if (!row) throw new Error(`product ${productId} missing`);
  return row.price;
};

const countRows = async (table: string, productId: number): Promise<number> => {
  const row = await db.getFirstAsync<{ n: number }>(
    `SELECT COUNT(*) AS n FROM ${table} WHERE product_id = ?`,
    [productId],
  );
  return row?.n ?? 0;
};

describe('priceHistory', () => {
  beforeAll(async () => {
    await setupDeliveryDb();
  });
  beforeEach(() => {
    resetMockDb();
  });

  describe('recordPriceChange', () => {
    it('writes a row when the value changes', async () => {
      const p = await seedProduct({ name: 'A', sku: 'H-A', cost: 10 });
      const wrote = await recordPriceChange(p, 'cost', 10, 12, 'delivery', 7);
      expect(wrote).toBe(true);
      const history = await getPriceHistory(p);
      expect(history).toHaveLength(1);
      expect(history[0]).toMatchObject({
        productId: p,
        field: 'cost',
        oldValue: 10,
        newValue: 12,
        source: 'delivery',
        receiptId: 7,
      });
    });

    it('writes nothing when the value is unchanged', async () => {
      const p = await seedProduct({ name: 'A', sku: 'H-A2', cost: 10 });
      const wrote = await recordPriceChange(p, 'cost', 10, 10, 'delivery');
      expect(wrote).toBe(false);
      expect(await getPriceHistory(p)).toEqual([]);
    });

    it('records a first value with a null old value', async () => {
      const p = await seedProduct({ name: 'A', sku: 'H-A3' });
      await recordPriceChange(p, 'cost', null, 10, 'manual_edit');
      const history = await getPriceHistory(p);
      expect(history[0]?.oldValue).toBeNull();
      expect(history[0]?.receiptId).toBeNull();
    });
  });

  describe('getPriceHistory', () => {
    it('returns newest first and respects the limit', async () => {
      const p = await seedProduct({ name: 'A', sku: 'H-A4', cost: 1 });
      for (let i = 1; i <= 12; i += 1) {
        await recordPriceChange(p, 'cost', i, i + 1, 'restock');
      }
      const history = await getPriceHistory(p);
      expect(history).toHaveLength(10);
      expect(history[0]?.newValue).toBe(13);
      expect(await getPriceHistory(p, 3)).toHaveLength(3);
    });
  });

  describe('evaluateRepriceFlag', () => {
    it('does not flag the first recorded cost', async () => {
      const p = await seedProduct({ name: 'A', sku: 'F-A', price: 13 });
      await evaluateRepriceFlag(p, null, 10, 13);
      expect(await getRepriceFlags()).toEqual([]);
    });

    it('flags a cost rise with the baseline cost and current price', async () => {
      const p = await seedProduct({
        name: 'Soda',
        sku: 'F-B',
        cost: 10,
        price: 13,
      });
      await evaluateRepriceFlag(p, 10, 12, 13, 5);
      const flags = await getRepriceFlags();
      expect(flags).toHaveLength(1);
      expect(flags[0]).toMatchObject({
        productId: p,
        productName: 'Soda',
        baselineCost: 10,
        newCost: 12,
        priceAtFlag: 13,
        currentPrice: 13,
        receiptId: 5,
      });
    });

    it('does not flag an unchanged or lower cost', async () => {
      const p = await seedProduct({
        name: 'A',
        sku: 'F-C',
        cost: 10,
        price: 13,
      });
      await evaluateRepriceFlag(p, 10, 10, 13);
      await evaluateRepriceFlag(p, 10, 8, 13);
      expect(await getRepriceFlags()).toEqual([]);
    });

    it('review focus: a second rise keeps the baseline cost and price at flag', async () => {
      const p = await seedProduct({
        name: 'A',
        sku: 'F-D',
        cost: 10,
        price: 13,
      });
      await evaluateRepriceFlag(p, 10, 12, 13, 5);
      await evaluateRepriceFlag(p, 12, 15, 13, 6);
      const flags = await getRepriceFlags();
      expect(flags).toHaveLength(1);
      expect(flags[0]).toMatchObject({
        baselineCost: 10,
        newCost: 15,
        priceAtFlag: 13,
        receiptId: 6,
      });
    });

    it('updates new cost when cost falls but stays above the baseline', async () => {
      const p = await seedProduct({
        name: 'A',
        sku: 'F-E',
        cost: 10,
        price: 13,
      });
      await evaluateRepriceFlag(p, 10, 15, 13);
      await evaluateRepriceFlag(p, 15, 11, 13);
      const flags = await getRepriceFlags();
      expect(flags[0]).toMatchObject({ baselineCost: 10, newCost: 11 });
    });

    it('clears the flag when cost falls back to the baseline or lower', async () => {
      const p = await seedProduct({
        name: 'A',
        sku: 'F-F',
        cost: 10,
        price: 13,
      });
      await evaluateRepriceFlag(p, 10, 12, 13);
      await evaluateRepriceFlag(p, 12, 10, 13);
      expect(await getRepriceFlags()).toEqual([]);
    });
  });

  describe('getRepriceFlagsForReceipt', () => {
    it('returns only the flags last touched by that receipt', async () => {
      const a = await seedProduct({
        name: 'A',
        sku: 'R-A',
        cost: 10,
        price: 13,
      });
      const b = await seedProduct({
        name: 'B',
        sku: 'R-B',
        cost: 10,
        price: 13,
      });
      const c = await seedProduct({
        name: 'C',
        sku: 'R-C',
        cost: 10,
        price: 13,
      });
      await evaluateRepriceFlag(a, 10, 12, 13, 5);
      await evaluateRepriceFlag(b, 10, 12, 13, 6);
      await evaluateRepriceFlag(c, 10, 12, 13, null);
      const forFive = await getRepriceFlagsForReceipt(5);
      expect(forFive.map((f) => f.productId)).toEqual([a]);
      expect(await getRepriceFlags()).toHaveLength(3);
    });
  });

  describe('dismissRepriceFlag', () => {
    it('removes the flag and leaves the price unchanged', async () => {
      const p = await seedProduct({
        name: 'A',
        sku: 'D-A',
        cost: 10,
        price: 13,
      });
      await evaluateRepriceFlag(p, 10, 12, 13);
      await dismissRepriceFlag(p);
      expect(await getRepriceFlags()).toEqual([]);
      expect(await priceOf(p)).toBe(13);
      expect(await getPriceHistory(p)).toEqual([]);
    });

    it('is a no-op when there is no flag', async () => {
      const p = await seedProduct({
        name: 'A',
        sku: 'D-B',
        cost: 10,
        price: 13,
      });
      await expect(dismissRepriceFlag(p)).resolves.toBeUndefined();
      await expect(clearRepriceFlag(p)).resolves.toBeUndefined();
    });
  });

  describe('applyReprice', () => {
    it('updates the price, writes history, and clears the flag', async () => {
      const p = await seedProduct({
        name: 'A',
        sku: 'P-A',
        cost: 10,
        price: 13,
      });
      await evaluateRepriceFlag(p, 10, 12, 13);
      await applyReprice(p, 16);
      expect(await priceOf(p)).toBe(16);
      expect(await getRepriceFlags()).toEqual([]);
      const history = await getPriceHistory(p);
      expect(history).toHaveLength(1);
      expect(history[0]).toMatchObject({
        field: 'price',
        oldValue: 13,
        newValue: 16,
        source: 'reprice',
      });
    });

    it('clears the flag and writes no history when the price is unchanged', async () => {
      const p = await seedProduct({
        name: 'A',
        sku: 'P-B',
        cost: 10,
        price: 13,
      });
      await evaluateRepriceFlag(p, 10, 12, 13);
      await applyReprice(p, 13);
      expect(await getRepriceFlags()).toEqual([]);
      expect(await getPriceHistory(p)).toEqual([]);
    });

    it('allows a price below the new cost', async () => {
      const p = await seedProduct({
        name: 'A',
        sku: 'P-C',
        cost: 10,
        price: 13,
      });
      await evaluateRepriceFlag(p, 10, 20, 13);
      await applyReprice(p, 15);
      expect(await priceOf(p)).toBe(15);
    });

    it('rejects zero, negative, and non-finite prices and changes nothing', async () => {
      const p = await seedProduct({
        name: 'A',
        sku: 'P-D',
        cost: 10,
        price: 13,
      });
      await evaluateRepriceFlag(p, 10, 12, 13);
      for (const bad of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
        await expect(applyReprice(p, bad)).rejects.toBeInstanceOf(
          InvalidRepriceError,
        );
      }
      expect(await priceOf(p)).toBe(13);
      expect(await getRepriceFlags()).toHaveLength(1);
    });

    it('rejects an unknown product', async () => {
      await expect(applyReprice(999999, 10)).rejects.toThrow(
        'Product with ID 999999 not found',
      );
    });
  });

  describe('product deletion', () => {
    it('review focus: deleting a flagged product removes its flag and history', async () => {
      const p = await seedProduct({
        name: 'A',
        sku: 'X-A',
        cost: 10,
        price: 13,
      });
      await recordPriceChange(p, 'cost', 10, 12, 'delivery');
      await evaluateRepriceFlag(p, 10, 12, 13);
      await deleteProduct(p);
      expect(await countRows('reprice_flags', p)).toBe(0);
      expect(await countRows('product_price_changes', p)).toBe(0);
      expect(await getRepriceFlags()).toEqual([]);
    });
  });
});
