import { LOW_STOCK_THRESHOLD } from '@/constants/stocks';
import { CreditTransaction } from '@/types/credits.types';
import { DateRange, DateRangeType } from '@/types/reports.types';
import { endOfDay, startOfDay, startOfMonth, subDays } from 'date-fns';

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

export const formatCurrency = (amount: number) => {
	return `₱${amount.toLocaleString('en-PH', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	})}`;
};

export const formatCompactCurrency = (amount: number) => {
	if (amount >= 1000000) {
		return `₱${(amount / 1000000).toFixed(1)}M`;
	} else if (amount >= 1000) {
		return `₱${(amount / 1000).toFixed(1)}k`;
	}
	return `₱${amount.toFixed(0)}`;
};

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
export const calculateProfit = (sellingPrice: number, costPrice?: number): number | null => {
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
export const calculateMargin = (sellingPrice: number, costPrice?: number): number | null => {
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
export const calculateMarkup = (sellingPrice: number, costPrice?: number): number | null => {
	if (costPrice === undefined || costPrice === null || costPrice === 0) return null;
	const profit = sellingPrice - costPrice;
	return (profit / costPrice) * 100;
};