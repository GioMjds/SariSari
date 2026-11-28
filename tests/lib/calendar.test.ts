import {
  formatLong,
  formatSpoken,
  monthCells,
  parseIso,
  shiftMonth,
  toIso,
} from '@/lib/calendar';

describe('calendar helpers', () => {
  it('builds ISO dates from zero-based months', () => {
    expect(toIso(2026, 11, 5)).toBe('2026-12-05');
    expect(parseIso('2026-12-05')).toEqual({ y: 2026, m0: 11, d: 5 });
    expect(parseIso('2026-02-30')).toBeNull();
  });

  it('shifts months across year boundaries in both directions', () => {
    expect(shiftMonth(2026, 11, 1)).toEqual({ y: 2027, m0: 0 });
    expect(shiftMonth(2026, 0, -1)).toEqual({ y: 2025, m0: 11 });
    expect(shiftMonth(2026, 5, 18)).toEqual({ y: 2027, m0: 11 });
    expect(shiftMonth(2026, 5, -30)).toEqual({ y: 2023, m0: 11 });
  });

  it('lays out a month as 42 cells, Sunday first', () => {
    // December 2026 starts on a Tuesday and has 31 days.
    const cells = monthCells(2026, 11);
    expect(cells).toHaveLength(42);
    expect(cells.slice(0, 3)).toEqual([null, null, 1]);
    expect(cells.filter((c) => c !== null)).toHaveLength(31);
    expect(cells[2 + 30]).toBe(31);
  });

  it('handles leap-year February', () => {
    expect(monthCells(2028, 1).filter((c) => c !== null)).toHaveLength(29);
    expect(monthCells(2027, 1).filter((c) => c !== null)).toHaveLength(28);
  });

  it('formats long and spoken dates', () => {
    expect(formatLong('2026-12-05')).toBe('December 5, 2026');
    expect(formatLong('nope')).toBeNull();
    expect(formatSpoken('2026-12-05')).toBe('Saturday, December 5, 2026');
  });
});
