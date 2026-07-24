export interface DateRange {
	startDate: Date;
	endDate: Date;
	label: string;
}

export type DateRangeType = 'today' | 'yesterday' | 'last7days' | 'thisMonth' | 'custom';

export interface ReportKPIs {
	totalSales: number;
	totalProfit: number | null;
	grossProfit: number | null;
	operatingProfit: number | null;
	paidExpenses: number;
	ownerDrawings: number;
	totalCreditsIssued: number;
	totalCreditsCollected: number;
	totalExpenses: number;
	inventoryCostOut: number;
	profitCoverage: number | null;
	marginPercent: number | null;
}

export interface SalesDataPoint {
	date: string;
	amount: number;
	profit?: number;
}

export interface StockItem {
	id: number;
	name: string;
	quantity: number;
	costPrice: number;
	sellingPrice: number;
	velocity?: 'fast' | 'slow';
}

export interface TopSellingProduct extends StockItem {
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

export interface ReportInsight {
	type: 'success' | 'warning' | 'info';
	title: string;
	message: string;
	icon: string;
}
