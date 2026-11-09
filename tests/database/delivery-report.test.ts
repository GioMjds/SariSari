import {
  commitDeliveryReceipt,
  getDeliveryShortageReport,
  getSupplierShortageLines,
  saveDeliveryDraft,
  voidDeliveryReceipt,
} from '@/database/deliveries';
import { resetMockDb } from '../__setup__/expo-sqlite-mock';
import {
  seedProduct,
  seedSupplier,
  setupDeliveryDb,
} from '../helpers/deliveryFixtures';

const line = (
  pid: number,
  expected: number,
  received: number,
  cost: number,
) => ({
  productId: pid,
  newProduct: null,
  enteredUnit: 'retail' as const,
  enteredExpectedQty: expected,
  enteredReceivedQty: received,
  enteredUnitCost: cost,
});

describe('getDeliveryShortageReport', () => {
  beforeAll(async () => {
    await setupDeliveryDb();
  });
  beforeEach(() => {
    resetMockDb();
  });

  it('ranks suppliers by shortage value and computes rate', async () => {
    const good = await seedSupplier('r-good', 'Reliable Co');
    const bad = await seedSupplier('r-bad', 'Shorty Inc');
    const a = await seedProduct({ name: 'A', sku: 'RA', cost: 10 });
    const b = await seedProduct({ name: 'B', sku: 'RB', cost: 50 });

    const g = await saveDeliveryDraft({
      supplierId: good,
      lines: [line(a, 10, 10, 10)],
    });
    await commitDeliveryReceipt(g);
    const s = await saveDeliveryDraft({
      supplierId: bad,
      lines: [line(a, 10, 7, 10), line(b, 4, 2, 50)],
    });
    await commitDeliveryReceipt(s);

    const report = await getDeliveryShortageReport();
    expect(report.map((r) => r.supplierId)).toEqual(['r-bad', 'r-good']);
    expect(report[0]).toMatchObject({
      supplierName: 'Shorty Inc',
      receipts: 1,
      lines: 2,
      shortLines: 2,
      shortageQty: 5,
      shortageValue: 3 * 10 + 2 * 50,
      shortageRate: 1,
    });
    expect(report[1]).toMatchObject({ shortageValue: 0, shortageRate: 0 });
  });

  it('excludes drafts and voided receipts', async () => {
    const sup = await seedSupplier('r-x', 'X');
    const a = await seedProduct({ name: 'A', sku: 'RX', cost: 10 });
    const draft = await saveDeliveryDraft({
      supplierId: sup,
      lines: [line(a, 5, 1, 10)],
    });
    expect(draft).toBeGreaterThan(0);
    expect(await getDeliveryShortageReport()).toHaveLength(0);

    await commitDeliveryReceipt(draft);
    expect(await getDeliveryShortageReport()).toHaveLength(1);
    await voidDeliveryReceipt(draft, 'mistake');
    expect(await getDeliveryShortageReport()).toHaveLength(0);
  });

  it('falls back to actual cost when the product had no expected cost', async () => {
    const sup = await seedSupplier('r-y', 'Y');
    const a = await seedProduct({ name: 'NoCost', sku: 'RY' });
    const id = await saveDeliveryDraft({
      supplierId: sup,
      lines: [line(a, 5, 3, 8)],
    });
    await commitDeliveryReceipt(id);
    const [row] = await getDeliveryShortageReport();
    expect(row?.shortageValue).toBe(2 * 8);
  });

  it('respects the date range', async () => {
    const sup = await seedSupplier('r-z', 'Z');
    const a = await seedProduct({ name: 'A', sku: 'RZ', cost: 10 });
    const id = await saveDeliveryDraft({
      supplierId: sup,
      lines: [line(a, 5, 1, 10)],
    });
    await commitDeliveryReceipt(id);
    const future = new Date(Date.now() + 86_400_000).toISOString();
    expect(await getDeliveryShortageReport({ since: future })).toHaveLength(0);
    const past = new Date(Date.now() - 86_400_000).toISOString();
    expect(await getDeliveryShortageReport({ since: past })).toHaveLength(1);
  });

  it('lists the short lines per supplier as evidence', async () => {
    const sup = await seedSupplier('r-w', 'W');
    const a = await seedProduct({ name: 'Short Item', sku: 'RW', cost: 10 });
    const b = await seedProduct({ name: 'Full Item', sku: 'RW2', cost: 10 });
    const id = await saveDeliveryDraft({
      supplierId: sup,
      invoiceNo: 'INV-5',
      lines: [line(a, 6, 4, 10), line(b, 2, 2, 10)],
    });
    await commitDeliveryReceipt(id);
    const lines = await getSupplierShortageLines(sup);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({
      receiptId: id,
      invoiceNo: 'INV-5',
      productName: 'Short Item',
      expectedQty: 6,
      receivedQty: 4,
      shortageQty: 2,
    });
  });
});
