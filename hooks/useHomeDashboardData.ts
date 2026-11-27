import { useCallback, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { FINANCIAL_QUERY_KEY, useFinancialTotals } from './useFinancial';
import { useCreditKPIs } from './useCredits';
import { useProductStockSummary } from './useProducts';
import {
  useRecentSales,
  useTodayStats,
  useYesterdaySoFarStats,
} from './useSales';
import {
  useReportKPIs,
  useSalesOverTime,
  useTopSellingProducts,
} from './useReports';
import {
  useActiveStocktakeSession,
  useRecentStocktakeSessions,
} from './useStocktake';
import { getDateRangeFromType } from '@/utils';
import { SaleWithItems } from '@/types/sales.types';
import {
  buildAttentionItems,
  buildWeekSeries,
  percentChange,
  resolveStocktakeReminder,
} from '@/components/home/home-state';

export interface DashboardStatsSummary {
  /** Cash checkouts only; utang is not a sale until paid. */
  todaySalesTotal: number;
  transactionCount: number;
  itemsSold: number;
  /** Utang given out today, kept apart from sales. */
  utangToday: number;
  collectedToday: number;
  profitToday: number | null;
  expensesToday: number;
  drawingsToday: number;
  outOfStockCount: number;
  /** Above zero and at or below the threshold, matching the alerts bell. */
  lowStockCount: number;
  overdueCount: number;
  overdueAmount: number;
}

export interface TopSeller {
  id: number;
  name: string;
  /** Pieces out today, cash and utang. */
  unitsSold: number;
}

export function useHomeDashboardData() {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const stockSummaryQuery = useProductStockSummary();
  const todayStatsQuery = useTodayStats();
  // Only 3 recent sales are rendered, so fetch only what we need.
  const { data: recentSalesData, isLoading: recentLoading } = useRecentSales(3);
  const { data: creditKpis, isLoading: creditKpisLoading } = useCreditKPIs();

  const { data: todayStats } = todayStatsQuery;
  const { data: stockSummary, isLoading: productsLoading } = stockSummaryQuery;

  const todayRange = useMemo(() => getDateRangeFromType('today'), []);
  const weekRange = useMemo(() => getDateRangeFromType('last7days'), []);
  const todayDate = useMemo(
    () => format(todayRange.startDate, 'yyyy-MM-dd'),
    [todayRange],
  );
  const { data: todayCashOut, isLoading: cashOutLoading } = useFinancialTotals(
    todayDate,
    todayDate,
  );
  const {
    data: todayKpisData,
    error: todayKpisError,
    isLoading: kpisLoading,
  } = useReportKPIs(todayRange);
  const { data: topSellingToday, isLoading: topLoading } =
    useTopSellingProducts(todayRange, 3);
  const { data: weekPoints, isLoading: weekLoading } =
    useSalesOverTime(weekRange);
  const { data: yesterdaySoFar } = useYesterdaySoFarStats();

  // Stocktake is a soft reminder, so it never holds back the first render.
  const { data: activeStocktake } = useActiveStocktakeSession();
  const { data: stocktakeSessions } = useRecentStocktakeSessions();

  const productCount = stockSummary?.total ?? 0;
  const recentSales = useMemo<SaleWithItems[]>(
    () => recentSalesData ?? [],
    [recentSalesData],
  );

  const stats = useMemo<DashboardStatsSummary>(() => {
    const outOfStock = stockSummary?.outOfStock ?? 0;
    return {
      todaySalesTotal: todayStats?.total ?? 0,
      transactionCount: todayStats?.cash_count ?? 0,
      itemsSold: todayStats?.items_sold ?? 0,
      utangToday: todayStats?.credit_total ?? 0,
      collectedToday: creditKpis?.totalCollectedToday ?? 0,
      profitToday: todayKpisData?.totalProfit ?? null,
      expensesToday: todayCashOut?.paidExpenses ?? 0,
      drawingsToday: todayCashOut?.ownerDrawings ?? 0,
      outOfStockCount: outOfStock,
      lowStockCount: Math.max(
        (stockSummary?.atOrBelowThreshold ?? 0) - outOfStock,
        0,
      ),
      overdueCount: creditKpis?.overdueCount ?? 0,
      overdueAmount: creditKpis?.totalOverdueAmount ?? 0,
    };
  }, [todayStats, creditKpis, todayKpisData, todayCashOut, stockSummary]);

  const week = useMemo(
    () => buildWeekSeries(weekPoints ?? [], stats.todaySalesTotal),
    [weekPoints, stats.todaySalesTotal],
  );

  const changeVsYesterday = useMemo(
    () => percentChange(stats.todaySalesTotal, yesterdaySoFar?.total ?? 0),
    [stats.todaySalesTotal, yesterdaySoFar],
  );

  const stocktakeReminder = useMemo(() => {
    if (!stocktakeSessions) return null;
    const last = stocktakeSessions.find((s) => s.status === 'completed');
    return resolveStocktakeReminder(!!activeStocktake, last?.createdAt ?? null);
  }, [activeStocktake, stocktakeSessions]);

  const attention = useMemo(
    () =>
      buildAttentionItems({
        outOfStockCount: stats.outOfStockCount,
        lowStockCount: stats.lowStockCount,
        overdueCount: stats.overdueCount,
        overdueAmount: stats.overdueAmount,
        // A brand new store has nothing to count yet.
        stocktake: productCount > 0 ? stocktakeReminder : null,
      }),
    [stats, stocktakeReminder, productCount],
  );

  const topSellers = useMemo<TopSeller[]>(
    () =>
      (topSellingToday ?? [])
        .filter((p) => p.unitsSold > 0)
        .map(({ id, name, unitsSold }) => ({ id, name, unitsSold })),
    [topSellingToday],
  );

  const isError = useMemo(
    () => todayStatsQuery.error || stockSummaryQuery.error || todayKpisError,
    [todayStatsQuery.error, stockSummaryQuery.error, todayKpisError],
  );

  const refetchAll = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['sales-stats'] }),
        queryClient.invalidateQueries({ queryKey: ['sales'] }),
        queryClient.invalidateQueries({ queryKey: ['products'] }),
        queryClient.invalidateQueries({ queryKey: ['credit-kpis'] }),
        queryClient.invalidateQueries({ queryKey: [FINANCIAL_QUERY_KEY] }),
        queryClient.invalidateQueries({ queryKey: ['report-kpis'] }),
        queryClient.invalidateQueries({ queryKey: ['report-top-products'] }),
        queryClient.invalidateQueries({
          queryKey: ['report-sales-over-time'],
        }),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [queryClient]);

  return {
    stats,
    productCount,
    recentSales,
    topSellers,
    week,
    changeVsYesterday,
    attention,
    isError,
    // Wait for every dashboard query so the screen mounts once with full data.
    isLoading:
      todayStatsQuery.isLoading ||
      productsLoading ||
      recentLoading ||
      creditKpisLoading ||
      cashOutLoading ||
      kpisLoading ||
      topLoading ||
      weekLoading,
    refreshing,
    refetchAll,
  };
}
