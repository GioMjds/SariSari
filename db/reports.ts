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
import { endOfDay, startOfDay } from 'date-fns';
import { db } from '../configs/sqlite';

// ==================== DATE HELPERS ====================

export const formatDateForSQL = (date: Date): string => {
  // Use ISO string so it matches timestamps inserted with `toISOString()`
  // This ensures string comparisons in SQLite are consistent.
  return date.toISOString();
};

// ==================== KPI FUNCTIONS ====================

/**
 * Reports are scoped to factual local data:
 *  - Total sales, cash/credit split, collections, low/out counts, and stock
 *    value are always derivable from the local DB.
 *  - Profit and COGS are returned with a `coverage` field that says how many
 *    sold items had a recorded cost_price. When coverage is 0 we render the
 *    metric as "unavailable" instead of zero — the plan is explicit that
 *    missing cost data must NOT show up as zero profit.
 */
export const getReportKPIs = async (
  dateRange: DateRange,
): Promise<ReportKPIs> => {
  const startDate = formatDateForSQL(startOfDay(dateRange.startDate));
  const endDate = formatDateForSQL(endOfDay(dateRange.endDate));

  const salesResult = await db.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(total), 0) as total
     FROM sales
     WHERE timestamp BETWEEN ? AND ?`,
    [startDate, endDate],
  );

  // Profit + COGS only count sold items where the product HAS a cost_price.
  // `coverage_units` is how many units in the range had a usable cost basis.
  const profitResult = await db.getFirstAsync<{
    profit: number;
    coverage_units: number;
    total_units: number;
  }>(
    `SELECT
       COALESCE(SUM(si.quantity * (si.price - p.cost_price)), 0) as profit,
       COALESCE(SUM(CASE WHEN p.cost_price IS NOT NULL THEN si.quantity ELSE 0 END), 0) as coverage_units,
       COALESCE(SUM(si.quantity), 0) as total_units
     FROM sale_items si
     JOIN sales s ON si.sale_id = s.id
     LEFT JOIN products p ON si.product_id = p.id
     WHERE s.timestamp BETWEEN ? AND ?`,
    [startDate, endDate],
  );

  const creditsIssuedResult = await db.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(amount), 0) as total
     FROM credit_transactions
     WHERE date BETWEEN ? AND ?`,
    [startDate, endDate],
  );

  const creditsCollectedResult = await db.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(amount), 0) as total
     FROM payments
     WHERE date BETWEEN ? AND ?`,
    [startDate, endDate],
  );

  const cogsResult = await db.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(si.quantity * p.cost_price), 0) as total
     FROM sale_items si
     JOIN sales s ON si.sale_id = s.id
     LEFT JOIN products p ON si.product_id = p.id
     WHERE s.timestamp BETWEEN ? AND ? AND p.cost_price IS NOT NULL`,
    [startDate, endDate],
  );

  const coverageUnits = profitResult?.coverage_units ?? 0;
  const totalUnits = profitResult?.total_units ?? 0;
  const profitCoverage =
    totalUnits > 0 ? coverageUnits / totalUnits : null;

  return {
    totalSales: salesResult?.total || 0,
    // Profit is `null` when no sold items had cost data so the UI can show
    // "unavailable" rather than 0.0.
    totalProfit: profitCoverage === 0 ? null : profitResult?.profit ?? 0,
    totalCreditsIssued: creditsIssuedResult?.total || 0,
    totalCreditsCollected: creditsCollectedResult?.total || 0,
    totalExpenses: 0, // Future scope — not in this stabilization pass.
    inventoryCostOut: cogsResult?.total || 0,
    profitCoverage,
  };
};

// ==================== SALES REPORTS ====================

