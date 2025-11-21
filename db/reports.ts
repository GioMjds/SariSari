import {
	AgingBucket,
	CreditsOverview,
	DateRange,
	InventoryMovement,
	InventoryValue,
	ProfitabilityData,
	ReportInsight,
	ReportKPIs,
	SalesBreakdown,
	SalesDataPoint,
	StockItem,
	TopSellingProduct,
} from '@/types/reports.types';
import { endOfDay, format, startOfDay } from 'date-fns';
import { db } from '../configs/sqlite';

// ==================== DATE HELPERS ====================

export const formatDateForSQL = (date: Date): string => {
	return format(date, 'yyyy-MM-dd HH:mm:ss');
};

// ==================== KPI FUNCTIONS ====================

export const getReportKPIs = async (
	dateRange: DateRange
): Promise<ReportKPIs> => {
	const startDate = formatDateForSQL(startOfDay(dateRange.startDate));
	const endDate = formatDateForSQL(endOfDay(dateRange.endDate));

	// Total Sales
	const salesResult = await db.getFirstAsync<{ total: number }>(
		`SELECT COALESCE(SUM(total), 0) as total 
     FROM sales 
     WHERE timestamp BETWEEN ? AND ?`,
		[startDate, endDate]
	);

	// Total Profit (requires cost price in products table - we'll estimate)
	const profitResult = await db.getFirstAsync<{ profit: number }>(
		`SELECT COALESCE(SUM(si.quantity * (si.price - COALESCE(p.cost_price, si.price * 0.6))), 0) as profit
     FROM sale_items si
     JOIN sales s ON si.sale_id = s.id
     LEFT JOIN products p ON si.product_id = p.id
     WHERE s.timestamp BETWEEN ? AND ?`,
		[startDate, endDate]
	);

	// Credits Issued
	const creditsIssuedResult = await db.getFirstAsync<{ total: number }>(
		`SELECT COALESCE(SUM(amount), 0) as total 
     FROM credit_transactions 
     WHERE date BETWEEN ? AND ?`,
		[startDate, endDate]
	);

	// Credits Collected
	const creditsCollectedResult = await db.getFirstAsync<{ total: number }>(
		`SELECT COALESCE(SUM(amount), 0) as total 
     FROM payments 
     WHERE date BETWEEN ? AND ?`,
		[startDate, endDate]
	);

	// Inventory Cost Out (COGS)
	const cogsResult = await db.getFirstAsync<{ total: number }>(
		`SELECT COALESCE(SUM(si.quantity * COALESCE(p.cost_price, si.price * 0.6)), 0) as total
     FROM sale_items si
     JOIN sales s ON si.sale_id = s.id
     LEFT JOIN products p ON si.product_id = p.id
     WHERE s.timestamp BETWEEN ? AND ?`,
		[startDate, endDate]
	);

	return {
		totalSales: salesResult?.total || 0,
		totalProfit: profitResult?.profit || 0,
		totalCreditsIssued: creditsIssuedResult?.total || 0,
		totalCreditsCollected: creditsCollectedResult?.total || 0,
		totalExpenses: 0, // Can be extended later
		inventoryCostOut: cogsResult?.total || 0,
	};
};

// ==================== SALES REPORTS ====================

export const getSalesOverTime = async (
	dateRange: DateRange
): Promise<SalesDataPoint[]> => {
	const startDate = formatDateForSQL(startOfDay(dateRange.startDate));
	const endDate = formatDateForSQL(endOfDay(dateRange.endDate));

	const results = await db.getAllAsync<{
		date: string;
		amount: number;
		profit: number;
	}>(
		`SELECT 
       date(timestamp) as date,
       COALESCE(SUM(total), 0) as amount,
       COALESCE(SUM(
         (SELECT SUM(si.quantity * (si.price - COALESCE(p.cost_price, si.price * 0.6)))
          FROM sale_items si
          LEFT JOIN products p ON si.product_id = p.id
          WHERE si.sale_id = s.id)
       ), 0) as profit
     FROM sales s
     WHERE timestamp BETWEEN ? AND ?
     GROUP BY date(timestamp)
     ORDER BY date ASC`,
		[startDate, endDate]
	);

	return results;
};

