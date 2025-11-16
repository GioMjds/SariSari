export interface DateRange {
	startDate: Date;
	endDate: Date;
	label: string;
}

export type DateRangeType = 'today' | 'yesterday' | 'last7days' | 'thisMonth' | 'custom';

export interface ReportKPIs {
	totalSales: number;
	totalProfit: number;
	totalCreditsIssued: number;
	totalCreditsCollected: number;
	totalExpenses: number;
	inventoryCostOut: number;
}

export interface SalesDataPoint {
	date: string;
	amount: number;
	profit?: number;
}

export interface TopSellingProduct {
	id: number;
	name: string;
	unitsSold: number;
	revenue: number;
	profit?: number;
}

export interface SalesBreakdown {
	cashSales: number;
	creditSales: number;
	averageTransactionValue: number;
	totalTransactions: number;
}

export interface InventoryMovement {
	itemsSold: number;
	lowStockCount: number;
	outOfStockCount: number;
}

export interface StockItem {
	id: number;
	name: string;
	quantity: number;
	costPrice: number;
	sellingPrice: number;
	velocity?: 'fast' | 'slow';
}

export interface InventoryValue {
	currentStockValue: number;
	potentialSalesValue: number;
}

export interface CreditsOverview {
	issued: number;
	collected: number;
	outstanding: number;
	activeAccounts: number;
}

export interface AgingBucket {
	range: string;
	amount: number;
	count: number;
}

export interface ProfitabilityData {
	totalProfit: number;
	marginPercent: number;
	profitByCategory?: { category: string; profit: number }[];
}

export interface ReportInsight {
	type: 'success' | 'warning' | 'info';
	title: string;
	message: string;
	icon: string;
}
