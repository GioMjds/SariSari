import type { DateRange, DateRangeType } from '@/types/reports.types';
import { endOfDay, startOfDay, startOfMonth, subDays, subMonths } from 'date-fns';

/** The window the current range is compared against, cut at the same point so partial periods stay fair. */
export function getPreviousDateRange(
  type: DateRangeType,
  now: Date = new Date(),
): DateRange {
  switch (type) {
    case 'today':
      return {
        startDate: startOfDay(subDays(now, 1)),
        endDate: subDays(now, 1),
        label: 'yesterday',
      };
    case 'yesterday':
      return {
        startDate: startOfDay(subDays(now, 2)),
        endDate: endOfDay(subDays(now, 2)),
        label: 'dayBefore',
      };
    case 'last7days':
      return {
        startDate: startOfDay(subDays(now, 13)),
        endDate: endOfDay(subDays(now, 7)),
        label: 'prev7days',
      };
    case 'thisMonth':
    case 'custom': {
      // subMonths clamps the day, so Mar 31 compares against Feb 28.
      const lastMonth = subMonths(now, 1);
      return {
        startDate: startOfMonth(lastMonth),
        endDate: lastMonth,
        label: 'lastMonth',
      };
    }
  }
}

/** Splits revenue into cost, gastos and what is left, as shares of revenue for a stacked bar. */
export function profitFlowShares(
  revenue: number,
  cogs: number,
  expenses: number,
): { cost: number; expenses: number; profit: number } {
  if (revenue <= 0) return { cost: 0, expenses: 0, profit: 0 };
  const cost = Math.min(cogs, revenue);
  const spent = Math.min(expenses, revenue - cost);
  return {
    cost: cost / revenue,
    expenses: spent / revenue,
    profit: (revenue - cost - spent) / revenue,
  };
}
