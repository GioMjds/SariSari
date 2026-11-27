import { isSameDay, isSameMonth, startOfDay, subDays } from 'date-fns';
import type {
  DeliveryReceiptStatus,
  DeliveryReceiptSummary,
} from '@/types/deliveries.types';
import { parseStoredTimestamp } from '@/utils/timezone';

export type DayBucket = 'today' | 'yesterday' | 'date';

export type ReceiptListItem =
  | { type: 'header'; key: string; bucket: DayBucket; date: Date; count: number }
  | { type: 'receipt'; key: string; receipt: DeliveryReceiptSummary };

export interface MonthSummary {
  count: number;
  totalCost: number;
  shortCount: number;
}

/** The date that matters for each status: received, voided, or started. */
export const receiptDate = (r: DeliveryReceiptSummary): Date | null =>
  parseStoredTimestamp(
    r.status === 'committed'
      ? r.committedAt
      : r.status === 'voided'
        ? r.voidedAt
        : r.createdAt,
  );

const timeOf = (r: DeliveryReceiptSummary): number =>
  receiptDate(r)?.getTime() ?? 0;

/** Splits receipts by status, newest first by their status date. */
export const partitionByStatus = (
  receipts: DeliveryReceiptSummary[],
): Record<DeliveryReceiptStatus, DeliveryReceiptSummary[]> => {
  const out: Record<DeliveryReceiptStatus, DeliveryReceiptSummary[]> = {
    draft: [],
    committed: [],
    voided: [],
  };
  for (const r of receipts) out[r.status].push(r);
  for (const list of Object.values(out)) list.sort((a, b) => timeOf(b) - timeOf(a));
  return out;
};

/** Case-insensitive match on supplier name or invoice number. */
export const filterReceipts = (
  receipts: DeliveryReceiptSummary[],
  query: string,
): DeliveryReceiptSummary[] => {
  const q = query.trim().toLowerCase();
  if (!q) return receipts;
  return receipts.filter(
    (r) =>
      r.supplierName.toLowerCase().includes(q) ||
      (r.invoiceNo ?? '').toLowerCase().includes(q),
  );
};

const bucketOf = (date: Date, now: Date): DayBucket =>
  isSameDay(date, now)
    ? 'today'
    : isSameDay(date, subDays(now, 1))
      ? 'yesterday'
      : 'date';

/** Flattens sorted receipts into day headers followed by their rows. */
export const buildSections = (
  receipts: DeliveryReceiptSummary[],
  now: Date = new Date(),
): ReceiptListItem[] => {
  const items: ReceiptListItem[] = [];
  let header: Extract<ReceiptListItem, { type: 'header' }> | null = null;
  for (const r of receipts) {
    const date = receiptDate(r) ?? new Date(0);
    const day = startOfDay(date);
    if (!header || header.date.getTime() !== day.getTime()) {
      header = {
        type: 'header',
        key: `h-${day.getTime()}`,
        bucket: bucketOf(day, now),
        date: day,
        count: 0,
      };
      items.push(header);
    }
    header.count += 1;
    items.push({ type: 'receipt', key: `r-${r.id}`, receipt: r });
  }
  return items;
};

/** Received deliveries this calendar month, with how many came short. */
export const summarizeMonth = (
  committed: DeliveryReceiptSummary[],
  now: Date = new Date(),
): MonthSummary => {
  const summary: MonthSummary = { count: 0, totalCost: 0, shortCount: 0 };
  for (const r of committed) {
    const date = receiptDate(r);
    if (!date || !isSameMonth(date, now)) continue;
    summary.count += 1;
    summary.totalCost += r.totalCost;
    if (r.shortageQty > 0) summary.shortCount += 1;
  }
  return summary;
};

/** Up to two initials for the supplier avatar. */
export const supplierInitials = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('') || '?';