export const getSalesOverTime = async (
  dateRange: DateRange,
): Promise<SalesDataPoint[]> => {
  const startDate = formatDateForSQL(startOfDay(dateRange.startDate));
  const endDate = formatDateForSQL(endOfDay(dateRange.endDate));

  // Amount is always factual. Profit on the per-day trend is computed only
  // from items with a cost_price, so empty cost coverage simply leaves the
  // profit column at 0 — the dashboard renders those days as "no cost data".
  const results = await db.getAllAsync<{
    date: string;
    amount: number;
    profit: number;
  }>(
    `SELECT
       date(timestamp) as date,
       COALESCE(SUM(total), 0) as amount,
       COALESCE(SUM(
         (SELECT SUM(si.quantity * (si.price - p.cost_price))
          FROM sale_items si
          LEFT JOIN products p ON si.product_id = p.id
          WHERE si.sale_id = s.id AND p.cost_price IS NOT NULL)
       ), 0) as profit
     FROM sales s
     WHERE timestamp BETWEEN ? AND ?
     GROUP BY date(timestamp)
     ORDER BY date ASC`,
    [startDate, endDate],
  );

  return results;
};

export const getTopSellingProducts = async (
  dateRange: DateRange,
  limit: number = 10,
): Promise<TopSellingProduct[]> => {
  const startDate = formatDateForSQL(startOfDay(dateRange.startDate));
  const endDate = formatDateForSQL(endOfDay(dateRange.endDate));

  // We always want factual sales volume (units sold, revenue). Profit is
  // only meaningful when cost_price is recorded, so we surface it as 0 with
  // the understanding the UI labels it "estimated" or hides it.
  const results = await db.getAllAsync<TopSellingProduct>(
    `SELECT
       p.id,
       p.name,
       COALESCE(SUM(si.quantity), 0) as unitsSold,
       COALESCE(SUM(si.quantity * si.price), 0) as revenue,
       COALESCE(SUM(si.quantity * (si.price - p.cost_price)), 0) as profit
     FROM products p
     JOIN sale_items si ON p.id = si.product_id
     JOIN sales s ON si.sale_id = s.id
     WHERE s.timestamp BETWEEN ? AND ?
     GROUP BY p.id, p.name
     ORDER BY unitsSold DESC
     LIMIT ?`,
    [startDate, endDate, limit],
  );

  return results;
};

export const getSalesBreakdown = async (
  dateRange: DateRange,
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
    [startDate, endDate],
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
  dateRange: DateRange,
): Promise<InventoryMovement> => {
  const startDate = formatDateForSQL(startOfDay(dateRange.startDate));
  const endDate = formatDateForSQL(endOfDay(dateRange.endDate));

  const itemsSoldResult = await db.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(si.quantity), 0) as total
     FROM sale_items si
     JOIN sales s ON si.sale_id = s.id
     WHERE s.timestamp BETWEEN ? AND ?`,
    [startDate, endDate],
  );

  // Factual low/out counts — these are unconditional and don't need cost data.
  const lowStockResult = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM products WHERE quantity > 0 AND quantity <= 10`,
  );

  const outOfStockResult = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM products WHERE quantity = 0`,
  );

  return {
    itemsSold: itemsSoldResult?.total || 0,
    lowStockCount: lowStockResult?.count || 0,
    outOfStockCount: outOfStockResult?.count || 0,
  };
};

export const getLowStockItems = async (
  threshold: number = 10,
): Promise<StockItem[]> => {
  const results = await db.getAllAsync<any>(
    `SELECT
       id,
       name,
       quantity,
       price as sellingPrice,
       cost_price as costPrice
     FROM products
     WHERE quantity > 0 AND quantity <= ?
     ORDER BY quantity ASC`,
    [threshold],
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
       cost_price as costPrice
     FROM products
     WHERE quantity = 0
     ORDER BY name ASC`,
  );

  return results;
};

export const getInventoryValue = async (): Promise<InventoryValue> => {
  // Factual: potential sales value is always computable. Current stock cost
  // is only available where cost_price is set; we report a `coverage` so
  // the UI can warn the owner that the cost-side number is partial.
  const result = await db.getFirstAsync<{
    currentStockValue: number;
    potentialSalesValue: number;
    costCoverageCount: number;
    totalStockCount: number;
  }>(
    `SELECT
       COALESCE(SUM(CASE WHEN cost_price IS NOT NULL THEN quantity * cost_price ELSE 0 END), 0) as currentStockValue,
       COALESCE(SUM(quantity * price), 0) as potentialSalesValue,
       COALESCE(SUM(CASE WHEN cost_price IS NOT NULL THEN 1 ELSE 0 END), 0) as costCoverageCount,
       COUNT(*) as totalStockCount
     FROM products p
     WHERE quantity > 0`,
  );

  const costCoverageCount = result?.costCoverageCount ?? 0;
  const totalStockCount = result?.totalStockCount ?? 0;
  return {
    currentStockValue: result?.currentStockValue || 0,
    potentialSalesValue: result?.potentialSalesValue || 0,
    costCoverage:
      totalStockCount > 0 ? costCoverageCount / totalStockCount : null,
  };
};

