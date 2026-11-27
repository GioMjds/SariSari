import {
  buildSections,
  filterReceipts,
  partitionByStatus,
  summarizeMonth,
  supplierInitials,
} from '../receiptList';
import type { DeliveryReceiptSummary } from '@/types/deliveries.types';

const receipt = (
  id: number,
  extra: Partial<DeliveryReceiptSummary> = {},
): DeliveryReceiptSummary => ({
  id,
  supplierId: 's1',
  supplierName: 'Mang Tonyo Trading',
  status: 'committed',
  invoiceNo: `INV-${id}`,
  createdAt: '2026-11-01 01:00:00',
  committedAt: null,
  voidedAt: null,
  lineCount: 2,
  totalCost: 1000,
  shortageQty: 0,
  ...extra,
});

const NOW = new Date(2026, 10, 27, 15, 0);
const local = (d: number, h: number) => new Date(2026, 10, d, h).toISOString();

describe('receiptList', () => {
  it('partitions by status and sorts newest first by the status date', () => {
    const groups = partitionByStatus([
      receipt(1, { committedAt: local(20, 9) }),
      receipt(2, { committedAt: local(25, 9) }),
      receipt(3, { status: 'draft', createdAt: '2026-11-26 01:00:00' }),
      receipt(4, { status: 'voided', voidedAt: local(22, 9) }),
    ]);
    expect(groups.committed.map((r) => r.id)).toEqual([2, 1]);
    expect(groups.draft.map((r) => r.id)).toEqual([3]);
    expect(groups.voided.map((r) => r.id)).toEqual([4]);
  });

  it('filters by supplier name or invoice number, ignoring case', () => {
    const list = [
      receipt(1),
      receipt(2, { supplierName: 'Aling Nena', invoiceNo: null }),
    ];
    expect(filterReceipts(list, 'nena').map((r) => r.id)).toEqual([2]);
    expect(filterReceipts(list, 'inv-1').map((r) => r.id)).toEqual([1]);
    expect(filterReceipts(list, '  ')).toHaveLength(2);
  });

  it('groups rows under today, yesterday, and dated headers', () => {
    const items = buildSections(
      [
        receipt(1, { committedAt: local(27, 10) }),
        receipt(2, { committedAt: local(27, 8) }),
        receipt(3, { committedAt: local(26, 9) }),
        receipt(4, { committedAt: local(20, 9) }),
      ],
      NOW,
    );
    const headers = items.filter((i) => i.type === 'header');
    expect(headers.map((h) => [h.bucket, h.count])).toEqual([
      ['today', 2],
      ['yesterday', 1],
      ['date', 1],
    ]);
    expect(items.map((i) => i.key)).toHaveLength(7);
  });

  it('summarizes only this month and counts short deliveries', () => {
    const s = summarizeMonth(
      [
        receipt(1, { committedAt: local(25, 9), totalCost: 500 }),
        receipt(2, { committedAt: local(3, 9), totalCost: 700, shortageQty: 4 }),
        receipt(3, {
          committedAt: new Date(2026, 9, 30).toISOString(),
          totalCost: 9999,
        }),
      ],
      NOW,
    );
    expect(s).toEqual({ count: 2, totalCost: 1200, shortCount: 1 });
  });

  it('builds up to two initials', () => {
    expect(supplierInitials('mang tonyo trading')).toBe('MT');
    expect(supplierInitials('Coke')).toBe('C');
    expect(supplierInitials('  ')).toBe('?');
  });
});
