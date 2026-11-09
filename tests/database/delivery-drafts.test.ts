import { db } from '@/configs/sqlite';
import {
  DraftAlreadyExistsError,
  QuickAddBarcodeExistsError,
  ReceiptNotDraftError,
  discardDeliveryDraft,
  getDeliveryReceipt,
  getOpenDraftForSupplier,
  listDeliveryReceipts,
  saveDeliveryDraft,
} from '@/database/deliveries';
import { InvalidDeliveryLineError } from '@/lib/deliveryReceipt';
import type { DeliveryLineInput } from '@/types/deliveries.types';
import { resetMockDb } from '../__setup__/expo-sqlite-mock';
import {
  seedProduct,
  seedSupplier,
  setupDeliveryDb,
} from '../helpers/deliveryFixtures';

const retailLine = (
  productId: number,
  expected: number,
  received: number,
  cost: number,
): DeliveryLineInput => ({
  productId,
  newProduct: null,
  enteredUnit: 'retail',
  enteredExpectedQty: expected,
  enteredReceivedQty: received,
  enteredUnitCost: cost,
});

describe('delivery drafts', () => {
  beforeAll(async () => {
    await setupDeliveryDb();
  });
  beforeEach(() => {
    resetMockDb();
  });

  it('saves a draft with converted wholesale values and snapshots', async () => {
    const sup = await seedSupplier('sup-1', 'Acme');
    const pid = await seedProduct({
      name: 'Soda',
      sku: 'SO1',
      qty: 0,
      cost: 9,
      wholesale: { unitName: 'Case', price: 300, cost: 216, factor: 24 },
    });
    const id = await saveDeliveryDraft({
      supplierId: sup,
      invoiceNo: 'INV-1',
      lines: [
        {
          productId: pid,
          newProduct: null,
          enteredUnit: 'wholesale',
          enteredExpectedQty: 3,
          enteredReceivedQty: 2,
          enteredUnitCost: 240,
        },
      ],
    });
    const detail = await getDeliveryReceipt(id);
    expect(detail?.status).toBe('draft');
    expect(detail?.invoiceNo).toBe('INV-1');
    expect(detail?.lines).toHaveLength(1);
    expect(detail?.lines[0]).toMatchObject({
      productName: 'Soda',
      expectedQty: 72,
      receivedQty: 48,
      shortageQty: 24,
      actualUnitCost: 10,
      expectedUnitCost: 9,
      conversionFactorUsed: 24,
      enteredUnit: 'wholesale',
      enteredReceivedQty: 2,
    });
  });

  it('re-saving replaces lines and keeps one receipt', async () => {
    const sup = await seedSupplier('sup-2');
    const a = await seedProduct({ name: 'A', sku: 'A1' });
    const b = await seedProduct({ name: 'B', sku: 'B1' });
    const id = await saveDeliveryDraft({
      supplierId: sup,
      lines: [retailLine(a, 5, 5, 10)],
    });
    const id2 = await saveDeliveryDraft({
      receiptId: id,
      supplierId: sup,
      lines: [retailLine(b, 2, 2, 20)],
    });
    expect(id2).toBe(id);
    const detail = await getDeliveryReceipt(id);
    expect(detail?.lines.map((l) => l.productId)).toEqual([b]);
  });

  it('a second new draft for the same supplier throws with the existing id', async () => {
    const sup = await seedSupplier('sup-3');
    const a = await seedProduct({ name: 'A', sku: 'A2' });
    const id = await saveDeliveryDraft({
      supplierId: sup,
      lines: [retailLine(a, 1, 1, 5)],
    });
    await expect(
      saveDeliveryDraft({ supplierId: sup, lines: [retailLine(a, 1, 1, 5)] }),
    ).rejects.toMatchObject({
      name: 'DraftAlreadyExistsError',
      existingReceiptId: id,
    });
    expect(await getOpenDraftForSupplier(sup)).toBe(id);
  });

  it('review focus: wholesale on a product without a wholesale unit is rejected and saves nothing', async () => {
    const sup = await seedSupplier('sup-4');
    const pid = await seedProduct({ name: 'Plain', sku: 'P1' });
    await expect(
      saveDeliveryDraft({
        supplierId: sup,
        lines: [
          {
            productId: pid,
            newProduct: null,
            enteredUnit: 'wholesale',
            enteredExpectedQty: 1,
            enteredReceivedQty: 1,
            enteredUnitCost: 100,
          },
        ],
      }),
    ).rejects.toBeInstanceOf(InvalidDeliveryLineError);
    expect(await getOpenDraftForSupplier(sup)).toBeNull();
  });

  it('review focus: quick-add barcode that belongs to an existing product is rejected at save', async () => {
    const sup = await seedSupplier('sup-5');
    await seedProduct({ name: 'Taken', sku: 'T1', barcode: '4800000000011' });
    await expect(
      saveDeliveryDraft({
        supplierId: sup,
        lines: [
          {
            productId: null,
            newProduct: {
              name: 'Clone',
              price: 1500,
              barcode: '4800000000011',
            },
            enteredUnit: 'retail',
            enteredExpectedQty: 1,
            enteredReceivedQty: 1,
            enteredUnitCost: 900,
          },
        ],
      }),
    ).rejects.toBeInstanceOf(QuickAddBarcodeExistsError);
    expect(await getOpenDraftForSupplier(sup)).toBeNull();
  });

  it('rejects a quick-add line with an empty name', async () => {
    const sup = await seedSupplier('sup-6');
    await expect(
      saveDeliveryDraft({
        supplierId: sup,
        lines: [
          {
            productId: null,
            newProduct: { name: '   ', price: 1500 },
            enteredUnit: 'retail',
            enteredExpectedQty: 1,
            enteredReceivedQty: 1,
            enteredUnitCost: 900,
          },
        ],
      }),
    ).rejects.toThrow('name');
  });

  it('cannot save over a committed receipt', async () => {
    const sup = await seedSupplier('sup-7');
    const a = await seedProduct({ name: 'A', sku: 'A3' });
    const id = await saveDeliveryDraft({
      supplierId: sup,
      lines: [retailLine(a, 1, 1, 5)],
    });
    await db.runAsync(
      "UPDATE delivery_receipts SET status = 'committed' WHERE id = ?",
      [id],
    );
    await expect(
      saveDeliveryDraft({
        receiptId: id,
        supplierId: sup,
        lines: [retailLine(a, 2, 2, 5)],
      }),
    ).rejects.toBeInstanceOf(ReceiptNotDraftError);
  });

  it('discard removes a draft and its lines; refuses a committed receipt', async () => {
    const sup = await seedSupplier('sup-8');
    const a = await seedProduct({ name: 'A', sku: 'A4' });
    const id = await saveDeliveryDraft({
      supplierId: sup,
      lines: [retailLine(a, 1, 1, 5)],
    });
    await discardDeliveryDraft(id);
    expect(await getDeliveryReceipt(id)).toBeNull();
    const lines = await db.getAllAsync(
      'SELECT id FROM delivery_receipt_lines WHERE receipt_id = ?',
      [id],
    );
    expect(lines).toHaveLength(0);

    const id2 = await saveDeliveryDraft({
      supplierId: sup,
      lines: [retailLine(a, 1, 1, 5)],
    });
    await db.runAsync(
      "UPDATE delivery_receipts SET status = 'committed' WHERE id = ?",
      [id2],
    );
    await expect(discardDeliveryDraft(id2)).rejects.toBeInstanceOf(
      ReceiptNotDraftError,
    );
  });

  it('lists receipts filtered by status', async () => {
    const sup = await seedSupplier('sup-9', 'Nine');
    const a = await seedProduct({ name: 'A', sku: 'A5' });
    await saveDeliveryDraft({
      supplierId: sup,
      lines: [retailLine(a, 4, 3, 10)],
    });
    const drafts = await listDeliveryReceipts({ status: 'draft' });
    expect(drafts).toHaveLength(1);
    expect(drafts[0]).toMatchObject({
      supplierName: 'Nine',
      lineCount: 1,
      totalCost: 30,
      shortageQty: 1,
    });
    expect(await listDeliveryReceipts({ status: 'committed' })).toHaveLength(0);
  });
});