export const getFastMovingProducts = async (
  dateRange: DateRange,
  limit: number = 10,
): Promise<StockItem[]> => {
  const startDate = formatDateForSQL(startOfDay(dateRange.startDate));
  const endDate = formatDateForSQL(endOfDay(dateRange.endDate));

  const results = await db.getAllAsync<any>(
    `SELECT
       p.id,
       p.name,
       p.quantity,
       p.price as sellingPrice,
       p.cost_price as costPrice,
       'fast' as velocity
     FROM products p
     JOIN sale_items si ON p.id = si.product_id
     JOIN sales s ON si.sale_id = s.id
     WHERE s.timestamp BETWEEN ? AND ?
     GROUP BY p.id
     ORDER BY SUM(si.quantity) DESC
     LIMIT ?`,
    [startDate, endDate, limit],
  );

  return results;
};

export const getSlowMovingProducts = async (
  dateRange: DateRange,
  limit: number = 10,
): Promise<StockItem[]> => {
  const startDate = formatDateForSQL(startOfDay(dateRange.startDate));
  const endDate = formatDateForSQL(endOfDay(dateRange.endDate));

  const results = await db.getAllAsync<any>(
    `SELECT
       p.id,
       p.name,
       p.quantity,
       p.price as sellingPrice,
       p.cost_price as costPrice,
       'slow' as velocity
     FROM products p
     LEFT JOIN sale_items si ON p.id = si.product_id
     LEFT JOIN sales s ON si.sale_id = s.id AND s.timestamp BETWEEN ? AND ?
     WHERE p.quantity > 0
     GROUP BY p.id
     ORDER BY COALESCE(SUM(si.quantity), 0) ASC
     LIMIT ?`,
    [startDate, endDate, limit],
  );

  return results;
};

// ==================== CREDITS REPORTS ====================

