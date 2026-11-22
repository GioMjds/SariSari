import { db } from '@/configs/sqlite';
import {
  correctSalePrice,
  getSale,
  initCashTables,
  initCorrectionsTable,
  initCreditsTable,
  initInventoryTable,
  initProductsTable,
  initSalesTables,
  initSettingsTable,
  insertProduct,
  insertSale,
  runMigrations,
} from '@/database';
import { resetMockDb } from '../__setup__/expo-sqlite-mock';

const ACTOR = { actorUser: 'owner', witnessUser: null, reasonCode: 'misprinted_price' };

const seedSale = async () => {
  // A case of 24 sells for 500; bread sells per piece for 10.
  const caseProduct = await insertProduct(
    'Softdrink', 'SD-1', 25, 48, 18, undefined, null, null, null, 'Pc', 'Case', 500, 400, 24,
  );
  const bread = await insertProduct('Bread', 'BR-1', 10, 20, 6);
  const saleId = await insertSale([
    { product_id: caseProduct, quantity: 1, price: 500, selected_unit: 'wholesale' },
    { product_id: bread, quantity: 2, price: 10 },
  ]);
  const sale = await getSale(saleId);
  return { saleId, items: sale!.items };
};

describe('correctSalePrice with a wholesale line', () => {
  beforeAll(async () => {
    await initProductsTable();
    await initInventoryTable();
    await initSalesTables();
    await initCreditsTable();
    await initCorrectionsTable();
    await initSettingsTable();
    await initCashTables();
    await runMigrations();
  });
  beforeEach(() => {
    resetMockDb();
  });

  it('recomputes the total from sold units, not pieces deducted', async () => {
    const { saleId, items } = await seedSale();
    const breadLine = items.find((i) => i.product_name === 'Bread')!;

    await correctSalePrice(saleId, {
      ...ACTOR,
      priceChanges: [{ saleItemId: breadLine.id, newPrice: 8 }],
    });

    const row = await db.getFirstAsync<{ total: number }>(
      'SELECT total FROM sales WHERE id = ?',
      [saleId],
    );
    expect(row?.total).toBe(500 + 2 * 8);
  });

  it('applies the price delta per case on the wholesale line', async () => {
    const { saleId, items } = await seedSale();
    const caseLine = items.find((i) => i.product_name === 'Softdrink')!;
    expect(caseLine.quantity).toBe(24);

    await correctSalePrice(saleId, {
      ...ACTOR,
      priceChanges: [{ saleItemId: caseLine.id, newPrice: 480 }],
    });

    const row = await db.getFirstAsync<{ total: number }>(
      'SELECT total FROM sales WHERE id = ?',
      [saleId],
    );
    expect(row?.total).toBe(480 + 20);
  });
});
