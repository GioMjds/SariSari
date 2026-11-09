import {
  convertDeliveryLine,
  costChange,
  InvalidDeliveryLineError,
} from '@/lib/deliveryReceipt';

describe('convertDeliveryLine', () => {
  it('passes retail values through', () => {
    expect(
      convertDeliveryLine({
        enteredUnit: 'retail',
        enteredExpectedQty: 10,
        enteredReceivedQty: 8,
        enteredUnitCost: 12,
        conversionFactor: null,
      }),
    ).toEqual({
      expectedQty: 10,
      receivedQty: 8,
      actualUnitCost: 12,
      shortageQty: 2,
      conversionFactorUsed: 1,
    });
  });

  it('converts wholesale boxes to retail pieces and per-piece cost', () => {
    const r = convertDeliveryLine({
      enteredUnit: 'wholesale',
      enteredExpectedQty: 3,
      enteredReceivedQty: 3,
      enteredUnitCost: 240,
      conversionFactor: 24,
    });
    expect(r.expectedQty).toBe(72);
    expect(r.receivedQty).toBe(72);
    expect(r.actualUnitCost).toBe(10);
    expect(r.conversionFactorUsed).toBe(24);
  });

  it('rounds per-piece cost half up', () => {
    const r = convertDeliveryLine({
      enteredUnit: 'wholesale',
      enteredExpectedQty: 1,
      enteredReceivedQty: 1,
      enteredUnitCost: 252,
      conversionFactor: 24,
    });
    expect(r.actualUnitCost).toBe(11);
  });

  it('review focus: over-delivery gives zero shortage, never negative', () => {
    const r = convertDeliveryLine({
      enteredUnit: 'retail',
      enteredExpectedQty: 5,
      enteredReceivedQty: 9,
      enteredUnitCost: 10,
      conversionFactor: null,
    });
    expect(r.shortageQty).toBe(0);
    expect(r.receivedQty).toBe(9);
  });

  it.each([null, 0, 1])(
    'review focus: wholesale with conversion factor %p is rejected',
    (factor) => {
      expect(() =>
        convertDeliveryLine({
          enteredUnit: 'wholesale',
          enteredExpectedQty: 1,
          enteredReceivedQty: 1,
          enteredUnitCost: 100,
          conversionFactor: factor,
        }),
      ).toThrow(InvalidDeliveryLineError);
    },
  );

  it.each([
    ['fractional qty', 1.5, 1, 10],
    ['negative received', 1, -1, 10],
    ['fractional cost', 1, 1, 10.5],
  ])('rejects %s', (_label, expected, received, cost) => {
    expect(() =>
      convertDeliveryLine({
        enteredUnit: 'retail',
        enteredExpectedQty: expected,
        enteredReceivedQty: received,
        enteredUnitCost: cost,
        conversionFactor: null,
      }),
    ).toThrow(InvalidDeliveryLineError);
  });
});

describe('costChange', () => {
  it('returns null when there is no previous cost', () => {
    expect(costChange(10, null)).toBeNull();
  });
  it('returns signed difference', () => {
    expect(costChange(12, 10)).toBe(2);
    expect(costChange(9, 10)).toBe(-1);
    expect(costChange(10, 10)).toBe(0);
  });
});