export const getCreditsOverview = async (
  dateRange: DateRange,
): Promise<CreditsOverview> => {
  const startDate = formatDateForSQL(startOfDay(dateRange.startDate));
  const endDate = formatDateForSQL(endOfDay(dateRange.endDate));

  const issued = await db.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(amount), 0) as total
     FROM credit_transactions
     WHERE date BETWEEN ? AND ?`,
    [startDate, endDate],
  );

  const collected = await db.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(amount), 0) as total
     FROM payments
     WHERE date BETWEEN ? AND ?`,
    [startDate, endDate],
  );

  // Outstanding is across all unpaid credit_transactions, regardless of date
  // range — that's the customer's actual balance, which must always be shown.
  const outstanding = await db.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(amount - amount_paid), 0) as total
     FROM credit_transactions
     WHERE status != 'paid'`,
  );

  const activeAccounts = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(DISTINCT customer_id) as count
     FROM credit_transactions
     WHERE status != 'paid'`,
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
     GROUP BY CAST(julianday('now') - julianday(date) AS INTEGER)`,
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

/**
 * Profitability data is conditional. We return `null` for `totalProfit` and
 * `marginPercent` when no sold units in the range had cost_price — the UI
 * must render that as "add cost prices to see profit" rather than 0.
 */
export const getProfitabilityData = async (
  dateRange: DateRange,
): Promise<ProfitabilityData> => {
  const startDate = formatDateForSQL(startOfDay(dateRange.startDate));
  const endDate = formatDateForSQL(endOfDay(dateRange.endDate));

  const profitResult = await db.getFirstAsync<{
    totalProfit: number;
    totalRevenue: number;
    coverageUnits: number;
    totalUnits: number;
  }>(
    `SELECT
       COALESCE(SUM(si.quantity * (si.price - p.cost_price)), 0) as totalProfit,
       COALESCE(SUM(si.quantity * si.price), 0) as totalRevenue,
       COALESCE(SUM(CASE WHEN p.cost_price IS NOT NULL THEN si.quantity ELSE 0 END), 0) as coverageUnits,
       COALESCE(SUM(si.quantity), 0) as totalUnits
     FROM sale_items si
     JOIN sales s ON si.sale_id = s.id
     LEFT JOIN products p ON si.product_id = p.id
     WHERE s.timestamp BETWEEN ? AND ?`,
    [startDate, endDate],
  );

  const coverageUnits = profitResult?.coverageUnits ?? 0;
  const totalUnits = profitResult?.totalUnits ?? 0;
  const totalRevenue = profitResult?.totalRevenue ?? 0;
  const totalProfit = profitResult?.totalProfit ?? 0;

  if (coverageUnits === 0) {
    return {
      totalProfit: null,
      marginPercent: null,
      coverage: null,
    };
  }

  const marginPercent =
    totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  return {
    totalProfit,
    marginPercent,
    coverage: totalUnits > 0 ? coverageUnits / totalUnits : null,
  };
};

// ==================== PRODUCT PROFITABILITY ====================

export interface ProductProfitability {
  id: number;
  name: string;
  totalRevenue: number;
  totalProfit: number;
  unitsSold: number;
  profitPerUnit: number;
  marginPercent: number;
}

export const getProductProfitability = async (
  dateRange: DateRange,
  limit: number = 10,
): Promise<ProductProfitability[]> => {
  const startDate = formatDateForSQL(startOfDay(dateRange.startDate));
  const endDate = formatDateForSQL(endOfDay(dateRange.endDate));

  // Only products whose cost_price is recorded make it into the leaderboard.
  // That's the only honest way to rank "most profitable" — partial cost data
  // would mislead the owner.
  const results = await db.getAllAsync<ProductProfitability>(
    `SELECT
       p.id,
       p.name,
       COALESCE(SUM(si.quantity * si.price), 0) as totalRevenue,
       COALESCE(SUM(si.quantity * (si.price - p.cost_price)), 0) as totalProfit,
       COALESCE(SUM(si.quantity), 0) as unitsSold,
       COALESCE(AVG(si.price - p.cost_price), 0) as profitPerUnit,
       CASE
         WHEN SUM(si.quantity * si.price) > 0
         THEN (SUM(si.quantity * (si.price - p.cost_price)) / SUM(si.quantity * si.price)) * 100
         ELSE 0
       END as marginPercent
     FROM products p
     JOIN sale_items si ON p.id = si.product_id
     JOIN sales s ON si.sale_id = s.id
     WHERE s.timestamp BETWEEN ? AND ? AND p.cost_price IS NOT NULL
     GROUP BY p.id, p.name
     ORDER BY totalProfit DESC
     LIMIT ?`,
    [startDate, endDate, limit],
  );

  return results;
};

// ==================== INSIGHTS ====================

export const getReportInsights = async (
  dateRange: DateRange,
): Promise<ReportInsight[]> => {
  const insights: ReportInsight[] = [];
  const startDate = formatDateForSQL(startOfDay(dateRange.startDate));
  const endDate = formatDateForSQL(endOfDay(dateRange.endDate));

  // Best selling item (factual, no cost data required)
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
    [startDate, endDate],
  );

  if (bestSeller) {
    insights.push({
      type: 'success',
      title: 'Top Performer',
      message: `${bestSeller.name} sold ${bestSeller.quantity} units`,
      icon: 'trophy',
    });
  }

  // Low stock warning (factual)
  const lowStockCount = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM products WHERE quantity > 0 AND quantity <= 5`,
  );

  if (lowStockCount && lowStockCount.count > 0) {
    insights.push({
      type: 'warning',
      title: 'Stock Alert',
      message: `${lowStockCount.count} item${lowStockCount.count > 1 ? 's' : ''} need urgent restock`,
      icon: 'exclamation-triangle',
    });
  }

  // Highest credit customer (factual — outstanding balance only)
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
     LIMIT 1`,
  );

  if (highestCredit && highestCredit.amount > 0) {
    insights.push({
      type: 'info',
      title: 'Top Credit Account',
      message: `${highestCredit.name} owes ₱${highestCredit.amount.toFixed(2)}`,
      icon: 'user',
    });
  }

  // Day with lowest sales (factual)
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
    [startDate, endDate],
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