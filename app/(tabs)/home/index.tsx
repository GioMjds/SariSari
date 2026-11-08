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
  HomeRecommendation,
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
} satisfies Record<HomeDestination | 'customers' | 'cashEntries', Href>;

export default function HomeScreen() {
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

  if (isLoading) return <HomeOverviewSkeleton />;

  const handleGoalAction = (rec: HomeRecommendation) => {
    router.push(routes[rec.destination]);
  };

  const handleSuggestionPress = (destination: HomeDestination) => {
    router.push(routes[destination]);
  };

  return (
    <RefreshableScrollView
      className="flex-1 bg-paper-200"
      contentContainerStyle={{
        paddingTop: 8,
        paddingBottom: tabBarBottomOffset + 24,
      }}
      isRefreshing={refreshing}
      onRefresh={refetchAll}
      refreshThreshold={80}
    >
      <GettingStartedCard />
      {isError ? (
        <DashboardErrorState onRetry={refetchAll} />
      ) : products.length === 0 && stats.transactionCount === 0 ? (
        <DashboardEmptyState
          onAddProduct={() => router.push(routes.addProduct)}
          onStartFirstSale={() => router.push(routes.newSale)}
        />
      ) : (
        <>
          <View className="px-4 mb-5">
            <StyledText variant="medium" className="text-ink-600 text-sm">
              {t('common:homeSalesToday', {
                defaultValue: 'Sales today',
              })}
            </StyledText>
            <StyledText
              variant="extrabold"
              className="text-ink-900 text-hero mt-1"
            >
              {formatCurrency(stats.todaySalesTotal)}
            </StyledText>
            <StyledText variant="regular" className="text-ink-600 text-sm mt-1">
              {t('common:homeTransactionsToday', {
                count: stats.transactionCount,
                defaultValue: '{{count}} sales rung up',
              })}
            </StyledText>
          </View>

          <DashboardQuickActions
            onNewSale={() => router.push(routes.newSale)}
            onAddProduct={() => router.push(routes.addProduct)}
            onAddStock={() => router.push(routes.inventory)}
            onOpenCredits={() => router.push(routes.utang)}
            onOpenReports={() => router.push(routes.reports)}
            overdueCount={stats.overdueCount}
          />

          <DashboardKPIGrid
            totalSales={stats.todaySalesTotal}
            transactionCount={stats.transactionCount}
            profitMargin={stats.profitMargin}
            expensesToday={stats.expensesToday}
            drawingsToday={stats.drawingsToday}
            lowStockCount={stats.lowStockCount}
            totalCredits={stats.overdueAmount}
            creditCustomersCount={stats.overdueCount}
            onDetailsPress={() => router.push(routes.reports)}
            onKpiPress={(target) => {
              if (target === 'inventory') router.push(routes.inventory);
              else if (target === 'cash') router.push(routes.cashEntries);
              else if (target === 'customers') router.push(routes.customers);
              else router.push(routes.reports);
            }}
          />

          <DashboardGoalCard
            recommendation={goal}
            onPress={() => handleGoalAction(goal)}
          />

          {stats.lowStockCount > 0 && (
            <DashboardStockAlert
              lowStockCount={stats.lowStockCount}
              onRestock={() => router.push(routes.inventory)}
            />
          )}

          {suggestions.length > 0 && (
            <DashboardSuggestions
              suggestions={suggestions}
              onPress={handleSuggestionPress}
            />
          )}

          <DashboardRecentSales
            sales={recentSales}
            onOpenSale={(id) =>
              router.push(`/(edit-forms)/sale-details/${id}` as Href)
            }
            onSeeAll={() => router.push('/(tabs)/sales/receipts' as Href)}
          />

          <MiniInsightsCard
            topProductName={topProduct.name}
            unitsSold={topProduct.unitsSold}
          />
        </>
      )}
    </RefreshableScrollView>
  );
}
