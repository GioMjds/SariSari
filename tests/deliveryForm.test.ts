import {
  isLineComplete,
  parseCostInput,
  parseQtyInput,
  seedLinesFromPlan,
  toLineInput,
  type DraftLineForm,
} from '@/lib/deliveryForm';
import { InvalidDeliveryLineError } from '@/lib/deliveryReceipt';

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
  it.each(['1.5', '-2', '1e3', 'abc', ' 4 x'])(
    'rejects a non-whole qty %p instead of passing it through',
    (raw) => {
      expect(() => toLineInput({ ...base, receivedQty: raw })).toThrow(
        InvalidDeliveryLineError,
      );
      expect(() => toLineInput({ ...base, expectedQty: raw })).toThrow(
        InvalidDeliveryLineError,
      );
    },
  );
  it('parses the unit cost through parsePesosInput', () => {
    expect(toLineInput({ ...base, unitCost: '₱1,200' }).enteredUnitCost).toBe(
      1200,
    );
  });
  it.each(['12.50', '-5', 'abc'])(
    'rejects a unit cost that is not whole pesos: %p',
    (raw) => {
      expect(() => toLineInput({ ...base, unitCost: raw })).toThrow(
        InvalidDeliveryLineError,
      );
    },
  );
});

describe('parseQtyInput / parseCostInput', () => {
  it('returns whole numbers of 0 or more, null otherwise', () => {
    expect(parseQtyInput('0')).toBe(0);
    expect(parseQtyInput(' 12 ')).toBe(12);
    expect(parseQtyInput('')).toBeNull();
    expect(parseQtyInput('1.5')).toBeNull();
    expect(parseQtyInput('-2')).toBeNull();
    expect(parseQtyInput('1e3')).toBeNull();
  });
  it('returns whole pesos, null for blank, negative or centavo input', () => {
    expect(parseCostInput('240')).toBe(240);
    expect(parseCostInput('240.00')).toBe(240);
    expect(parseCostInput('')).toBeNull();
    expect(parseCostInput('240.50')).toBeNull();
    expect(parseCostInput('-1')).toBeNull();
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
  it('is false when any filled field is not a valid whole number', () => {
    expect(isLineComplete({ ...base, receivedQty: '1.5' })).toBe(false);
    expect(isLineComplete({ ...base, expectedQty: '-1' })).toBe(false);
    expect(isLineComplete({ ...base, unitCost: '12.50' })).toBe(false);
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
