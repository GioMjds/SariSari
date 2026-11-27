import { convertDeliveryLine } from '@/lib/deliveryReceipt';
import {
  MOCK_DELIVERY_LINES,
  MOCK_DELIVERY_RECEIPTS,
  MOCK_PRODUCTS,
  MOCK_SUPPLIERS,
} from '@/scripts/sample-mock-datas';

const productById = new Map(MOCK_PRODUCTS.map((p) => [p.id, p]));
const supplierIds = new Set(MOCK_SUPPLIERS.map((s) => s.id));

describe('delivery mock data', () => {
  it('gives every receipt at least one line and a known supplier', () => {
    for (const r of MOCK_DELIVERY_RECEIPTS) {
      expect(supplierIds.has(r.supplier_id)).toBe(true);
      expect(MOCK_DELIVERY_LINES.some((l) => l.receipt_id === r.id)).toBe(true);
    }
  });

  it('keeps at most one draft per supplier, matching the unique index', () => {
    const drafts = MOCK_DELIVERY_RECEIPTS.filter((r) => r.status === 'draft');
    expect(new Set(drafts.map((r) => r.supplier_id)).size).toBe(drafts.length);
  });

  it('matches each product to its receipt supplier and converts cleanly', () => {
    const receiptById = new Map(MOCK_DELIVERY_RECEIPTS.map((r) => [r.id, r]));
    for (const l of MOCK_DELIVERY_LINES) {
      const r = receiptById.get(l.receipt_id);
      expect(r).toBeDefined();
      const product =
        l.product_id === null ? undefined : productById.get(l.product_id);
      if (l.product_id === null) {
        expect(l.new_product?.name).toBeTruthy();
        expect(l.entered_unit).toBe('retail');
      } else {
        expect(product?.supplier_id).toBe(r?.supplier_id);
      }
      expect(() =>
        convertDeliveryLine({
          enteredUnit: l.entered_unit,
          enteredExpectedQty: l.entered_expected_qty,
          enteredReceivedQty: l.entered_received_qty,
          enteredUnitCost: l.entered_unit_cost,
          conversionFactor:
            product && 'conversion_factor' in product
              ? product.conversion_factor
              : null,
        }),
      ).not.toThrow();
    }
  });

  it('covers full, short, voided, and draft receipts', () => {
    const statuses = new Set(MOCK_DELIVERY_RECEIPTS.map((r) => r.status));
    expect(statuses).toEqual(new Set(['draft', 'committed', 'voided']));
    expect(
      MOCK_DELIVERY_LINES.some(
        (l) => l.entered_received_qty < l.entered_expected_qty,
      ),
    ).toBe(true);
  });
});
