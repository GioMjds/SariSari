import {
  isLineComplete,
  seedLinesFromPlan,
  toLineInput,
  type DraftLineForm,
} from '@/lib/deliveryForm';

const base: DraftLineForm = {
  key: 'k1',
  productId: 5,
  productName: 'Coke 1L',
  newProduct: null,
  enteredUnit: 'retail',
  retailUnitName: 'Pc',
  wholesaleUnitName: null,
  conversionFactor: null,
  lastCostPrice: 10,
  expectedQty: '10',
  receivedQty: '8',
  unitCost: '12',
};

describe('toLineInput', () => {
  it('parses strings to numbers', () => {
    expect(toLineInput(base)).toEqual({
      productId: 5,
      newProduct: null,
      enteredUnit: 'retail',
      enteredExpectedQty: 10,
      enteredReceivedQty: 8,
      enteredUnitCost: 12,
    });
  });
  it('throws on a blank cost instead of becoming 0', () => {
    expect(() => toLineInput({ ...base, unitCost: '' })).toThrow();
  });
  it('treats blank expected qty as 0', () => {
    expect(toLineInput({ ...base, expectedQty: '' }).enteredExpectedQty).toBe(
      0,
    );
  });
});

describe('isLineComplete', () => {
  it('is false when received or cost is blank', () => {
    expect(isLineComplete({ ...base, receivedQty: '' })).toBe(false);
    expect(isLineComplete({ ...base, unitCost: '' })).toBe(false);
  });
  it('is true when received and cost are filled', () => {
    expect(isLineComplete(base)).toBe(true);
  });
});

describe('seedLinesFromPlan', () => {
  it('seeds retail lines with expected qty and cost, blank received', () => {
    const lines = seedLinesFromPlan([
      {
        productId: 1,
        productName: 'Rice',
        sku: 'R1',
        currentStock: 0,
        suggestedQuantity: 6,
        retailUnitName: 'Pc',
        costPrice: 40,
        subtotal: 240,
        isOutOfStock: true,
        supplierId: 's',
        supplierName: 'S',
        categoryName: null,
      },
    ]);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({
      productId: 1,
      productName: 'Rice',
      enteredUnit: 'retail',
      expectedQty: '6',
      receivedQty: '',
      unitCost: '40',
      lastCostPrice: 40,
    });
  });
});
