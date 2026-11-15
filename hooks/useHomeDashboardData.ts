import { useCallback, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useFinancialTotals } from './useFinancial';
import { useCreditKPIs } from './useCredits';
import { useProducts } from './useProducts';
import { useRecentSales, useTodayStats } from './useSales';
import { useReportKPIs, useTopSellingProducts } from './useReports';
import { getDateRangeFromType } from '@/utils';
import { SaleWithItems } from '@/types/sales.types';
import { resolveHomeState } from '@/components/home/home-state';

export interface DashboardStatsSummary {
  todaySalesTotal: number;
  transactionCount: number;
  profitMargin: number | null;
  lowStockCount: number;
  overdueCount: number;
  overdueAmount: number;
  expensesToday: number;
  drawingsToday: number;
}

export function useHomeDashboardData() {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const { getAllProductsQuery } = useProducts();
  const todayStatsQuery = useTodayStats();
  // Only 3 recent sales are rendered — fetch only what we need.
  const { data: recentSalesData, isLoading: recentLoading } = useRecentSales(3);
  const { data: creditKpis, isLoading: creditKpisLoading } = useCreditKPIs();

  const { data: todayStats } = todayStatsQuery;
  const { data: productsData, isLoading: productsLoading } =
    getAllProductsQuery;

  const todayRange = useMemo(() => getDateRangeFromType('today'), []);
  const todayDate = useMemo(
    () => format(todayRange.startDate, 'yyyy-MM-dd'),
    [todayRange],
  );
  const { data: todayCashOut } = useFinancialTotals(todayDate, todayDate);
  const { data: todayKpisData, error: todayKpisError } =
    useReportKPIs(todayRange);
  const { data: topSellingToday } = useTopSellingProducts(todayRange, 1);

  const profitMargin = useMemo(
    () => todayKpisData?.totalProfit ?? null,
    [todayKpisData],
  );

  // Stable identity regardless of undefined → [] flip.
  const products = useMemo(() => productsData ?? [], [productsData]);
  const recentSales = useMemo<SaleWithItems[]>(
    () => recentSalesData ?? [],
    [recentSalesData],
  );

  const lowStockProducts = useMemo(() => {
    if (products.length === 0) return [];
    return products.filter((p) => (p.quantity ?? 0) <= 5);
  }, [products]);

  const homeStateInput = useMemo(
    () => ({
      productQuantities: products.map((p) => p.quantity ?? 0),
      hasAnySales: (todayStats?.transaction_count ?? 0) > 0,
      overdueCount: creditKpis?.overdueCount ?? 0,
      hour: new Date().getHours(),
    }),
    [products, todayStats, creditKpis],
  );

  const { goal, suggestions } = useMemo(
    () => resolveHomeState(homeStateInput),
    [homeStateInput],
  );

  const topProduct = useMemo(() => {
    const top = topSellingToday?.[0];
    return top && top.unitsSold > 0
      ? { name: top.name, unitsSold: top.unitsSold }
      : null;
  }, [topSellingToday]);

  const isError = useMemo(
    () => todayStatsQuery.error || getAllProductsQuery.error || todayKpisError,
    [todayStatsQuery.error, getAllProductsQuery.error, todayKpisError],
  );

  const refetchAll = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['sales-stats'] }),
        queryClient.invalidateQueries({ queryKey: ['sales'] }),
        queryClient.invalidateQueries({ queryKey: ['products'] }),
        queryClient.invalidateQueries({ queryKey: ['credit-kpis'] }),
        queryClient.invalidateQueries({ queryKey: ['cash'] }),
        queryClient.invalidateQueries({ queryKey: ['report-kpis'] }),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [queryClient]);

  // Stable identity — critical for React.memo downstream.
  const stats = useMemo<DashboardStatsSummary>(
    () => ({
      todaySalesTotal: todayStats?.total ?? 0,
      transactionCount: todayStats?.cash_count ?? 0,
      profitMargin,
      lowStockCount: lowStockProducts.length,
      overdueCount: creditKpis?.overdueCount ?? 0,
      overdueAmount: creditKpis?.totalOverdueAmount ?? 0,
      expensesToday: todayCashOut?.paidExpenses ?? 0,
      drawingsToday: todayCashOut?.ownerDrawings ?? 0,
    }),
    [
      todayStats,
      profitMargin,
      lowStockProducts.length,
      creditKpis,
      todayCashOut,
    ],
  );

  return {
    stats,
    products,
    recentSales,
    topProduct,
    goal,
    suggestions,
    isError,
    isLoading:
      todayStatsQuery.isLoading ||
      productsLoading ||
      recentLoading ||
      creditKpisLoading,
    refreshing,
    refetchAll,
  };
}
