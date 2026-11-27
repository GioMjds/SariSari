import { format, isSameDay, subDays } from 'date-fns';
import { Sale, SaleWithItems } from '@/types';
import { parseStoredTimestamp } from './timezone';

export const CANCELLED_KIND = {
  void: { title: 'Voided Sale', stamp: 'VOIDED', note: 'Voided' },
  refund: { title: 'Refunded Sale', stamp: 'REFUNDED', note: 'Refunded' },
  price_correction: {
    title: 'Price Corrected',
    stamp: 'CORRECTED',
    note: 'Replaced by a price correction',
  },
} as const;

export const formatReceiptRef = (id: number) =>
  `SR-${String(id).padStart(4, '0')}`;

// Returns the cancellation copy for a voided, refunded, or corrected sale, else null.
export const getCancelledKind = (sale: Pick<Sale, 'cancelled_at' | 'cancelled_by_kind'>) =>
  sale.cancelled_at ? CANCELLED_KIND[sale.cancelled_by_kind ?? 'void'] : null;

export interface ReceiptTotals {
  count: number;
  cash: number;
  utang: number;
  cancelledCount: number;
}

// Cancelled receipts are counted but never added to cash or utang.
export const summarizeReceipts = (sales: Sale[]): ReceiptTotals => {
  const totals: ReceiptTotals = { count: 0, cash: 0, utang: 0, cancelledCount: 0 };
  for (const sale of sales) {
    totals.count += 1;
    if (sale.cancelled_at) totals.cancelledCount += 1;
    else if (sale.payment_type === 'credit') totals.utang += sale.total || 0;
    else totals.cash += sale.total || 0;
  }
  return totals;
};

export type ReceiptRow =
  | ({ kind: 'day'; key: string; label: string } & ReceiptTotals)
  | { kind: 'sale'; key: string; sale: SaleWithItems };

const dayKeyOf = (sale: Sale) => {
  const date = parseStoredTimestamp(sale.timestamp);
  return date ? format(date, 'yyyy-MM-dd') : 'unknown';
};

const dayLabel = (sale: Sale, now: Date) => {
  const date = parseStoredTimestamp(sale.timestamp);
  if (!date) return 'Unknown date';
  const short = format(date, 'MMM d');
  if (isSameDay(date, now)) return `Today · ${short}`;
  if (isSameDay(date, subDays(now, 1))) return `Yesterday · ${short}`;
  return format(date, 'EEE, MMM d, yyyy');
};

// Interleaves day headers into one page of receipts; day totals span the whole filtered set.
export const buildReceiptRows = (
  pageSales: SaleWithItems[],
  allSales: Sale[],
  now: Date = new Date(),
): ReceiptRow[] => {
  const byDay = new Map<string, Sale[]>();
  for (const sale of allSales) {
    const key = dayKeyOf(sale);
    byDay.set(key, [...(byDay.get(key) ?? []), sale]);
  }

  const rows: ReceiptRow[] = [];
  let lastKey: string | null = null;
  for (const sale of pageSales) {
    const key = dayKeyOf(sale);
    if (key !== lastKey) {
      rows.push({
        kind: 'day',
        key: `day-${key}`,
        label: dayLabel(sale, now),
        ...summarizeReceipts(byDay.get(key) ?? [sale]),
      });
      lastKey = key;
    }
    rows.push({ kind: 'sale', key: `sale-${sale.id}`, sale });
  }
  return rows;
};
