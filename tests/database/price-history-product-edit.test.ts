import { getPriceHistory, getRepriceFlags } from '@/database/priceHistory';
import { updateProduct } from '@/database/products';
import { resetMockDb } from '../__setup__/expo-sqlite-mock';
import { seedProduct, setupDeliveryDb } from '../helpers/deliveryFixtures';

// updateProduct(id, name, sku, price, quantity, cost_price?)
const edit = (
  id: number,
  sku: string,
  price: number,
  cost: number | undefined,
) => updateProduct(id, 'Item', sku, price, 0, cost);

describe('price history on manual product edit', () => {
  beforeAll(async () => {
    await setupDeliveryDb();
  });
  beforeEach(() => {
    resetMockDb();
  });

  it('logs nothing when neither cost nor price changes', async () => {
    const p = await seedProduct({
      name: 'Item',
      sku: 'E-A',
      cost: 10,
      price: 13,
    });
    await edit(p, 'E-A', 13, 10);
    expect(await getPriceHistory(p)).toEqual([]);
    expect(await getRepriceFlags()).toEqual([]);
  });

  it('logs a price change with source manual_edit', async () => {
    const p = await seedProduct({
      name: 'Item',
      sku: 'E-B',
      cost: 10,
      price: 13,
    });
    await edit(p, 'E-B', 15, 10);
    const history = await getPriceHistory(p);
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({
      field: 'price',
      oldValue: 13,
      newValue: 15,
      source: 'manual_edit',
      receiptId: null,
    });
  });

  it('a cost rise with an unchanged price logs cost and flags the product', async () => {
    const p = await seedProduct({
      name: 'Item',
      sku: 'E-C',
      cost: 10,
      price: 13,
    });
    await edit(p, 'E-C', 13, 12);
    const history = await getPriceHistory(p);
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({
      field: 'cost',
      oldValue: 10,
      newValue: 12,
      source: 'manual_edit',
    });
    const flags = await getRepriceFlags();
    expect(flags).toHaveLength(1);
    expect(flags[0]).toMatchObject({
      baselineCost: 10,
      newCost: 12,
      priceAtFlag: 13,
      receiptId: null,
    });
  });

  it('changing cost and price together logs both and leaves no flag', async () => {
    const p = await seedProduct({
      name: 'Item',
      sku: 'E-D',
      cost: 10,
      price: 13,
    });
    await edit(p, 'E-D', 16, 12);
    const fields = (await getPriceHistory(p)).map((h) => h.field).sort();
    expect(fields).toEqual(['cost', 'price']);
    expect(await getRepriceFlags()).toEqual([]);
  });

  it('a price edit removes an existing flag', async () => {
    const p = await seedProduct({
      name: 'Item',
      sku: 'E-E',
      cost: 10,
      price: 13,
    });
    await edit(p, 'E-E', 13, 12);
    expect(await getRepriceFlags()).toHaveLength(1);
    await edit(p, 'E-E', 16, 12);
    expect(await getRepriceFlags()).toEqual([]);
  });

  it('lowering the cost back to the baseline removes the flag', async () => {
    const p = await seedProduct({
      name: 'Item',
      sku: 'E-F',
      cost: 10,
      price: 13,
    });
    await edit(p, 'E-F', 13, 12);
    await edit(p, 'E-F', 13, 10);
    expect(await getRepriceFlags()).toEqual([]);
  });

  it('a first cost on a product with none logs and does not flag', async () => {
    const p = await seedProduct({ name: 'Item', sku: 'E-G', price: 13 });
    await edit(p, 'E-G', 13, 9);
    const history = await getPriceHistory(p);
    expect(history[0]).toMatchObject({
      field: 'cost',
      oldValue: null,
      newValue: 9,
    });
    expect(await getRepriceFlags()).toEqual([]);
  });

  it('clearing the cost removes the flag and writes no cost row', async () => {
    const p = await seedProduct({
      name: 'Item',
      sku: 'E-H',
      cost: 10,
      price: 13,
    });
    await edit(p, 'E-H', 13, 12);
    const before = (await getPriceHistory(p)).length;
    await edit(p, 'E-H', 13, undefined);
    expect(await getRepriceFlags()).toEqual([]);
    expect(await getPriceHistory(p)).toHaveLength(before);
  });
});
