import { format, subDays } from 'date-fns';
import type { SalesDataPoint } from '@/types/reports.types';
import type { PayablesDueSummary } from '@/types/supplierPayables.types';

export type HomeDestination =
  | 'addProduct'
  | 'inventory'
  | 'restock'
  | 'stocktake'
  | 'utang'
  | 'newSale'
  | 'reports'
  | 'cashEntries'
  | 'receipts'
  | 'supplierPayables';

export interface DayTotal {
  /** Local calendar day as yyyy-MM-dd. */
  date: string;
  amount: number;
  isToday: boolean;
}

/** Last 7 local days, oldest first; days without sales are zero. */
export function buildWeekSeries(
  points: SalesDataPoint[],
  todayTotal: number,
  now: Date = new Date(),
): DayTotal[] {
  const byDate = new Map(points.map((p) => [p.date, p.amount]));
  return Array.from({ length: 7 }, (_, i) => {
    const date = format(subDays(now, 6 - i), 'yyyy-MM-dd');
    const isToday = i === 6;
    // Today uses the live stats total so a new sale shows before reports refetch.
    return {
      date,
      amount: isToday ? todayTotal : (byDate.get(date) ?? 0),
      isToday,
    };
  });
}

/** Whole-percent change, or null when there is no base to compare against. */
export function percentChange(
  current: number,
  previous: number,
): number | null {
  if (previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

export type StocktakeReminder =
  | { status: 'inProgress' }
  | { status: 'never' }
  | { status: 'stale'; days: number };

export const STOCKTAKE_STALE_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Reminds the owner to finish an open count, or to count again after 30 days. */
export function resolveStocktakeReminder(
  hasActiveSession: boolean,
  lastCompletedAt: number | null,
  now: number = Date.now(),
): StocktakeReminder | null {
  if (hasActiveSession) return { status: 'inProgress' };
  if (lastCompletedAt === null) return { status: 'never' };
  const days = Math.floor((now - lastCompletedAt) / DAY_MS);
  return days >= STOCKTAKE_STALE_DAYS ? { status: 'stale', days } : null;
}

export type AttentionKind =
  'outOfStock' | 'lowStock' | 'overdueUtang' | 'supplierDue' | 'stocktake';

export interface AttentionItem {
  kind: AttentionKind;
  tone: 'danger' | 'warning' | 'info';
  destination: HomeDestination;
  count?: number;
  amount?: number;
  stocktake?: StocktakeReminder;
  /** supplierDue only: true when the count is overdue, false when only due soon. */
  overdue?: boolean;
}

export interface AttentionInput {
  outOfStockCount: number;
  lowStockCount: number;
  overdueCount: number;
  overdueAmount: number;
  supplierDue?: PayablesDueSummary | null;
  stocktake: StocktakeReminder | null;
}

/** Ordered to-do list for the owner: empty shelves, utang, supplier debt, then counting. */
export function buildAttentionItems(input: AttentionInput): AttentionItem[] {
  const items: AttentionItem[] = [];
  if (input.outOfStockCount > 0) {
    items.push({
      kind: 'outOfStock',
      tone: 'danger',
      destination: 'restock',
      count: input.outOfStockCount,
    });
  }
  if (input.lowStockCount > 0) {
    items.push({
      kind: 'lowStock',
      tone: 'warning',
      destination: 'restock',
      count: input.lowStockCount,
    });
  }
  if (input.overdueCount > 0) {
    items.push({
      kind: 'overdueUtang',
      tone: 'danger',
      destination: 'utang',
      count: input.overdueCount,
      amount: input.overdueAmount,
    });
  }
  const due = input.supplierDue;
  if (due && (due.overdueCount > 0 || due.dueSoonCount > 0)) {
    const overdue = due.overdueCount > 0;
    items.push({
      kind: 'supplierDue',
      tone: overdue ? 'danger' : 'warning',
      destination: 'supplierPayables',
      count: overdue ? due.overdueCount : due.dueSoonCount,
      amount: overdue ? due.overdueAmount : due.dueSoonAmount,
      overdue,
    });
  }
  if (input.stocktake) {
    items.push({
      kind: 'stocktake',
      tone: 'info',
      destination: 'stocktake',
      stocktake: input.stocktake,
    });
  }
  return items;
}
