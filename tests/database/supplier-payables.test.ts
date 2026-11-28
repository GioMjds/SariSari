import { db } from '@/configs/sqlite';
import {
  commitDeliveryReceipt,
  createOpeningBalance,
  createSupplier,
  deleteSupplierPayment,
  getPayablesDueSummary,
  getSupplierBalances,
  getSupplierPayables,
  hasOpeningBalance,
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
  insertProduct,
  insertSupplierPayment,
  OpeningBalanceExistsError,
  ReceiptHasPaymentsError,
  runMigrations,
  saveDeliveryDraft,
  SupplierOverpaymentError,
  voidDeliveryReceipt,
} from '@/database';
import { resetMockDb } from '../__setup__/expo-sqlite-mock';

// The global expo-crypto mock returns one fixed UUID, which collides across suppliers.
let mockUuid = 0;
jest.mock('expo-crypto', () => ({ randomUUID: () => `supplier-${++mockUuid}` }));

// Receives 10 pieces at 12 each, so the invoice total is 120.
const seedReceipt = async (supplierId: string) => {
  const productId = await insertProduct('Noodles', `ND-${Math.random()}`, 15, 0, 10);
  return saveDeliveryDraft({
    supplierId,
    lines: [
      {
        productId,
        newProduct: null,
        enteredUnit: 'retail',
        enteredExpectedQty: 10,
        enteredReceivedQty: 10,
        enteredUnitCost: 12,
      },
    ],
  });
};

const owedTo = async (supplierId: string) =>
  (await getSupplierBalances()).find((b) => b.supplierId === supplierId)?.owed ?? 0;

const drawerDelta = async () =>
  (
    await db.getFirstAsync<{ total: number }>(
      "SELECT COALESCE(SUM(amount_delta), 0) AS total FROM cash_movements WHERE source = 'supplier_payment'",
    )
  )?.total ?? 0;

describe('supplier payables', () => {
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

  it('Pay later creates a payable at the invoice total, due by terms', async () => {
    const s = await createSupplier({ name: 'Agent A', contact: null, notes: null, paymentTermsDays: 7 });
    const receiptId = await seedReceipt(s.id);
    await commitDeliveryReceipt(receiptId);

    const payable = (await getSupplierPayables(s.id))[0]!;
    expect(payable.amount).toBe(120);
    expect(payable.amountPaid).toBe(0);
    expect(payable.dueDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(await drawerDelta()).toBe(0);
  });

  it('an explicit null due date overrides supplier terms', async () => {
    const s = await createSupplier({ name: 'Agent I', contact: null, notes: null, paymentTermsDays: 7 });
    await commitDeliveryReceipt(await seedReceipt(s.id), { paidNow: false, dueDate: null });
    expect((await getSupplierPayables(s.id))[0]!.dueDate).toBeNull();
    expect(await hasOpeningBalance(s.id)).toBe(false);
  });

  it('Paid now leaves nothing owed and takes cash from the drawer', async () => {
    const s = await createSupplier({ name: 'Agent B', contact: null, notes: null });
    const receiptId = await seedReceipt(s.id);
    await commitDeliveryReceipt(receiptId);

    expect(await owedTo(s.id)).toBe(0);
    expect(await drawerDelta()).toBe(-120);
  });

  it('applies a partial payment oldest due first and rejects overpay', async () => {
    const s = await createSupplier({ name: 'Agent C', contact: null, notes: null });
    await createOpeningBalance(s.id, 100, '2026-01-01');
    await commitDeliveryReceipt(await seedReceipt(s.id), { paidNow: false, dueDate: '2026-02-01' });
    expect(await owedTo(s.id)).toBe(220);

    await insertSupplierPayment({ supplierId: s.id, amount: 150, paymentMethod: 'cash' });
    const open = await getSupplierPayables(s.id);
    expect(open).toHaveLength(1);
    expect(open[0]!.receiptId).not.toBeNull();
    expect(open[0]!.amount - open[0]!.amountPaid).toBe(70);

    await expect(
      insertSupplierPayment({ supplierId: s.id, amount: 71, paymentMethod: 'cash' }),
    ).rejects.toBeInstanceOf(SupplierOverpaymentError);
  });

  it('deleting a payment restores the balance', async () => {
    const s = await createSupplier({ name: 'Agent D', contact: null, notes: null });
    await createOpeningBalance(s.id, 100, null);
    const paymentId = await insertSupplierPayment({ supplierId: s.id, amount: 60, paymentMethod: 'bank_transfer' });
    expect(await owedTo(s.id)).toBe(40);
    expect(await drawerDelta()).toBe(0);

    await deleteSupplierPayment(paymentId);
    expect(await owedTo(s.id)).toBe(100);
  });

  it('allows only one opening balance per supplier', async () => {
    const s = await createSupplier({ name: 'Agent E', contact: null, notes: null });
    await createOpeningBalance(s.id, 50, null);
    await expect(createOpeningBalance(s.id, 50, null)).rejects.toBeInstanceOf(OpeningBalanceExistsError);
  });

  it('void cancels an unpaid payable and refuses a paid one', async () => {
    const s = await createSupplier({ name: 'Agent F', contact: null, notes: null, paymentTermsDays: 7 });
    const unpaid = await seedReceipt(s.id);
    await commitDeliveryReceipt(unpaid);
    await voidDeliveryReceipt(unpaid, 'wrong supplier');
    expect(await owedTo(s.id)).toBe(0);

    const paid = await seedReceipt(s.id);
    await commitDeliveryReceipt(paid);
    await insertSupplierPayment({ supplierId: s.id, amount: 20, paymentMethod: 'cash' });
    await expect(voidDeliveryReceipt(paid, 'test')).rejects.toBeInstanceOf(ReceiptHasPaymentsError);
  });

  it('summarizes overdue and due-soon payables', async () => {
    const s = await createSupplier({ name: 'Agent G', contact: null, notes: null });
    await createOpeningBalance(s.id, 100, '2026-11-20');
    const s2 = await createSupplier({ name: 'Agent H', contact: null, notes: null });
    await createOpeningBalance(s2.id, 40, '2026-11-30');

    const summary = await getPayablesDueSummary('2026-11-28', 3);
    expect(summary).toEqual({ overdueCount: 1, overdueAmount: 100, dueSoonCount: 1, dueSoonAmount: 40 });
  });
});
