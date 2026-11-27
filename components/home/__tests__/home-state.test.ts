import {
  buildAttentionItems,
  buildWeekSeries,
  percentChange,
  resolveStocktakeReminder,
} from '../home-state';

const DAY_MS = 24 * 60 * 60 * 1000;

describe('buildWeekSeries', () => {
  const now = new Date(2026, 10, 27, 15, 0);

  it('fills missing days with zero and keeps oldest first', () => {
    const series = buildWeekSeries(
      [{ date: '2026-11-25', amount: 500 }],
      0,
      now,
    );
    expect(series.map((d) => d.date)).toEqual([
      '2026-11-21',
      '2026-11-22',
      '2026-11-23',
      '2026-11-24',
      '2026-11-25',
      '2026-11-26',
      '2026-11-27',
    ]);
    expect(series[4]?.amount).toBe(500);
    expect(series[5]?.amount).toBe(0);
  });

  it('uses the live total for today, not the report row', () => {
    const series = buildWeekSeries(
      [{ date: '2026-11-27', amount: 100 }],
      250,
      now,
    );
    expect(series[6]).toEqual({
      date: '2026-11-27',
      amount: 250,
      isToday: true,
    });
  });
});

describe('percentChange', () => {
  it('rounds to whole percent', () => {
    expect(percentChange(1120, 1000)).toBe(12);
    expect(percentChange(500, 1000)).toBe(-50);
  });

  it('returns null without a base day', () => {
    expect(percentChange(500, 0)).toBeNull();
  });
});

describe('resolveStocktakeReminder', () => {
  const now = 100 * DAY_MS;

  it('prefers an open count', () => {
    expect(resolveStocktakeReminder(true, now, now)).toEqual({
      status: 'inProgress',
    });
  });

  it('flags a store that never counted', () => {
    expect(resolveStocktakeReminder(false, null, now)).toEqual({
      status: 'never',
    });
  });

  it('stays quiet within 30 days and nudges after', () => {
    expect(resolveStocktakeReminder(false, now - 29 * DAY_MS, now)).toBeNull();
    expect(resolveStocktakeReminder(false, now - 30 * DAY_MS, now)).toEqual({
      status: 'stale',
      days: 30,
    });
  });
});

describe('buildAttentionItems', () => {
  const clear = {
    outOfStockCount: 0,
    lowStockCount: 0,
    overdueCount: 0,
    overdueAmount: 0,
    stocktake: null,
  };

  it('is empty when the store is in good shape', () => {
    expect(buildAttentionItems(clear)).toEqual([]);
  });

  it('orders empty shelves, low stock, overdue utang, then counting', () => {
    const items = buildAttentionItems({
      outOfStockCount: 2,
      lowStockCount: 5,
      overdueCount: 1,
      overdueAmount: 1200,
      stocktake: { status: 'never' },
    });
    expect(items.map((i) => i.kind)).toEqual([
      'outOfStock',
      'lowStock',
      'overdueUtang',
      'stocktake',
    ]);
    expect(items[2]).toMatchObject({
      count: 1,
      amount: 1200,
      destination: 'utang',
    });
  });
});
