import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useCreditKPIs,
  useCurrentSession,
  useProducts,
  useSales,
} from '@/hooks';

export interface DashboardStatsSummary {
  todaySalesTotal: number;
  transactionCount: number;
  overdueCount: number;
  overdueAmount: number;
}

export function useHomeDashboardData() {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const { getAllProductsQuery } = useProducts();
  const { getTodayStatsQuery } = useSales();
  const { data: creditKpis } = useCreditKPIs();
  const { data: currentSession, isLoading: sessionLoading } =
    useCurrentSession();

  const { data: stats, isLoading: statsLoading } = getTodayStatsQuery;
  const { data: products, isLoading: productsLoading } = getAllProductsQuery;

  const refetchAll = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['sales-stats'] }),
        queryClient.invalidateQueries({ queryKey: ['sales'] }),
        queryClient.invalidateQueries({ queryKey: ['products'] }),
        queryClient.invalidateQueries({ queryKey: ['credit-kpis'] }),
        queryClient.invalidateQueries({ queryKey: ['cash'] }),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [queryClient]);

  return {
    stats: {
      todaySalesTotal: stats?.total ?? 0,
      transactionCount: stats?.transaction_count ?? 0,
      overdueCount: creditKpis?.overdueCount ?? 0,
      overdueAmount: creditKpis?.totalOverdueAmount ?? 0,
    },
    products: products ?? [],
    currentSession,
    isLoading: statsLoading || productsLoading || sessionLoading,
    refreshing,
    refetchAll,
  };
}
