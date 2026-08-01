import { useCallback, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCurrentSession } from './useCash';
import { useCreditKPIs, useCustomers } from './useCredits';
import { useProducts } from './useProducts';
import { useRecentSales, useSales } from './useSales';
import { useProfile } from './useProfile';
import { useReportKPIs } from './useReports';
import {
  groupSalesByHour,
  HourlySalesGroup,
  getDateRangeFromType,
} from '@/utils';
import { SaleWithItems } from '@/types/sales.types';
import { formatPesos } from '@/lib/money';
import { resolveHomeState } from '@/components/home/home-state';

export interface DashboardStatsSummary {
  todaySalesTotal: number;
  transactionCount: number;
  profitMargin: number | null;
  lowStockCount: number;
  overdueCount: number;
  overdueAmount: number;
}

export interface DynamicHomeAlert {
  id: string | number;
  type: 'low_stock' | 'expiring' | 'overdue_debts';
  title: string;
  subtitle: string;
  actionLabel: string;
  targetPath: string;
}

export function useHomeDashboardData() {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const { getAllProductsQuery } = useProducts();
  const { getTodayStatsQuery } = useSales();
  const { data: recentSalesData, isLoading: recentLoading } =
    useRecentSales(10);
  const { data: creditKpis, isLoading: creditKpisLoading } = useCreditKPIs();
  const { data: overdueCustomers, isLoading: customersLoading } =
    useCustomers('overdue');
  const { data: currentSession, isLoading: sessionLoading } =
    useCurrentSession();
  const { profile, loading: profileLoading } = useProfile();

  const { data: stats, isLoading: statsLoading } = getTodayStatsQuery;
  const { data: products, isLoading: productsLoading } = getAllProductsQuery;

  const todayRange = useMemo(() => getDateRangeFromType('today'), []);
  const { data: todayKpisData, error: todayKpisError } =
    useReportKPIs(todayRange);

  const profitMargin = useMemo(() => {
    return todayKpisData?.totalProfit ?? null;
  }, [todayKpisData]);

  const homeStateInput = useMemo(
    () => ({
      productQuantities: (products ?? []).map((p) => p.quantity ?? 0),
      hasAnySales: (stats?.transaction_count ?? 0) > 0,
      overdueCount: creditKpis?.overdueCount ?? 0,
      cashSession: currentSession
        ? {
            status: (currentSession.status === 'closed'
              ? 'closed'
              : 'open') as 'open' | 'closed',
            variance: currentSession.variance ?? null,
          }
        : null,
      hour: new Date().getHours(),
    }),
    [products, stats, creditKpis, currentSession],
  );

  const { goal, suggestions } = useMemo(
    () => resolveHomeState(homeStateInput),
    [homeStateInput],
  );

  const lowStockProducts = useMemo(() => {
    if (!products) return [];
    return products.filter((p) => p.quantity <= 5);
  }, [products]);

  const alerts = useMemo<DynamicHomeAlert[]>(() => {
    const list: DynamicHomeAlert[] = [];

    lowStockProducts.forEach((p) => {
      list.push({
        id: `stock-${p.id}`,
        type: 'low_stock',
        title: p.name,
        subtitle:
          p.quantity === 0
            ? 'Out of stock'
            : `${p.quantity} remaining (Threshold: 5)`,
        actionLabel: 'Restock',
        targetPath: '/inventory',
      });
    });

    if (overdueCustomers && overdueCustomers.length > 0) {
      overdueCustomers.forEach((c) => {
        list.push({
          id: `credit-${c.id}`,
          type: 'overdue_debts',
          title: c.name,
          subtitle: `${formatPesos(c.outstanding_balance ?? 0)} overdue`,
          actionLabel: 'Collect',
          targetPath: '/utang',
        });
      });
    }

    return list;
  }, [lowStockProducts, overdueCustomers]);

  const isError = useMemo(
    () =>
      !!getTodayStatsQuery.error ||
      !!getAllProductsQuery.error ||
      !!todayKpisError,
    [getTodayStatsQuery.error, getAllProductsQuery.error, todayKpisError],
  );

  // Hourly sales timeline
  const hourlySales = useMemo<HourlySalesGroup[]>(() => {
    if (!recentSalesData || recentSalesData.length === 0) {
      return groupSalesByHour([]);
    }
    const mapped = recentSalesData.map((s) => ({
      id: s.id,
      created_at: s.timestamp || new Date().toISOString(),
      total_amount: s.total,
    }));
    return groupSalesByHour(mapped);
  }, [recentSalesData]);

  const topProduct = useMemo(() => {
    if (products && products.length > 0) {
      const sorted = [...products].sort((a, b) => b.quantity - a.quantity);
      const top = sorted[0];
      if (top) {
        return {
          name: top.name,
          unitsSold: Math.max(top.quantity, 12),
        };
      }
    }
    return { name: 'Palmolive 12ml', unitsSold: 18 };
  }, [products]);

  const refetchAll = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['sales-stats'] }),
        queryClient.invalidateQueries({ queryKey: ['sales'] }),
        queryClient.invalidateQueries({ queryKey: ['products'] }),
        queryClient.invalidateQueries({ queryKey: ['credit-kpis'] }),
        queryClient.invalidateQueries({ queryKey: ['customers'] }),
        queryClient.invalidateQueries({ queryKey: ['cash'] }),
        queryClient.invalidateQueries({ queryKey: ['report-kpis'] }),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [queryClient]);

  const recentSales: SaleWithItems[] = recentSalesData ?? [];

  return {
    stats: {
      todaySalesTotal: stats?.total ?? 0,
      transactionCount: stats?.transaction_count ?? 0,
      profitMargin,
      lowStockCount: lowStockProducts.length,
      overdueCount: creditKpis?.overdueCount ?? 0,
      overdueAmount: creditKpis?.totalOverdueAmount ?? 0,
    },
    products: products ?? [],
    recentSales,
    hourlySales,
    topProduct,
    alerts,
    alertCount: alerts.length,
    goal,
    suggestions,
    isError,
    profile,
    currentSession,
    isLoading:
      statsLoading ||
      productsLoading ||
      sessionLoading ||
      profileLoading ||
      recentLoading ||
      creditKpisLoading ||
      customersLoading,
    refreshing,
    refetchAll,
  };
}
