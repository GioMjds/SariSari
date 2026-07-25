import { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Href, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui';
import { StyledText } from '@/components/elements';
import {
  DashboardContextHeader,
  DashboardEmptyState,
  DashboardErrorState,
  DashboardGoalCard,
  DashboardQuickActions,
  DashboardRecentSales,
  DashboardStockAlert,
  HomeDestination,
  HomeStateInput,
  resolveHomeState,
} from '@/components/dashboard';
import { LOW_STOCK_THRESHOLD } from '@/constants/stocks';
import {
  useCreditKPIs,
  useCurrentSession,
  useHasSales,
  useProducts,
  useRecentSales,
  useSales,
} from '@/hooks';

const destinationRoutes: Record<HomeDestination, Href> = {
  addProduct: '/(edit-forms)/add-product',
  inventory: '/inventory',
  utang: '/utang',
  cashSession: '/(edit-forms)/cash-session',
  newSale: '/(edit-forms)/add-sales',
  reports: '/reports',
};

export default function Dashboard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // ─── Data queries ─────────────────────────────────────────────
  const { getAllProductsQuery } = useProducts();
  const hasSalesQuery = useHasSales();
  const { data: kpis } = useCreditKPIs();
  const { data: currentSession, isLoading: sessionLoading } =
    useCurrentSession();
  const { getTodayStatsQuery } = useSales();
  const recentSalesQuery = useRecentSales(3);

  const {
    data: products,
    isLoading: productsLoading,
    isError: productsError,
  } = getAllProductsQuery;
  const {
    data: hasAnySales = false,
    isLoading: hasSalesLoading,
  } = hasSalesQuery;
  const {
    data: stats,
    isLoading: statsLoading,
  } = getTodayStatsQuery;
  const {
    data: recentSalesList = [],
    isLoading: recentSalesLoading,
  } = recentSalesQuery;

  // Granular loading & error evaluation: only block on critical empty product state error
  const isCriticalError = productsError && !products;

  // ─── Derived Store Assistant State ─────────────────────────────
  const homeStateInput: HomeStateInput = useMemo(
    () => ({
      productQuantities: (products ?? []).map((p) => p.quantity),
      hasAnySales: !!hasAnySales,
      overdueCount: kpis?.overdueCount ?? 0,
      cashSession: currentSession
        ? { status: currentSession.status, variance: currentSession.variance ?? null }
        : null,
      hour: new Date().getHours(),
    }),
    [products, hasAnySales, kpis, currentSession],
  );

  const homeState = useMemo(
    () => resolveHomeState(homeStateInput),
    [homeStateInput],
  );

  const lowStockCount = useMemo(() => {
    if (!products) return 0;
    return products.filter((p) => p.quantity > 0 && p.quantity < LOW_STOCK_THRESHOLD).length;
  }, [products]);

  const hasStockRisk = lowStockCount > 0;

  // ─── Refetch logic ─────────────────────────────────────────────
  const refetchAll = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['sales-stats'] }),
      queryClient.invalidateQueries({ queryKey: ['sales'] }),
      queryClient.invalidateQueries({ queryKey: ['products'] }),
      queryClient.invalidateQueries({ queryKey: ['credit-kpis'] }),
      queryClient.invalidateQueries({ queryKey: ['cash'] }),
    ]);
  }, [queryClient]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetchAll();
    } finally {
      setRefreshing(false);
    }
  }, [refetchAll]);

  // ─── Action Navigation Callbacks ──────────────────────────────
  const handleOpenSettings = useCallback(() => {
    router.push('/settings');
  }, [router]);

  const handleOpenCashSession = useCallback(() => {
    router.push('/(edit-forms)/cash-session');
  }, [router]);

  const handleDestinationPress = useCallback(
    (destination: HomeDestination) => {
      const route = destinationRoutes[destination];
      if (route) router.push(route);
    },
    [router],
  );

  const handleGoalPress = useCallback(() => {
    handleDestinationPress(homeState.goal.destination);
  }, [handleDestinationPress, homeState.goal.destination]);

  const handleNewSale = useCallback(() => {
    router.push(destinationRoutes.newSale);
  }, [router]);

  const handleAddProduct = useCallback(() => {
    router.push(destinationRoutes.addProduct);
  }, [router]);

  const handleAddStock = useCallback(() => {
    router.push(destinationRoutes.inventory);
  }, [router]);

  const handleOpenCredits = useCallback(() => {
    router.push(destinationRoutes.utang);
  }, [router]);

  const handleOpenReports = useCallback(() => {
    router.push(destinationRoutes.reports);
  }, [router]);

  const handleOpenSales = useCallback(() => {
    router.push('/sell');
  }, [router]);

  const handleOpenSale = useCallback(
    (saleId: number) => {
      router.push(`/(edit-forms)/sale-details/${saleId}` as Href);
    },
    [router],
  );

  return (
    <SafeAreaView className="flex-1 bg-cinnamon-500" edges={['top']}>
      <View className="flex-1 bg-paper-200">
        {/* Header with integrated daily metrics */}
        {statsLoading || sessionLoading ? (
          <View className="bg-cinnamon-500 px-5 pt-3 pb-5">
            {/* Row 1: Monogram + Eyebrow */}
            <View className="flex-row items-center mb-3">
              <Skeleton width={32} height={32} borderRadius={16} />
              <View className="ml-2">
                <Skeleton width={90} height={10} borderRadius={4} />
              </View>
            </View>

            {/* Row 2: Title + Subtitle + Drawer Badge + Settings Button */}
            <View className="flex-row items-start justify-between mb-4">
              <View className="flex-1 mr-3">
                <View className="flex-row items-center gap-2">
                  <Skeleton width={180} height={32} borderRadius={6} />
                  <Skeleton width={96} height={24} borderRadius={12} />
                </View>
                <View className="mt-1">
                  <Skeleton width={180} height={14} borderRadius={4} />
                </View>
              </View>
              <Skeleton width={44} height={44} borderRadius={22} />
            </View>

            {/* Row 3: Cohesive Metric Cards Skeleton */}
            <View className="flex-row gap-3 pt-3 border-t border-cinnamon-400/40">
              <View className="flex-1 bg-paper-50/20 rounded-2xl p-3.5 border border-paper-50/30">
                <Skeleton width={90} height={10} borderRadius={4} />
                <View className="mt-1">
                  <Skeleton width={110} height={28} borderRadius={4} />
                </View>
                <View className="mt-1.5">
                  <Skeleton width={70} height={14} borderRadius={4} />
                </View>
              </View>
              <View className="flex-1 bg-paper-50/20 rounded-2xl p-3.5 border border-paper-50/30">
                <Skeleton width={90} height={10} borderRadius={4} />
                <View className="mt-1">
                  <Skeleton width={50} height={28} borderRadius={4} />
                </View>
                <View className="mt-1.5">
                  <Skeleton width={60} height={14} borderRadius={4} />
                </View>
              </View>
            </View>
          </View>
        ) : (
          <DashboardContextHeader
            hasStockRisk={hasStockRisk}
            cashSession={
              currentSession
                ? { status: currentSession.status, variance: currentSession.variance ?? null }
                : null
            }
            totalPesos={stats?.total ?? 0}
            transactionCount={stats?.transaction_count ?? 0}
            onOpenSettings={handleOpenSettings}
            onOpenCashSession={handleOpenCashSession}
          />
        )}

        {isCriticalError ? (
          <DashboardErrorState onRetry={refetchAll} />
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 96 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#E85A1F"
                colors={['#E85A1F']}
              />
            }
          >
            {/* 1. Stock alert banner — renders only when items are running low */}
            {!productsLoading && (
              <View className="mt-3">
                <DashboardStockAlert
                  lowStockCount={lowStockCount}
                  onRestock={handleAddStock}
                />
              </View>
            )}

            {/* 2. Quick Actions: New Sale hero + 2x2 grid */}
            <DashboardQuickActions
              onNewSale={handleNewSale}
              onAddProduct={handleAddProduct}
              onAddStock={handleAddStock}
              onOpenCredits={handleOpenCredits}
              onOpenReports={handleOpenReports}
              overdueCount={kpis?.overdueCount ?? 0}
            />

            {/* 3. Goal Card — progressive render (shown when not low-stock, to avoid duplication with alert) */}
            {!productsLoading && !sessionLoading && !hasStockRisk && (
              <DashboardGoalCard
                recommendation={homeState.goal}
                onPress={handleGoalPress}
              />
            )}
            {(productsLoading || sessionLoading) && (
              <View className="px-4 mb-3">
                <Skeleton width="100%" height={110} borderRadius={16} />
              </View>
            )}

            {/* 4. Recent Activity — progressive render */}
            {recentSalesLoading || productsLoading || hasSalesLoading ? (
              <View className="px-4 mb-4">
                <View className="bg-paper-50 rounded-2xl p-4 border border-ink-100">
                  <Skeleton width={140} height={18} borderRadius={4} />
                  <View className="mt-3 gap-2">
                    <Skeleton width="100%" height={48} borderRadius={8} />
                    <Skeleton width="100%" height={48} borderRadius={8} />
                    <Skeleton width="100%" height={48} borderRadius={8} />
                  </View>
                </View>
              </View>
            ) : products && products.length === 0 && !hasAnySales ? (
              <DashboardEmptyState onAddProduct={handleAddProduct} />
            ) : recentSalesList.length === 0 ? (
              <View className="px-4 mb-4">
                <View className="bg-paper-50 rounded-2xl p-4 border border-ink-100">
                  <StyledText variant="regular" className="text-ink-500 text-sm text-center">
                    {t('common:dashboard.recentActivity.empty', { defaultValue: 'No sales recorded yet today.' })}
                  </StyledText>
                </View>
              </View>
            ) : (
              <DashboardRecentSales
                sales={recentSalesList}
                onOpenSale={handleOpenSale}
                onSeeAll={handleOpenSales}
              />
            )}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}
