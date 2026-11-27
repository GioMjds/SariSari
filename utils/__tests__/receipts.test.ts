import { SaleWithItems } from '@/types';
import {
  buildReceiptRows,
  formatReceiptRef,
  getCancelledKind,
  summarizeReceipts,
} from '../receipts';

const sale = (
  id: number,
  timestamp: string,
  total: number,
  extra: Partial<SaleWithItems> = {},
): SaleWithItems => ({
  id,
  total,
  timestamp,
  payment_type: 'cash',
  items: [],
  items_count: 0,
  ...extra,
});

describe('receipt helpers', () => {
  const now = new Date(2026, 10, 27, 15, 0);
  const today = new Date(2026, 10, 27, 9, 0).toISOString();
  const yesterday = new Date(2026, 10, 26, 9, 0).toISOString();

  const sales = [
    sale(5, today, 100),
    sale(4, today, 50, { payment_type: 'credit' }),
    sale(3, today, 999, { cancelled_at: today, cancelled_by_kind: 'refund' }),
    sale(2, yesterday, 20),
    sale(1, yesterday, 30),
  ];

  it('formats refs with four-digit padding', () => {
    expect(formatReceiptRef(42)).toBe('SR-0042');
  });

  it('splits cash and utang and skips cancelled totals', () => {
    expect(summarizeReceipts(sales)).toEqual({
      count: 5,
      cash: 150,
      utang: 50,
      cancelledCount: 1,
    });
  });

  it('maps cancellation kind and defaults to void', () => {
    expect(getCancelledKind(sales[2]!)?.stamp).toBe('REFUNDED');
    expect(getCancelledKind({ cancelled_at: today })?.stamp).toBe('VOIDED');
    expect(getCancelledKind(sales[0]!)).toBeNull();
  });

  it('inserts one header per day with labels', () => {
    const rows = buildReceiptRows(sales, sales, now);
    expect(rows.map((r) => r.kind)).toEqual([
      'day', 'sale', 'sale', 'sale', 'day', 'sale', 'sale',
    ]);
    expect(rows[0]).toMatchObject({ label: 'Today · Nov 27', cash: 100, utang: 50 });
    expect(rows[4]).toMatchObject({ label: 'Yesterday · Nov 26', cash: 50 });
  });

  it('uses whole-day totals when a day spans pages', () => {
    const rows = buildReceiptRows(sales.slice(4), sales, now);
    expect(rows[0]).toMatchObject({ kind: 'day', cash: 50, count: 2 });
    expect(rows).toHaveLength(2);
  });
});
