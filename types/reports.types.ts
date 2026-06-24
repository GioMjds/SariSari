export interface DateRange {
	startDate: Date;
	endDate: Date;
	label: string;
}

export type DateRangeType = 'today' | 'yesterday' | 'last7days' | 'thisMonth' | 'custom';

export interface ReportKPIs {
	totalSales: number;
	// Profit is nullable: when no sold units in the range have a recorded
	// cost_price, profit is unknown (not zero). The UI must render null as
	// "unavailable" or "add cost prices to see profit".
	totalProfit: number | null;
	totalCreditsIssued: number;
	totalCreditsCollected: number;
	totalExpenses: number;
	inventoryCostOut: number;
	// Fraction of sold units in the range that had a recorded cost_price.
	// 0 means profit was definitely 0; null means there were no sales to
	// measure coverage against.
	profitCoverage: number | null;
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
	// Fraction of in-stock products that had a recorded cost_price, so the
	// UI can warn the owner that the cost-side number is partial.
	costCoverage: number | null;
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
	// Same nullable contract as ReportKPIs.totalProfit — null means we
	// couldn't compute a profit number because no sold units had cost data.
	totalProfit: number | null;
	marginPercent: number | null;
	coverage: number | null;
	profitByCategory?: { category: string; profit: number }[];
}

export interface ReportInsight {
	type: 'success' | 'warning' | 'info';
	title: string;
	message: string;
	icon: string;
}
