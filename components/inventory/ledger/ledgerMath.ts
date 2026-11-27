import { format, isToday, isValid, isYesterday, startOfDay } from 'date-fns';
import type { TFunction } from 'i18next';
import { InventoryTransaction } from '@/types/inventory.types';
import { parseStoredTimestamp } from '@/utils/timezone';
import { LedgerTypeFilter } from './types';

export type LedgerRowData = InventoryTransaction & {
  signed: number;
  balance: number;
  time: number;
  timeLabel: string;
  dayKey: string;
  searchText: string;
};

export type LedgerSection = {
  key: string;
  title: string;
  net: number;
  data: LedgerRowData[];
};

export type LedgerTotals = {
  added: number;
  sold: number;
  damaged: number;
  corrected: number;
  net: number;
};

export type DayBucket = { added: number; removed: number };

const DAY_MS = 24 * 60 * 60 * 1000;

export function signedQuantity(tx: {
  type: InventoryTransaction['type'];
  quantity: number;
  adjustment_sign?: 'positive' | 'negative' | null;
}): number {
  if (tx.type === 'restock') return tx.quantity;
  if (tx.type === 'sale' || tx.type === 'damaged') return -tx.quantity;
  if (tx.type === 'adjustment') {
    return tx.adjustment_sign === 'negative' ? -tx.quantity : tx.quantity;
  }
  return 0;
}

export type AdjustMode = 'count' | 'delta';

export type StockChangeInput = {
  type: InventoryTransaction['type'];
  current: number;
  quantity: number;
  counted: number;
  adjustMode: AdjustMode;
  sign: 'positive' | 'negative';
  multiplier: number;
};

// Count mode turns a shelf count into the signed difference against recorded stock.
export function resolveStockChange(input: StockChangeInput): {
  pieces: number;
  sign: 'positive' | 'negative';
  after: number;
} {
  if (input.type === 'adjustment' && input.adjustMode === 'count') {
    const diff = input.counted - input.current;
    return {
      pieces: Math.abs(diff),
      sign: diff < 0 ? 'negative' : 'positive',
      after: input.counted,
    };
  }
  const pieces = input.quantity * input.multiplier;
  const signed = signedQuantity({
    type: input.type,
    quantity: pieces,
    adjustment_sign: input.sign,
  });
  return { pieces, sign: input.sign, after: input.current + signed };
}

// Stocktake, void and refund writers store machine tags as notes; map them to translated labels.
export function readableNote(
  note: string | null | undefined,
  t: TFunction,
): string | undefined {
  const raw = note?.trim();
  if (!raw) return undefined;
  const stocktake = raw.match(/^\[stocktake:(\w+)\]\s*(.*)$/);
  if (stocktake) {
    const code = stocktake[1] ?? '';
    const label = t(`stocktake:reason.${code}`, { defaultValue: code });
    return stocktake[2] ? `${label} · ${stocktake[2]}` : label;
  }
  if (/^void:\d+$/.test(raw)) return t('corrections:kind_void');
  const refund = raw.match(/^refund:\d+:(\w+)$/);
  if (refund) {
    const code = refund[1] ?? '';
    const reason = t(`corrections:reason_${code}`, { defaultValue: code });
    return `${t('corrections:kind_refund')} · ${reason}`;
  }
  return raw;
}

export function parseLedgerDate(timestamp: string): Date | null {
  const d = parseStoredTimestamp(timestamp);
  return d && isValid(d) ? d : null;
}

// Balances walk back from current stock over every entry, so filtering later never changes them.
export function buildLedgerRows(
  transactions: InventoryTransaction[],
  currentStock: number,
): LedgerRowData[] {
  const rows = transactions.map((tx) => {
    const date = parseLedgerDate(tx.timestamp);
    return {
      ...tx,
      signed: signedQuantity(tx),
      balance: 0,
      time: date ? date.getTime() : 0,
      timeLabel: date ? format(date, 'h:mm a') : tx.timestamp,
      dayKey: date ? format(date, 'yyyy-MM-dd') : 'unknown',
      searchText: [
        tx.product_name,
        tx.note,
        date ? format(date, 'EEE MMM d yyyy h:mm a') : tx.timestamp,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase(),
    };
  });
  rows.sort((a, b) => b.time - a.time);
  let running = currentStock;
  for (const row of rows) {
    row.balance = running;
    running -= row.signed;
  }
  return rows;
}

export function filterLedgerRows(
  rows: LedgerRowData[],
  query: string,
  type: LedgerTypeFilter,
): LedgerRowData[] {
  const q = query.trim().toLowerCase();
  if (!q && type === 'all') return rows;
  return rows.filter(
    (row) =>
      (type === 'all' || row.type === type) &&
      (!q || row.searchText.includes(q)),
  );
}

export function groupLedgerRows(
  rows: LedgerRowData[],
  labels: { today: string; yesterday: string; earlier: string },
): LedgerSection[] {
  const sections: LedgerSection[] = [];
  let current: LedgerSection | undefined;
  for (const row of rows) {
    if (!current || current.key !== row.dayKey) {
      current = {
        key: row.dayKey,
        title: dayTitle(row, labels),
        net: 0,
        data: [],
      };
      sections.push(current);
    }
    current.net += row.signed;
    current.data.push(row);
  }
  return sections;
}

function dayTitle(
  row: LedgerRowData,
  labels: { today: string; yesterday: string; earlier: string },
): string {
  if (row.dayKey === 'unknown') return labels.earlier;
  const date = new Date(row.time);
  if (isToday(date)) return labels.today;
  if (isYesterday(date)) return labels.yesterday;
  return format(date, 'EEE, MMM d');
}

export function summarizeLedger(rows: LedgerRowData[]): LedgerTotals {
  const totals: LedgerTotals = {
    added: 0,
    sold: 0,
    damaged: 0,
    corrected: 0,
    net: 0,
  };
  for (const row of rows) {
    if (row.type === 'restock') totals.added += row.quantity;
    else if (row.type === 'sale') totals.sold += row.quantity;
    else if (row.type === 'damaged') totals.damaged += row.quantity;
    else if (row.type === 'adjustment') totals.corrected += row.signed;
    totals.net += row.signed;
  }
  return totals;
}

// One bucket per calendar day, oldest first, ending today.
export function bucketByDay(
  rows: LedgerRowData[],
  days: number,
  now: number = Date.now(),
): DayBucket[] {
  const buckets: DayBucket[] = Array.from({ length: days }, () => ({
    added: 0,
    removed: 0,
  }));
  const today = startOfDay(now).getTime();
  for (const row of rows) {
    if (!row.time) continue;
    const ago = Math.round((today - startOfDay(row.time).getTime()) / DAY_MS);
    if (ago < 0 || ago >= days) continue;
    const bucket = buckets[days - 1 - ago]!;
    if (row.signed > 0) bucket.added += row.signed;
    else bucket.removed -= row.signed;
  }
  return buckets;
}