export const getTopSellingProducts = async (
	dateRange: DateRange,
	limit: number = 10
): Promise<TopSellingProduct[]> => {
	const startDate = formatDateForSQL(startOfDay(dateRange.startDate));
	const endDate = formatDateForSQL(endOfDay(dateRange.endDate));

	const results = await db.getAllAsync<TopSellingProduct>(
		`SELECT 
       p.id,
       p.name,
       COALESCE(SUM(si.quantity), 0) as unitsSold,
       COALESCE(SUM(si.quantity * si.price), 0) as revenue,
       COALESCE(SUM(si.quantity * (si.price - COALESCE(p.cost_price, si.price * 0.6))), 0) as profit
     FROM products p
     JOIN sale_items si ON p.id = si.product_id
     JOIN sales s ON si.sale_id = s.id
     WHERE s.timestamp BETWEEN ? AND ?
     GROUP BY p.id, p.name
     ORDER BY unitsSold DESC
     LIMIT ?`,
		[startDate, endDate, limit]
	);

	return results;
};

export const getSalesBreakdown = async (
	dateRange: DateRange
): Promise<SalesBreakdown> => {
	const startDate = formatDateForSQL(startOfDay(dateRange.startDate));
	const endDate = formatDateForSQL(endOfDay(dateRange.endDate));

	const breakdown = await db.getFirstAsync<{
		cashSales: number;
		creditSales: number;
		totalTransactions: number;
		totalAmount: number;
	}>(
		`SELECT 
       COALESCE(SUM(CASE WHEN payment_type = 'cash' THEN total ELSE 0 END), 0) as cashSales,
       COALESCE(SUM(CASE WHEN payment_type = 'credit' THEN total ELSE 0 END), 0) as creditSales,
       COUNT(*) as totalTransactions,
       COALESCE(SUM(total), 0) as totalAmount
     FROM sales
     WHERE timestamp BETWEEN ? AND ?`,
		[startDate, endDate]
	);

	return {
		cashSales: breakdown?.cashSales || 0,
		creditSales: breakdown?.creditSales || 0,
		totalTransactions: breakdown?.totalTransactions || 0,
		averageTransactionValue:
			breakdown?.totalTransactions && breakdown.totalTransactions > 0
				? breakdown.totalAmount / breakdown.totalTransactions
				: 0,
	};
};

// ==================== INVENTORY REPORTS ====================

export const getInventoryMovement = async (
	dateRange: DateRange
): Promise<InventoryMovement> => {
	const startDate = formatDateForSQL(startOfDay(dateRange.startDate));
	const endDate = formatDateForSQL(endOfDay(dateRange.endDate));

	const itemsSoldResult = await db.getFirstAsync<{ total: number }>(
		`SELECT COALESCE(SUM(si.quantity), 0) as total
     FROM sale_items si
     JOIN sales s ON si.sale_id = s.id
     WHERE s.timestamp BETWEEN ? AND ?`,
		[startDate, endDate]
	);

	const lowStockResult = await db.getFirstAsync<{ count: number }>(
		`SELECT COUNT(*) as count FROM products WHERE quantity > 0 AND quantity <= 10`
	);

	const outOfStockResult = await db.getFirstAsync<{ count: number }>(
		`SELECT COUNT(*) as count FROM products WHERE quantity = 0`
	);

	return {
		itemsSold: itemsSoldResult?.total || 0,
		lowStockCount: lowStockResult?.count || 0,
		outOfStockCount: outOfStockResult?.count || 0,
	};
};

export const getLowStockItems = async (
	threshold: number = 10
): Promise<StockItem[]> => {
	const results = await db.getAllAsync<any>(
		`SELECT 
       id, 
       name, 
       quantity,
       price as sellingPrice,
       COALESCE(cost_price, price * 0.6) as costPrice
     FROM products 
     WHERE quantity > 0 AND quantity <= ?
     ORDER BY quantity ASC`,
		[threshold]
	);

	return results;
};

export const getOutOfStockItems = async (): Promise<StockItem[]> => {
	const results = await db.getAllAsync<any>(
		`SELECT 
       id, 
       name, 
       quantity,
       price as sellingPrice,
       COALESCE(cost_price, price * 0.6) as costPrice
     FROM products 
     WHERE quantity = 0
     ORDER BY name ASC`
	);

	return results;
};

export const getInventoryValue = async (): Promise<InventoryValue> => {
	const result = await db.getFirstAsync<{
		currentStockValue: number;
		potentialSalesValue: number;
	}>(
		`SELECT 
       COALESCE(SUM(quantity * COALESCE(cost_price, price * 0.6)), 0) as currentStockValue,
       COALESCE(SUM(quantity * price), 0) as potentialSalesValue
     FROM products
     WHERE quantity > 0`
	);

	return {
		currentStockValue: result?.currentStockValue || 0,
		potentialSalesValue: result?.potentialSalesValue || 0,
	};
};

