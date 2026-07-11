import {
  AgingBucket,
  CreditsOverview,
  DateRange,
  InventoryMovement,
  InventoryValue,
  ReportInsight,
  ReportKPIs,
  SalesBreakdown,
  SalesDataPoint,
  StockItem,
  TopSellingProduct,
} from '@/types/reports.types';
import { endOfDay, startOfDay } from 'date-fns';
import { db } from '../configs/sqlite';
import { formatCurrency } from '@/utils';

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

  // Run the aggregates concurrently. We merged profit, COGS, and coverage metrics
  // into a single optimized query joining sale_items, sales, and products.
  const [
    salesResult,
    salesMetricsResult,
    creditsIssuedResult,
    creditsCollectedResult,
  ] = await Promise.all([
    db.getFirstAsync<{ total: number }>(
      `SELECT COALESCE(SUM(total), 0) as total
       FROM sales
       WHERE timestamp BETWEEN ? AND ?`,
      [startDate, endDate],
    ),
    db.getFirstAsync<{
      profit: number;
      cogs: number;
      revenue: number;
      coverage_units: number;
      total_units: number;
    }>(
      `SELECT
         COALESCE(SUM(COALESCE(si.sold_unit_qty, si.quantity) * (si.price - COALESCE(si.cost_price, p.cost_price))), 0) as profit,
         COALESCE(SUM(COALESCE(si.sold_unit_qty, si.quantity) * COALESCE(si.cost_price, p.cost_price)), 0) as cogs,
         COALESCE(SUM(COALESCE(si.sold_unit_qty, si.quantity) * si.price), 0) as revenue,
         COALESCE(SUM(CASE WHEN COALESCE(si.cost_price, p.cost_price) IS NOT NULL THEN COALESCE(si.sold_unit_qty, si.quantity) ELSE 0 END), 0) as coverage_units,
         COALESCE(SUM(COALESCE(si.sold_unit_qty, si.quantity)), 0) as total_units
       FROM sale_items si
       JOIN sales s ON si.sale_id = s.id
       LEFT JOIN products p ON si.product_id = p.id
       WHERE s.timestamp BETWEEN ? AND ?`,
      [startDate, endDate],
    ),
    db.getFirstAsync<{ total: number }>(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM credit_transactions
       WHERE date BETWEEN ? AND ?`,
      [startDate, endDate],
    ),
    db.getFirstAsync<{ total: number }>(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM payments
       WHERE date BETWEEN ? AND ?`,
      [startDate, endDate],
    ),
  ]);

  const coverageUnits = salesMetricsResult?.coverage_units ?? 0;
  const totalUnits = salesMetricsResult?.total_units ?? 0;
  const profitCoverage = totalUnits > 0 ? coverageUnits / totalUnits : null;
  const totalProfit =
    profitCoverage === 0 ? null : (salesMetricsResult?.profit ?? 0);
  const totalRevenue = salesMetricsResult?.revenue ?? 0;
  const marginPercent =
    profitCoverage === 0 || totalRevenue <= 0
      ? null
      : ((totalProfit ?? 0) / totalRevenue) * 100;

  return {
    totalSales: salesResult?.total || 0,
    // Profit is `null` when no sold items had cost data so the UI can show
    // "unavailable" rather than 0.0.
    totalProfit,
    totalCreditsIssued: creditsIssuedResult?.total || 0,
    totalCreditsCollected: creditsCollectedResult?.total || 0,
    totalExpenses: 0, // Future scope — not in this stabilization pass.
    inventoryCostOut: salesMetricsResult?.cogs || 0,
    profitCoverage,
    marginPercent,
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
    `WITH filtered_sales AS (
       SELECT id, total, timestamp
       FROM sales
       WHERE timestamp BETWEEN ? AND ?
     ),
     sale_profits AS (
       SELECT
         si.sale_id,
         SUM(COALESCE(si.sold_unit_qty, si.quantity) * (si.price - COALESCE(si.cost_price, p.cost_price))) as profit
       FROM sale_items si
       JOIN products p ON si.product_id = p.id
       WHERE COALESCE(si.cost_price, p.cost_price) IS NOT NULL
         AND si.sale_id IN (SELECT id FROM filtered_sales)
       GROUP BY si.sale_id
     )
     SELECT
       date(fs.timestamp) as date,
       COALESCE(SUM(fs.total), 0) as amount,
       COALESCE(SUM(sp.profit), 0) as profit
     FROM filtered_sales fs
     LEFT JOIN sale_profits sp ON fs.id = sp.sale_id
     GROUP BY date(fs.timestamp)
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

  // Merged top-selling and fast-moving products into one query.
  // It returns units sold, revenue, profit, as well as stock details (quantity, price, cost).
  const results = await db.getAllAsync<TopSellingProduct>(
    `WITH sales_in_range AS (
       SELECT id FROM sales WHERE timestamp BETWEEN ? AND ?
     ),
     product_sales AS (
       SELECT
         si.product_id,
         SUM(COALESCE(si.sold_unit_qty, si.quantity)) as unitsSold,
         SUM(COALESCE(si.sold_unit_qty, si.quantity) * si.price) as revenue,
         SUM(COALESCE(si.sold_unit_qty, si.quantity) * (si.price - COALESCE(si.cost_price, p.cost_price))) as profit
       FROM sale_items si
       LEFT JOIN products p ON si.product_id = p.id
       WHERE si.sale_id IN (SELECT id FROM sales_in_range)
       GROUP BY si.product_id
     )
     SELECT
       p.id,
       p.name,
       p.quantity,
       p.price as sellingPrice,
       p.cost_price as costPrice,
       'fast' as velocity,
       COALESCE(ps.unitsSold, 0) as unitsSold,
       COALESCE(ps.revenue, 0) as revenue,
       COALESCE(ps.profit, 0) as profit
     FROM products p
     JOIN product_sales ps ON p.id = ps.product_id
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

  // Sold-units total and the low/out-of-stock counts are unrelated reads, so
  // fetch all three together.
  const [itemsSoldResult, lowStockResult, outOfStockResult] = await Promise.all(
    [
      db.getFirstAsync<{ total: number }>(
        `SELECT COALESCE(SUM(COALESCE(si.sold_unit_qty, si.quantity)), 0) as total
         FROM sale_items si
         JOIN sales s ON si.sale_id = s.id
         WHERE s.timestamp BETWEEN ? AND ?`,
        [startDate, endDate],
      ),
      // Factual low/out counts, these are unconditional and don't need cost data.
      db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM products WHERE quantity > 0 AND quantity <= 10`,
      ),
      db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM products WHERE quantity = 0`,
      ),
    ],
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

export const getSlowMovingProducts = async (
  dateRange: DateRange,
  limit: number = 10,
): Promise<StockItem[]> => {
  const startDate = formatDateForSQL(startOfDay(dateRange.startDate));
  const endDate = formatDateForSQL(endOfDay(dateRange.endDate));

  const results = await db.getAllAsync<any>(
    `WITH sales_in_range AS (
       SELECT id FROM sales WHERE timestamp BETWEEN ? AND ?
     ),
     product_sales AS (
       SELECT product_id, SUM(COALESCE(sold_unit_qty, quantity)) as quantity_sold
       FROM sale_items
       WHERE sale_id IN (SELECT id FROM sales_in_range)
       GROUP BY product_id
     )
     SELECT
       p.id,
       p.name,
       p.quantity,
       p.price as sellingPrice,
       p.cost_price as costPrice,
       'slow' as velocity
     FROM products p
     LEFT JOIN product_sales ps ON p.id = ps.product_id
     WHERE p.quantity > 0
     ORDER BY COALESCE(ps.quantity_sold, 0) ASC
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

  // Issued/collected (date-scoped) and outstanding/active-accounts
  // (all-time) are four independent reads, so fetch them concurrently.
  const [issued, collected, outstanding, activeAccounts] = await Promise.all([
    db.getFirstAsync<{ total: number }>(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM credit_transactions
       WHERE date BETWEEN ? AND ?`,
      [startDate, endDate],
    ),
    db.getFirstAsync<{ total: number }>(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM payments
       WHERE date BETWEEN ? AND ?`,
      [startDate, endDate],
    ),
    // Outstanding is across all unpaid credit_transactions, regardless of
    // date range, that's the customer's actual balance, which must always
    // be shown.
    db.getFirstAsync<{ total: number }>(
      `SELECT COALESCE(SUM(amount - amount_paid), 0) as total
       FROM credit_transactions
       WHERE status != 'paid'`,
    ),
    db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(DISTINCT customer_id) as count
       FROM credit_transactions
       WHERE status != 'paid'`,
    ),
  ]);

  return {
    issued: issued?.total || 0,
    collected: collected?.total || 0,
    outstanding: outstanding?.total || 0,
    activeAccounts: activeAccounts?.count || 0,
  };
};

