import {
  bucketByDay,
  buildLedgerRows,
  filterLedgerRows,
  groupLedgerRows,
  readableNote,
  resolveStockChange,
  summarizeLedger,
} from '../ledgerMath';
import { InventoryTransaction } from '@/types/inventory.types';
import type { TFunction } from 'i18next';

const tx = (
  id: number,
  type: InventoryTransaction['type'],
  quantity: number,
  timestamp: string,
  extra: Partial<InventoryTransaction> = {},
): InventoryTransaction => ({ id, product_id: 1, type, quantity, timestamp, ...extra });

const LABELS = { today: 'Today', yesterday: 'Yesterday', earlier: 'Earlier' };

const sample = [
  tx(1, 'restock', 10, '2026-11-01T08:00:00Z'),
  tx(2, 'sale', 3, '2026-11-02T09:00:00Z', { note: 'suki order' }),
  tx(3, 'damaged', 1, '2026-11-02T10:00:00Z'),
  tx(4, 'adjustment', 2, '2026-11-03T10:00:00Z', { adjustment_sign: 'negative' }),
];

describe('ledgerMath', () => {
  it('walks balances back from current stock, newest first', () => {
    const rows = buildLedgerRows(sample, 4);
    expect(rows.map((r) => r.id)).toEqual([4, 3, 2, 1]);
    expect(rows.map((r) => r.balance)).toEqual([4, 6, 7, 10]);
  });

  it('keeps true balances after filtering by type', () => {
    const sales = filterLedgerRows(buildLedgerRows(sample, 4), '', 'sale');
    expect(sales).toHaveLength(1);
    expect(sales[0]!.balance).toBe(7);
  });

  it('searches notes and parses SQLite timestamps', () => {
    const rows = buildLedgerRows(
      [...sample, tx(5, 'restock', 1, '2026-11-04 08:00:00')],
      5,
    );
    expect(rows[0]!.id).toBe(5);
    expect(rows[0]!.time).toBe(Date.parse('2026-11-04T08:00:00Z'));
    expect(filterLedgerRows(rows, 'SUKI', 'all').map((r) => r.id)).toEqual([2]);
  });

  it('orders SQLite and ISO timestamps by real time', () => {
    const rows = buildLedgerRows(
      [
        tx(1, 'sale', 1, '2026-11-04 09:00:00'),
        tx(2, 'adjustment', 1, '2026-11-04T08:30:00.000Z', { adjustment_sign: 'negative' }),
      ],
      0,
    );
    expect(rows.map((r) => r.id)).toEqual([1, 2]);
  });

  it('turns machine note tags into readable labels', () => {
    const t = ((key: string) => `<${key}>`) as unknown as TFunction;
    expect(readableNote('[stocktake:miscount]', t)).toBe('<stocktake:reason.miscount>');
    expect(readableNote('[stocktake:spoilage] wet box', t)).toBe('<stocktake:reason.spoilage> · wet box');
    expect(readableNote('void:12', t)).toBe('<corrections:kind_void>');
    expect(readableNote('refund:3:returned_damaged', t)).toBe(
      '<corrections:kind_refund> · <corrections:reason_returned_damaged>',
    );
    expect(readableNote('  suki order ', t)).toBe('suki order');
    expect(readableNote('   ', t)).toBeUndefined();
  });

  it('groups by day with a net per day', () => {
    const sections = groupLedgerRows(buildLedgerRows(sample, 4), LABELS);
    expect(sections.map((s) => s.data.length)).toEqual([1, 2, 1]);
    expect(sections[1]!.net).toBe(-4);
  });

  it('summarizes totals and buckets days ending today', () => {
    const rows = buildLedgerRows(sample, 4);
    expect(summarizeLedger(rows)).toEqual({
      added: 10,
      sold: 3,
      damaged: 1,
      corrected: -2,
      net: 4,
    });
    const buckets = bucketByDay(rows, 3, new Date(2026, 10, 3, 12).getTime());
    expect(buckets).toHaveLength(3);
    expect(buckets[2]!.removed).toBe(2);
  });

  it('resolves shelf counts and plain amounts into a signed change', () => {
    const base = {
      current: 12,
      quantity: 2,
      counted: 9,
      sign: 'positive' as const,
      multiplier: 1,
    };
    expect(
      resolveStockChange({ ...base, type: 'adjustment', adjustMode: 'count' }),
    ).toEqual({ pieces: 3, sign: 'negative', after: 9 });
    expect(
      resolveStockChange({ ...base, type: 'adjustment', adjustMode: 'count', counted: 12 }).pieces,
    ).toBe(0);
    expect(
      resolveStockChange({ ...base, type: 'damaged', adjustMode: 'count' }).after,
    ).toBe(10);
    expect(
      resolveStockChange({ ...base, type: 'restock', adjustMode: 'delta', multiplier: 24 }),
    ).toEqual({ pieces: 48, sign: 'positive', after: 60 });
  });
});
