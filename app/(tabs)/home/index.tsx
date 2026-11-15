import { useCallback, useMemo } from 'react';
import { Prof, useChangeLog, withProf } from '@/utils/perf';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Href, useRouter } from 'expo-router';
import { StyledText } from '@/components/elements';
import {
  DashboardKPIGrid,
  DashboardGoalCard,
  DashboardQuickActions,
  DashboardRecentSales,
  DashboardStockAlert,
  DashboardSuggestions,
  DashboardEmptyState,
  DashboardErrorState,
  HomeOverviewSkeleton,
  MiniInsightsCard,
  GettingStartedCard,
  HomeDestination,
} from '@/components/home';
import { useHomeDashboardData } from '@/hooks/useHomeDashboardData';
import { useTabBarBottomOffset } from '@/components/layout';
import { formatCurrency } from '@/utils';
import { RefreshableScrollView } from '@/components/ui';

const routes = {
  addProduct: '/(edit-forms)/add-product',
  inventory: '/inventory',
  utang: '/(tabs)/customers/all',
  cashEntries: '/settings/cash-entries',
  newSale: '/(tabs)/sales/pos',
  customers: '/(tabs)/customers/collection',
  reports: '/settings/reports',
} satisfies Record<HomeDestination, Href>;

const SALE_DETAILS = '/(edit-forms)/sale-details/';
const RECEIPTS = '/(tabs)/sales/receipts' as Href;

function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const tabBarBottomOffset = useTabBarBottomOffset();
  const {
    stats,
    products,
    recentSales,
    topProduct,
    goal,
    suggestions,
    isError,
    isLoading,
    refreshing,
    refetchAll,
  } = useHomeDashboardData();

  // Every field in the payload is now stable, so this only recomputes when
  // a value actually changes — the change-logger works as intended.
  const changeLogPayload = useMemo(
    () => ({
      stats,
      products,
      recentSales,
      topProduct,
      goal,
      suggestions,
      isError,
      isLoading,
      refreshing,
      refetchAll,
    }),
    [
      stats,
      products,
      recentSales,
      topProduct,
      goal,
      suggestions,
      isError,
      isLoading,
      refreshing,
      refetchAll,
    ],
  );
  useChangeLog('home/index', changeLogPayload);

  const contentContainerStyle = useMemo(
    () => ({ paddingTop: 8, paddingBottom: tabBarBottomOffset + 24 }),
    [tabBarBottomOffset],
  );

  const formattedTodaySales = useMemo(
    () => formatCurrency(stats.todaySalesTotal),
    [stats.todaySalesTotal],
  );

  // Navigation handlers — stable, so memo'd children never re-render from them.
  const goNewSale = useCallback(() => router.push(routes.newSale), [router]);
  const goAddProduct = useCallback(
    () => router.push(routes.addProduct),
    [router],
  );
  const goInventory = useCallback(
    () => router.push(routes.inventory),
    [router],
  );
  const goUtang = useCallback(() => router.push(routes.utang), [router]);
  const goReports = useCallback(() => router.push(routes.reports), [router]);

  const handleGoalPress = useCallback(
    () => router.push(routes[goal.destination]),
    [router, goal.destination],
  );

  const handleSuggestionPress = useCallback(
    (destination: HomeDestination) => router.push(routes[destination]),
    [router],
  );

  const handleKpiPress = useCallback(
    (target: 'inventory' | 'cash' | 'customers' | 'reports') => {
      if (target === 'inventory') router.push(routes.inventory);
      else if (target === 'cash') router.push(routes.cashEntries);
      else if (target === 'customers') router.push(routes.customers);
      else router.push(routes.reports);
    },
    [router],
  );

  const handleOpenSale = useCallback(
    (id: number) => router.push(`${SALE_DETAILS}${id}` as Href),
    [router],
  );

  const handleSeeAllSales = useCallback(() => router.push(RECEIPTS), [router]);

  if (isLoading) return <HomeOverviewSkeleton />;

  return (
    <RefreshableScrollView
      className="flex-1 bg-paper-200"
      contentContainerStyle={contentContainerStyle}
      isRefreshing={refreshing}
      onRefresh={refetchAll}
      refreshThreshold={80}
    >
      <Prof id="Home:GettingStartedCard">
        <GettingStartedCard />
      </Prof>

      {isError ? (
        <DashboardErrorState onRetry={refetchAll} />
      ) : products.length === 0 && stats.transactionCount === 0 ? (
        <DashboardEmptyState
          onAddProduct={goAddProduct}
          onStartFirstSale={goNewSale}
        />
      ) : (
        <>
          <View className="px-4 mb-5">
            <StyledText variant="medium" className="text-ink-600 text-sm">
              {t('common:homeSalesToday', { defaultValue: 'Sales today' })}
            </StyledText>
            <StyledText
              variant="extrabold"
              className="text-ink-900 text-hero mt-1"
            >
              {formattedTodaySales}
            </StyledText>
            <StyledText variant="regular" className="text-ink-600 text-sm mt-1">
              {t('common:homeTransactionsToday', {
                count: stats.transactionCount,
                defaultValue: '{{count}} sales rung up',
              })}
            </StyledText>
          </View>

          <Prof id="Home:DashboardQuickActions">
            <DashboardQuickActions
              onNewSale={goNewSale}
              onAddProduct={goAddProduct}
              onAddStock={goInventory}
              onOpenCredits={goUtang}
              onOpenReports={goReports}
              overdueCount={stats.overdueCount}
            />
          </Prof>

          <Prof id="Home:DashboardKPIGrid">
            <DashboardKPIGrid
              profitMargin={stats.profitMargin}
              expensesToday={stats.expensesToday}
              drawingsToday={stats.drawingsToday}
              lowStockCount={stats.lowStockCount}
              totalCredits={stats.overdueAmount}
              creditCustomersCount={stats.overdueCount}
              onDetailsPress={goReports}
              onKpiPress={handleKpiPress}
            />
          </Prof>

          <Prof id="Home:DashboardGoalCard">
            <DashboardGoalCard
              recommendation={goal}
              onPress={handleGoalPress}
            />
          </Prof>

          {stats.lowStockCount > 0 && (
            <Prof id="Home:DashboardStockAlert">
              <DashboardStockAlert
                lowStockCount={stats.lowStockCount}
                onRestock={goInventory}
              />
            </Prof>
          )}

          {suggestions.length > 0 && (
            <Prof id="Home:DashboardSuggestions">
              <DashboardSuggestions
                suggestions={suggestions}
                onPress={handleSuggestionPress}
              />
            </Prof>
          )}

          <Prof id="Home:DashboardRecentSales">
            <DashboardRecentSales
              sales={recentSales}
              onOpenSale={handleOpenSale}
              onSeeAll={handleSeeAllSales}
            />
          </Prof>

          {topProduct && (
            <Prof id="Home:MiniInsightsCard">
              <MiniInsightsCard
                topProductName={topProduct.name}
                unitsSold={topProduct.unitsSold}
              />
            </Prof>
          )}
        </>
      )}
    </RefreshableScrollView>
  );
}

export default withProf(HomeScreen, 'home/index');
