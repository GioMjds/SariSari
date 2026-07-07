import { LOW_STOCK_THRESHOLD } from '@/constants/stocks';
import { formatPesos, formatPesosCompact } from '@/lib/money';
import { CreditTransaction } from '@/types/credits.types';
import { DateRange, DateRangeType } from '@/types/reports.types';
import { endOfDay, startOfDay, startOfMonth, subDays } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { Linking } from 'react-native';

export const getDateRangeFromType = (type: DateRangeType): DateRange => {
  const now = new Date();

  switch (type) {
    case 'today':
      return {
        startDate: startOfDay(now),
        endDate: endOfDay(now),
        label: 'Today',
      };
    case 'yesterday':
      const yesterday = subDays(now, 1);
      return {
        startDate: startOfDay(yesterday),
        endDate: endOfDay(yesterday),
        label: 'Yesterday',
      };
    case 'last7days':
      return {
        startDate: startOfDay(subDays(now, 6)),
        endDate: endOfDay(now),
        label: 'Last 7 Days',
      };
    case 'thisMonth':
      return {
        startDate: startOfMonth(now),
        endDate: endOfDay(now),
        label: 'This Month',
      };
    case 'custom':
      return {
        startDate: startOfDay(now),
        endDate: endOfDay(now),
        label: 'Custom',
      };
  }
};

export const formatCurrency = (amount: number) => formatPesos(amount);

export const formatCompactCurrency = (amount: number) => formatPesosCompact(amount);

export const getStockColor = (quantity: number) => {
  if (quantity === 0) return 'text-red-600';
  if (quantity < LOW_STOCK_THRESHOLD) return 'text-yellow-600';
  return 'text-green-600';
};

export const getStatusColor = (status: CreditTransaction['status']) => {
  switch (status) {
    case 'paid':
      return 'text-green-600 bg-green-100';
    case 'partial':
      return 'text-yellow-600 bg-yellow-100';
    case 'unpaid':
      return 'text-red-600 bg-red-100';
  }
};

/**
 * Calculate profit per piece (tubo)
 * @param sellingPrice - Price product is sold for
 * @param costPrice - Price product was bought for
 * @returns Profit amount or null if cost price not available
 */
export const calculateProfit = (
  sellingPrice: number,
  costPrice?: number,
): number | null => {
  if (costPrice === undefined || costPrice === null) return null;
  return sellingPrice - costPrice;
};

/**
 * Calculate profit margin percentage
 * Margin = (Profit / Selling Price) × 100
 * @param sellingPrice - Price product is sold for
 * @param costPrice - Price product was bought for
 * @returns Margin percentage or null if cost price not available
 */
export const calculateMargin = (
  sellingPrice: number,
  costPrice?: number,
): number | null => {
  if (costPrice === undefined || costPrice === null) return null;
  const profit = sellingPrice - costPrice;
  if (sellingPrice === 0) return null;
  return (profit / sellingPrice) * 100;
};

/**
 * Calculate markup percentage
 * Markup = (Profit / Cost Price) × 100
 * @param sellingPrice - Price product is sold for
 * @param costPrice - Price product was bought for
 * @returns Markup percentage or null if cost price not available
 */
export const calculateMarkup = (
  sellingPrice: number,
  costPrice?: number,
): number | null => {
  if (costPrice === undefined || costPrice === null || costPrice === 0)
    return null;
  const profit = sellingPrice - costPrice;
  return (profit / costPrice) * 100;
};

export const getStockStatus = (quantity: number) => {
  if (quantity === 0)
    return {
      color: 'text-red-600',
      label: 'Out of Stock',
      bg: 'bg-red-50',
    };
  if (quantity < LOW_STOCK_THRESHOLD)
    return {
      color: 'text-red-600',
      label: 'Low Stock',
      bg: 'bg-red-50',
    };
  if (quantity < LOW_STOCK_THRESHOLD * 3)
    return {
      color: 'text-yellow-600',
      label: 'Medium Stock',
      bg: 'bg-yellow-50',
    };
  return {
    color: 'text-green-600',
    label: 'In Stock',
    bg: 'bg-green-50',
  };
};

/** Issue number = day of year. Gives a stable, per-day serial. */
export function dateIssueNumber(d: Date): string {
	const startUtc = Date.UTC(d.getFullYear(), 0, 0);
	const currentUtc = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
	const day = Math.floor((currentUtc - startUtc) / 86_400_000);
	return String(day).padStart(4, '0');
}

/** Returns a formatted margin subline string (e.g. "12.5% margin") if present. */
export function profitSubline(margin: number | null | undefined): string {
	if (margin === null || margin === undefined) return '';
	return `${margin.toFixed(1)}% margin`;
}

export function dialPhone(phone: string) {
  Haptics.selectionAsync().catch(() => {});
  const url = `tel:${phone}`;
  Linking.openURL(url).catch(() => {});
}

export function smsPhone(phone: string, name: string) {
  Haptics.selectionAsync().catch(() => {});
  const body = `Hi ${name}, this is a quick reminder from the sari-sari store about your outstanding balance. Maraming salamat!`;
  const url = `sms:${phone}?body=${encodeURIComponent(body)}`;
  Linking.openURL(url).catch(() => {});
}