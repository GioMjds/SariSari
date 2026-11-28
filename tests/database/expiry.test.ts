import { db } from '@/configs/sqlite';
import {
  commitDeliveryReceipt,
  createSupplier,
  getProductsPage,
  getWriteOffCost,
  initCashMovementsView,
  initCashTables,
  initCorrectionsTable,
  initCreditsTable,
  initDigitalServicesTables,
  initFinancialEntriesTable,
  initInventoryTable,
  initProductsTable,
  initSalesTables,
  initSettingsTable,
  initSuppliersTable,
  insertInventoryTransaction,
  insertProduct,
  runMigrations,
  saveDeliveryDraft,
  updateProduct,
} from '@/database';
import { addDaysIso } from '@/lib/dueDates';
import { resetMockDb } from '../__setup__/expo-sqlite-mock';

let mockUuid = 0;
jest.mock('expo-crypto', () => ({
  randomUUID: () => `supplier-${++mockUuid}`,
}));

// insertProduct and updateProduct are positional; these helpers keep call sites readable.
const mk = (
  name: string,
  expiry: string | null,
  warn: number | null = null,
  qty = 5,
) =>
  insertProduct(
    name,
    name,
    10,
    qty,
    5,
    undefined,
    undefined,
    undefined,
    undefined,
    'Pc',
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    expiry,
    warn,
  );

const productExpiry = async (id: number) =>
  (
    await db.getFirstAsync<{ expiry_date: string | null }>(
      'SELECT expiry_date FROM products WHERE id = ?',
      [id],
    )
  )?.expiry_date;

const receive = async (productId: number, expiryDate: string | null) => {
  const s = await createSupplier({
    name: `Agent ${mockUuid}`,
    contact: null,
    notes: null,
  });
  const receiptId = await saveDeliveryDraft({
    supplierId: s.id,
    lines: [
      {
        productId,
        newProduct: null,
        enteredUnit: 'retail',
        enteredExpectedQty: 5,
        enteredReceivedQty: 5,
        enteredUnitCost: 10,
        expiryDate,
      },
    ],
  });
  await commitDeliveryReceipt(receiptId);
};

const nearExpiryNames = async (nearExpiryDays: number) =>
  (
    await getProductsPage({
      cursor: null,
      limit: 50,
      alert: 'near_expiry',
      nearExpiryDays,
    })
  ).items
    .map((p) => p.name)
    .sort();

describe('expiry dates', () => {
  beforeAll(async () => {
    await initProductsTable();
    await initInventoryTable();
    await initSalesTables();
    await initCreditsTable();
    await initCorrectionsTable();
    await initSettingsTable();
    await initCashTables();
    await initSuppliersTable();
    await initDigitalServicesTables();
    await initFinancialEntriesTable();
    await runMigrations();
    await initCashMovementsView();
  });
  beforeEach(() => {
    resetMockDb();
  });

  it('v29 adds the expiry columns and re-running migrations is safe', async () => {
    await runMigrations();
    const cols = async (table: string) =>
      (
        await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`)
      ).map((c) => c.name);
    expect(await cols('products')).toEqual(
      expect.arrayContaining(['expiry_date', 'expiry_warn_days']),
    );
    expect(await cols('delivery_receipt_lines')).toContain('expiry_date');
  });

  it('commit keeps the earliest date and never pushes it out', async () => {
    const id = await mk('Sardines', null, null, 0);
    const soon = addDaysIso(10);
    const later = addDaysIso(200);
    await receive(id, later);
    expect(await productExpiry(id)).toBe(later);
    await receive(id, soon);
    expect(await productExpiry(id)).toBe(soon);
    await receive(id, later);
    expect(await productExpiry(id)).toBe(soon);
  });

  it('a line without a date leaves the product date untouched', async () => {
    const id = await mk('Milk', addDaysIso(30), null, 0);
    await receive(id, null);
    expect(await productExpiry(id)).toBe(addDaysIso(30));
  });

  it('near-expiry list honours the store window, per-product override, and expired stock', async () => {
    await mk('Expired', addDaysIso(-2));
    await mk('Soon', addDaysIso(5));
    await mk('Far', addDaysIso(60));
    await mk('FarOverride', addDaysIso(60), 90);
    await mk('NoDate', null);

    expect(await nearExpiryNames(7)).toEqual(['Expired', 'FarOverride', 'Soon']);
    expect(await nearExpiryNames(1)).toEqual(['Expired', 'FarOverride']);
    expect(await nearExpiryNames(90)).toEqual([
      'Expired',
      'Far',
      'FarOverride',
      'Soon',
    ]);
  });

  it('updateProduct only touches expiry when it is passed', async () => {
    const id = await mk('Noodles', addDaysIso(20), 3);
    await updateProduct(id, 'Noodles', 'Noodles', 10, 5, 5);
    expect(await productExpiry(id)).toBe(addDaysIso(20));
    await updateProduct(
      id,
      'Noodles',
      'Noodles',
      10,
      5,
      5,
      undefined,
      undefined,
      undefined,
      undefined,
      'Pc',
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      null,
      null,
    );
    expect(await productExpiry(id)).toBeNull();
  });

  it('write-offs snapshot cost so loss survives later cost changes', async () => {
    const id = await insertProduct('Cola', 'CL-1', 25, 10, 12);
    await insertInventoryTransaction({
      product_id: id,
      type: 'damaged',
      quantity: 3,
      note: 'Expired',
    });
    await db.runAsync('UPDATE products SET cost_price = 99 WHERE id = ?', [id]);
    expect(await getWriteOffCost(30)).toBe(36);
  });
});
