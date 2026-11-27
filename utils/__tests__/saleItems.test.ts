import { saleProfit } from '../saleItems';

const line = (price: number, cost: number | null, quantity = 1, sold_unit_qty: number | null = null) => ({
  price,
  cost_price: cost,
  quantity,
  sold_unit_qty,
});

describe('saleProfit', () => {
  it('sums profit and margin when every line has a cost', () => {
    const result = saleProfit([line(20, 15, 2), line(10, 8, 1)]);
    expect(result.profit).toBe(12);
    expect(result.margin).toBeCloseTo(12 / 50);
    expect(result.missingCost).toBe(0);
  });

  it('skips lines without a cost and counts them', () => {
    const result = saleProfit([line(20, 15, 1), line(30, null, 3)]);
    expect(result.profit).toBe(5);
    expect(result.margin).toBeCloseTo(5 / 20);
    expect(result.missingCost).toBe(1);
  });

  it('returns zero margin when no line has a cost', () => {
    expect(saleProfit([line(20, null)])).toEqual({ profit: 0, margin: 0, missingCost: 1 });
  });

  it('prices wholesale lines by sold units, not pieces', () => {
    // 2 boxes of 12 pcs: quantity holds 24 pieces, price and cost are per box.
    const result = saleProfit([line(240, 200, 24, 2)]);
    expect(result.profit).toBe(80);
  });
});