export const getFastMovingProducts = async (
	dateRange: DateRange,
	limit: number = 10
): Promise<StockItem[]> => {
	const startDate = formatDateForSQL(startOfDay(dateRange.startDate));
	const endDate = formatDateForSQL(endOfDay(dateRange.endDate));

	const results = await db.getAllAsync<any>(
		`SELECT 
       p.id,
       p.name,
       p.quantity,
       p.price as sellingPrice,
       COALESCE(p.cost_price, p.price * 0.6) as costPrice,
       'fast' as velocity
     FROM products p
     JOIN sale_items si ON p.id = si.product_id
     JOIN sales s ON si.sale_id = s.id
     WHERE s.timestamp BETWEEN ? AND ?
     GROUP BY p.id
     ORDER BY SUM(si.quantity) DESC
     LIMIT ?`,
		[startDate, endDate, limit]
	);

	return results;
};

export const getSlowMovingProducts = async (
	dateRange: DateRange,
	limit: number = 10
): Promise<StockItem[]> => {
	const startDate = formatDateForSQL(startOfDay(dateRange.startDate));
	const endDate = formatDateForSQL(endOfDay(dateRange.endDate));

	const results = await db.getAllAsync<any>(
		`SELECT 
       p.id,
       p.name,
       p.quantity,
       p.price as sellingPrice,
       COALESCE(p.cost_price, p.price * 0.6) as costPrice,
       'slow' as velocity
     FROM products p
     LEFT JOIN sale_items si ON p.id = si.product_id
     LEFT JOIN sales s ON si.sale_id = s.id AND s.timestamp BETWEEN ? AND ?
     WHERE p.quantity > 0
     GROUP BY p.id
     ORDER BY COALESCE(SUM(si.quantity), 0) ASC
     LIMIT ?`,
		[startDate, endDate, limit]
	);

	return results;
};

// ==================== CREDITS REPORTS ====================

export const getCreditsOverview = async (
	dateRange: DateRange
): Promise<CreditsOverview> => {
	const startDate = formatDateForSQL(startOfDay(dateRange.startDate));
	const endDate = formatDateForSQL(endOfDay(dateRange.endDate));

	const issued = await db.getFirstAsync<{ total: number }>(
		`SELECT COALESCE(SUM(amount), 0) as total 
     FROM credit_transactions 
     WHERE date BETWEEN ? AND ?`,
		[startDate, endDate]
	);

	const collected = await db.getFirstAsync<{ total: number }>(
		`SELECT COALESCE(SUM(amount), 0) as total 
     FROM payments 
     WHERE date BETWEEN ? AND ?`,
		[startDate, endDate]
	);

	const outstanding = await db.getFirstAsync<{ total: number }>(
		`SELECT COALESCE(SUM(amount - amount_paid), 0) as total 
     FROM credit_transactions 
     WHERE status != 'paid'`
	);

	const activeAccounts = await db.getFirstAsync<{ count: number }>(
		`SELECT COUNT(DISTINCT customer_id) as count 
     FROM credit_transactions 
     WHERE status != 'paid'`
	);

	return {
		issued: issued?.total || 0,
		collected: collected?.total || 0,
		outstanding: outstanding?.total || 0,
		activeAccounts: activeAccounts?.count || 0,
	};
};

export const getAgingBuckets = async (): Promise<AgingBucket[]> => {
	const buckets: AgingBucket[] = [
		{ range: '0-7 days', amount: 0, count: 0 },
		{ range: '8-15 days', amount: 0, count: 0 },
		{ range: '16-30 days', amount: 0, count: 0 },
		{ range: 'Over 30 days', amount: 0, count: 0 },
	];

	const results = await db.getAllAsync<{
		days_old: number;
		amount: number;
		count: number;
	}>(
		`SELECT 
       CAST(julianday('now') - julianday(date) AS INTEGER) as days_old,
       SUM(amount - amount_paid) as amount,
       COUNT(*) as count
     FROM credit_transactions
     WHERE status != 'paid'
     GROUP BY CAST(julianday('now') - julianday(date) AS INTEGER)`
	);

	for (const result of results) {
		if (result.days_old <= 7) {
			buckets[0].amount += result.amount;
			buckets[0].count += result.count;
		} else if (result.days_old <= 15) {
			buckets[1].amount += result.amount;
			buckets[1].count += result.count;
		} else if (result.days_old <= 30) {
			buckets[2].amount += result.amount;
			buckets[2].count += result.count;
		} else {
			buckets[3].amount += result.amount;
			buckets[3].count += result.count;
		}
	}

	return buckets;
};

