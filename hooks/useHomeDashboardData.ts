import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { FINANCIAL_QUERY_KEY, useFinancialTotals } from './useFinancial';
import { useCreditKPIs } from './useCredits';
import { usePayablesDueSummary } from './useSupplierPayables';
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
  stocktakeKeys,
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

export type WeekStatus = 'loading' | 'error' | 'ready';

const localDay = () => format(new Date(), 'yyyy-MM-dd');

// Local calendar day; rolls over at midnight and when the app returns to the foreground.
function useLocalDay(): string {
  const [day, setDay] = useState(localDay);
  useEffect(() => {
    const sync = () => setDay(localDay());
    const midnight = new Date();
    midnight.setHours(24, 0, 1, 0);
    const timer = setTimeout(sync, midnight.getTime() - Date.now());
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') sync();
    });
    return () => {
      clearTimeout(timer);
      sub.remove();
    };
  }, [day]);
  return day;
}

export function useHomeDashboardData() {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const stockSummaryQuery = useProductStockSummary();
  const todayStatsQuery = useTodayStats();
  // Only 3 recent sales are rendered, so fetch only what we need.
  const { data: recentSalesData } = useRecentSales(3);
  const {
    data: creditKpis,
    error: creditKpisError,
    isLoading: creditKpisLoading,
  } = useCreditKPIs();

  const { data: todayStats } = todayStatsQuery;
  const { data: stockSummary, isLoading: productsLoading } = stockSummaryQuery;

  // Ranges follow the local day so a screen left open overnight moves to the new day.
  const today = useLocalDay();
  const todayRange = useMemo(
    () => getDateRangeFromType('today', parseISO(today)),
    [today],
  );
  const weekRange = useMemo(
    () => getDateRangeFromType('last7days', parseISO(today)),
    [today],
  );
  const {
    data: todayCashOut,
    error: cashOutError,
    isLoading: cashOutLoading,
  } = useFinancialTotals(today, today);
  const {
    data: todayKpisData,
    error: todayKpisError,
    isLoading: kpisLoading,
  } = useReportKPIs(todayRange);
  const { data: topSellingToday } = useTopSellingProducts(todayRange, 3);
  const {
    data: weekPoints,
    isError: weekFailed,
    isLoading: weekLoading,
  } = useSalesOverTime(weekRange);
  const { data: yesterdaySoFar } = useYesterdaySoFarStats();
  // Supplier debt is a soft reminder like stocktake, so it never blocks the first render.
  const { data: supplierDue } = usePayablesDueSummary(today);

  // Stocktake is a soft reminder, so it never holds back the first render.
  const { data: activeStocktake } = useActiveStocktakeSession();
  const { data: stocktakeSessions } = useRecentStocktakeSessions();

  // Stats keyed without a date must refetch once the day changes.
  const shownDay = useRef(today);
  useEffect(() => {
    if (shownDay.current === today) return;
    shownDay.current = today;
    void queryClient.invalidateQueries({ queryKey: ['sales-stats'] });
    void queryClient.invalidateQueries({ queryKey: ['credit-kpis'] });
  }, [today, queryClient]);

  // The yesterday cutoff is the current clock time, so refresh it on return.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void queryClient.invalidateQueries({
          queryKey: ['sales-stats', 'yesterday-so-far'],
        });
      }
    });
    return () => sub.remove();
  }, [queryClient]);

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

  const weekStatus: WeekStatus = weekFailed
    ? 'error'
    : weekLoading
      ? 'loading'
      : 'ready';
  const week = useMemo(
    () =>
      buildWeekSeries(weekPoints ?? [], stats.todaySalesTotal, parseISO(today)),
    [weekPoints, stats.todaySalesTotal, today],
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
        supplierDue: supplierDue ?? null,
        // A brand new store has nothing to count yet.
        stocktake: productCount > 0 ? stocktakeReminder : null,
      }),
    [stats, supplierDue, stocktakeReminder, productCount],
  );

  const topSellers = useMemo<TopSeller[]>(
    () =>
      (topSellingToday ?? [])
        .filter((p) => p.unitsSold > 0)
        .map(({ id, name, unitsSold }) => ({ id, name, unitsSold })),
    [topSellingToday],
  );

  // Any read behind a zero or an "all clear" counts, so a failure never passes as good news.
  const isError = Boolean(
    todayStatsQuery.error ||
    stockSummaryQuery.error ||
    todayKpisError ||
    creditKpisError ||
    cashOutError,
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
        queryClient.invalidateQueries({ queryKey: stocktakeKeys.all }),
        queryClient.invalidateQueries({ queryKey: ['supplier-payables'] }),
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
    today,
    week,
    weekStatus,
    changeVsYesterday,
    attention,
    isError,
    // Gate only on the numbers above the fold; trend, top sellers and recent sales fill in after.
    isLoading:
      todayStatsQuery.isLoading ||
      productsLoading ||
      creditKpisLoading ||
      cashOutLoading ||
      kpisLoading,
    refreshing,
    refetchAll,
  };
}
