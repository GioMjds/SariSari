import { getPreviousDateRange, profitFlowShares } from '../report-math';

describe('getPreviousDateRange', () => {
  const now = new Date(2026, 10, 27, 15, 30);

  it('compares today with yesterday up to the same time', () => {
    const r = getPreviousDateRange('today', now);
    expect(r.startDate).toEqual(new Date(2026, 10, 26, 0, 0));
    expect(r.endDate).toEqual(new Date(2026, 10, 26, 15, 30));
  });

  it('compares the last 7 days with the 7 days before', () => {
    const r = getPreviousDateRange('last7days', now);
    expect(r.startDate).toEqual(new Date(2026, 10, 14, 0, 0));
    expect(r.endDate.getDate()).toBe(20);
  });

  it('clamps month-to-date when last month is shorter', () => {
    const r = getPreviousDateRange('thisMonth', new Date(2026, 2, 31, 9, 0));
    expect(r.startDate).toEqual(new Date(2026, 1, 1, 0, 0));
    expect(r.endDate).toEqual(new Date(2026, 1, 28, 9, 0));
  });
});

describe('profitFlowShares', () => {
  it('returns zeros for no revenue', () => {
    expect(profitFlowShares(0, 0, 500)).toEqual({ cost: 0, expenses: 0, profit: 0 });
  });

  it('splits revenue into shares that add up to 1', () => {
    const s = profitFlowShares(1000, 600, 100);
    expect(s).toEqual({ cost: 0.6, expenses: 0.1, profit: 0.3 });
  });

  it('caps a loss so the bar never overflows', () => {
    const s = profitFlowShares(1000, 900, 500);
    expect(s.cost + s.expenses + s.profit).toBeCloseTo(1);
    expect(s.profit).toBe(0);
  });
});
