import { FontAwesome } from '@expo/vector-icons';

export interface SalesFilterState {
	paymentType: PaymentTypeFilter;
	dateRange: DateRangeFilter;
}

export type PaymentTypeFilter = 'all' | 'cash' | 'credit';
export type DateRangeFilter =
	| 'all'
	| 'today'
	| 'yesterday'
	| 'last7days'
	| 'last30days'
	| 'thisMonth'
	| 'lastMonth';

interface PaymentOptions {
	value: PaymentTypeFilter;
	label: string;
	icon: keyof typeof FontAwesome.glyphMap;
}

interface DateRangeOptions {
	value: DateRangeFilter;
	label: string;
}

export const paymentTypeOptions: PaymentOptions[] = [
	{ value: 'all', label: 'All Payments', icon: 'list' },
	{ value: 'cash', label: 'Cash Only', icon: 'money' },
	{ value: 'credit', label: 'Credit Only', icon: 'credit-card' },
];

export const dateRangeOptions: DateRangeOptions[] = [
	{ value: 'all', label: 'All Time' },
	{ value: 'today', label: 'Today' },
	{ value: 'yesterday', label: 'Yesterday' },
	{ value: 'last7days', label: 'Last 7 Days' },
	{ value: 'last30days', label: 'Last 30 Days' },
	{ value: 'thisMonth', label: 'This Month' },
	{ value: 'lastMonth', label: 'Last Month' },
];
