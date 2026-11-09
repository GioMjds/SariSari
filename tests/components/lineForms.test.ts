import {
  lineFormFromProduct,
  lineFormFromQuickAdd,
  lineFormFromReceiptLine,
  mergeSeededLines,
} from '@/components/receiving/lineForms';
import type { DraftLineForm } from '@/lib/deliveryForm';
import type { Product } from '@/types/products.types';

const product: Product = {
  id: 7,
  name: 'Soda',
  sku: 'S1',
  barcode: null,
  price: 15,
  cost_price: 9,
  quantity: 0,
  created_at: '',
  updated_at: '',
  retail_unit_name: 'Bottle',
  wholesale_unit_name: 'Case',
  wholesale_cost_price: 210,
  conversion_factor: 24,
  is_favorite: false,
};

const line = (over: Partial<DraftLineForm>): DraftLineForm => ({
  key: 'k',
  productId: 1,
  productName: 'P',
  newProduct: null,
  enteredUnit: 'retail',
  retailUnitName: 'Pc',
  wholesaleUnitName: null,
  conversionFactor: null,
  lastCostPrice: null,
  expectedQty: '',
  receivedQty: '',
  unitCost: '',
  ...over,
});

describe('lineFormFromProduct', () => {
  it('defaults to wholesale with the wholesale cost when the product has a wholesale unit', () => {
    expect(lineFormFromProduct(product)).toMatchObject({
      productId: 7,
      enteredUnit: 'wholesale',
      retailUnitName: 'Bottle',
      wholesaleUnitName: 'Case',
      conversionFactor: 24,
      lastCostPrice: 9,
      unitCost: '210',
      expectedQty: '',
      receivedQty: '',
    });
  });
  it('uses retail and the retail cost when asked for retail or without a wholesale unit', () => {
    expect(lineFormFromProduct(product, 'retail')).toMatchObject({
      enteredUnit: 'retail',
      unitCost: '9',
    });
    expect(
      lineFormFromProduct({ ...product, conversion_factor: 1 }),
    ).toMatchObject({ enteredUnit: 'retail', unitCost: '9' });
  });
  it('leaves the cost blank instead of guessing a wholesale cost', () => {
    expect(
      lineFormFromProduct({ ...product, wholesale_cost_price: null }),
    ).toMatchObject({ enteredUnit: 'wholesale', unitCost: '' });
  });
});

describe('lineFormFromQuickAdd', () => {
  it('builds a retail line with no product id', () => {
    expect(
      lineFormFromQuickAdd({ name: 'Chips', price: 20, barcode: null }),
    ).toMatchObject({
      productId: null,
      productName: 'Chips',
      newProduct: { name: 'Chips', price: 20, barcode: null },
      enteredUnit: 'retail',
      lastCostPrice: null,
    });
  });
});

describe('lineFormFromReceiptLine', () => {
  it('restores the entered values as strings with unit data from the product', () => {
    const form = lineFormFromReceiptLine(
      {
        id: 1,
        receiptId: 2,
        productId: 7,
        productName: 'Soda',
        newProduct: null,
        enteredUnit: 'wholesale',
        enteredExpectedQty: 3,
        enteredReceivedQty: 2,
        enteredUnitCost: 240,
        expectedQty: 72,
        receivedQty: 48,
        expectedUnitCost: 9,
        actualUnitCost: 10,
        shortageQty: 24,
        conversionFactorUsed: 24,
      },
      product,
    );
    expect(form).toMatchObject({
      enteredUnit: 'wholesale',
      expectedQty: '3',
      receivedQty: '2',
      unitCost: '240',
      wholesaleUnitName: 'Case',
      conversionFactor: 24,
      lastCostPrice: 9,
    });
  });
});

describe('mergeSeededLines', () => {
  it('replaces blank lines, keeps typed lines, appends new products', () => {
    const blank = line({ key: 'blank', productId: 1 });
    const typed = line({ key: 'typed', productId: 2, receivedQty: '5' });
    const seeded = [
      line({ key: 's1', productId: 1, expectedQty: '6' }),
      line({ key: 's2', productId: 2, expectedQty: '4' }),
      line({ key: 's3', productId: 3, expectedQty: '2' }),
    ];
    const merged = mergeSeededLines([blank, typed], seeded);
    expect(merged.map((l) => l.key)).toEqual(['s1', 'typed', 's3']);
  });

  it('seeds only the first of two blank lines for one product, keeping keys distinct', () => {
    const first = line({ key: 'b1', productId: 9 });
    const second = line({ key: 'b2', productId: 9 });
    const seed = line({ key: 's9', productId: 9, expectedQty: '6' });
    const merged = mergeSeededLines([first, second], [seed]);
    expect(merged).toHaveLength(2);
    expect(merged.map((l) => l.key)).toEqual(['s9', 'b2']);
    expect(new Set(merged.map((l) => l.key)).size).toBe(2);
    expect(merged[0]?.expectedQty).toBe('6');
    expect(merged[1]?.expectedQty).toBe('');
  });
});