// ==================== PROFITABILITY REPORTS ====================

export const getProfitabilityData = async (
	dateRange: DateRange
): Promise<ProfitabilityData> => {
	const startDate = formatDateForSQL(startOfDay(dateRange.startDate));
	const endDate = formatDateForSQL(endOfDay(dateRange.endDate));

	const profitResult = await db.getFirstAsync<{
		totalProfit: number;
		totalRevenue: number;
	}>(
		`SELECT 
       COALESCE(SUM(si.quantity * (si.price - COALESCE(p.cost_price, si.price * 0.6))), 0) as totalProfit,
       COALESCE(SUM(si.quantity * si.price), 0) as totalRevenue
     FROM sale_items si
     JOIN sales s ON si.sale_id = s.id
     LEFT JOIN products p ON si.product_id = p.id
     WHERE s.timestamp BETWEEN ? AND ?`,
		[startDate, endDate]
	);

	const marginPercent =
		profitResult && profitResult.totalRevenue > 0
			? (profitResult.totalProfit / profitResult.totalRevenue) * 100
			: 0;

	return {
		totalProfit: profitResult?.totalProfit || 0,
		marginPercent,
	};
};

// ==================== INSIGHTS ====================

export const getReportInsights = async (
	dateRange: DateRange
): Promise<ReportInsight[]> => {
	const insights: ReportInsight[] = [];
	const startDate = formatDateForSQL(startOfDay(dateRange.startDate));
	const endDate = formatDateForSQL(endOfDay(dateRange.endDate));

	// Best selling item
	const bestSeller = await db.getFirstAsync<{
		name: string;
		quantity: number;
	}>(
		`SELECT p.name, SUM(si.quantity) as quantity
     FROM products p
     JOIN sale_items si ON p.id = si.product_id
     JOIN sales s ON si.sale_id = s.id
     WHERE s.timestamp BETWEEN ? AND ?
     GROUP BY p.id
     ORDER BY quantity DESC
     LIMIT 1`,
		[startDate, endDate]
	);

	if (bestSeller) {
		insights.push({
			type: 'success',
			title: 'Top Performer',
			message: `${bestSeller.name} sold ${bestSeller.quantity} units`,
			icon: 'trophy',
		});
	}

	// Low stock warning
	const lowStockCount = await db.getFirstAsync<{ count: number }>(
		`SELECT COUNT(*) as count FROM products WHERE quantity > 0 AND quantity <= 5`
	);

	if (lowStockCount && lowStockCount.count > 0) {
		insights.push({
			type: 'warning',
			title: 'Stock Alert',
			message: `${lowStockCount.count} item${lowStockCount.count > 1 ? 's' : ''} need urgent restock`,
			icon: 'exclamation-triangle',
		});
	}

	// Highest credit customer
	const highestCredit = await db.getFirstAsync<{
		name: string;
		amount: number;
	}>(
		`SELECT c.name, SUM(ct.amount - ct.amount_paid) as amount
     FROM customers c
     JOIN credit_transactions ct ON c.id = ct.customer_id
     WHERE ct.status != 'paid'
     GROUP BY c.id
     ORDER BY amount DESC
     LIMIT 1`
	);

	if (highestCredit && highestCredit.amount > 0) {
		insights.push({
			type: 'info',
			title: 'Top Credit Account',
			message: `${highestCredit.name} owes ₱${highestCredit.amount.toFixed(2)}`,
			icon: 'user',
		});
	}

	// Day with lowest sales
	const lowestSalesDay = await db.getFirstAsync<{
		date: string;
		amount: number;
	}>(
		`SELECT date(timestamp) as date, SUM(total) as amount
     FROM sales
     WHERE timestamp BETWEEN ? AND ?
     GROUP BY date(timestamp)
     ORDER BY amount ASC
     LIMIT 1`,
		[startDate, endDate]
	);

	if (lowestSalesDay && lowestSalesDay.amount < 1000) {
		insights.push({
			type: 'warning',
			title: 'Slow Day',
			message: `${lowestSalesDay.date} had only ₱${lowestSalesDay.amount.toFixed(2)} in sales`,
			icon: 'arrow-down',
		});
	}

	return insights;
};