export const getAgingBuckets = async (): Promise<AgingBucket[]> => {
  // Each query is a sargable range scan on the composite (status, date) index
  // added in migration v6.  We avoid CAST(julianday(...)...) which forces a
  // full-table scan because it is a non-deterministic expression on the column.
  const BASE = `
    SELECT
      COALESCE(SUM(amount - amount_paid), 0) AS amount,
      COUNT(*) AS count
    FROM credit_transactions
    WHERE status != 'paid'
  `;

  const [b0, b1, b2, b3] = await Promise.all([
    // 0–7 days old: date >= today-7
    db.getFirstAsync<{ amount: number; count: number }>(
      `${BASE} AND date >= date('now', '-7 days')`,
    ),
    // 8–15 days old: date >= today-15 AND date < today-7
    db.getFirstAsync<{ amount: number; count: number }>(
      `${BASE} AND date >= date('now', '-15 days') AND date < date('now', '-7 days')`,
    ),
    // 16–30 days old: date >= today-30 AND date < today-15
    db.getFirstAsync<{ amount: number; count: number }>(
      `${BASE} AND date >= date('now', '-30 days') AND date < date('now', '-15 days')`,
    ),
    // Over 30 days old: date < today-30
    db.getFirstAsync<{ amount: number; count: number }>(
      `${BASE} AND date < date('now', '-30 days')`,
    ),
  ]);

  return [
    { range: '0-7 days', amount: b0?.amount ?? 0, count: b0?.count ?? 0 },
    { range: '8-15 days', amount: b1?.amount ?? 0, count: b1?.count ?? 0 },
    { range: '16-30 days', amount: b2?.amount ?? 0, count: b2?.count ?? 0 },
    { range: 'Over 30 days', amount: b3?.amount ?? 0, count: b3?.count ?? 0 },
  ];
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
    `WITH sales_in_range AS (
       SELECT id FROM sales WHERE timestamp BETWEEN ? AND ?
     ),
     product_sales AS (
       SELECT
         si.product_id,
         SUM(COALESCE(si.sold_unit_qty, si.quantity) * si.price) as totalRevenue,
         SUM(COALESCE(si.sold_unit_qty, si.quantity) * (si.price - COALESCE(si.cost_price, p.cost_price))) as totalProfit,
         SUM(COALESCE(si.sold_unit_qty, si.quantity)) as unitsSold,
         AVG(si.price - COALESCE(si.cost_price, p.cost_price)) as profitPerUnit
       FROM sale_items si
       JOIN products p ON si.product_id = p.id
       WHERE COALESCE(si.cost_price, p.cost_price) IS NOT NULL
         AND si.sale_id IN (SELECT id FROM sales_in_range)
       GROUP BY si.product_id
     )
     SELECT
       p.id,
       p.name,
       COALESCE(ps.totalRevenue, 0) as totalRevenue,
       COALESCE(ps.totalProfit, 0) as totalProfit,
       COALESCE(ps.unitsSold, 0) as unitsSold,
       COALESCE(ps.profitPerUnit, 0) as profitPerUnit,
       CASE
         WHEN COALESCE(ps.totalRevenue, 0) > 0
         THEN (COALESCE(ps.totalProfit, 0) / COALESCE(ps.totalRevenue, 0)) * 100
         ELSE 0
       END as marginPercent
     FROM products p
     JOIN product_sales ps ON p.id = ps.product_id
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

  // The four insight queries don't depend on each other or on one another's
  // results, so run them concurrently instead of one after another.
  const [bestSeller, lowStockCount, highestCredit, lowestSalesDay] =
    await Promise.all([
      // Best selling item (factual, no cost data required)
      db.getFirstAsync<{
        name: string;
        quantity: number;
      }>(
        `SELECT p.name, SUM(COALESCE(si.sold_unit_qty, si.quantity)) as quantity
         FROM products p
         JOIN sale_items si ON p.id = si.product_id
         JOIN sales s ON si.sale_id = s.id
         WHERE s.timestamp BETWEEN ? AND ?
         GROUP BY p.id
         ORDER BY quantity DESC
         LIMIT 1`,
        [startDate, endDate],
      ),
      // Low stock warning (factual)
      db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM products WHERE quantity > 0 AND quantity <= 5`,
      ),
      // Highest credit customer (factual, outstanding balance only)
      db.getFirstAsync<{
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
      ),
      // Day with lowest sales (factual)
      db.getFirstAsync<{
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
      ),
    ]);

  if (bestSeller) {
    insights.push({
      type: 'success',
      title: 'Top Performer',
      message: `${bestSeller.name} sold ${bestSeller.quantity} units`,
      icon: 'trophy',
    });
  }

  if (lowStockCount && lowStockCount.count > 0) {
    insights.push({
      type: 'warning',
      title: 'Stock Alert',
      message: `${lowStockCount.count} item${lowStockCount.count > 1 ? 's' : ''} need urgent restock`,
      icon: 'exclamation-triangle',
    });
  }

  if (highestCredit && highestCredit.amount > 0) {
    insights.push({
      type: 'info',
      title: 'Top Credit Account',
      message: `${highestCredit.name} owes ${formatCurrency(highestCredit.amount)}`,
      icon: 'user',
    });
  }

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
