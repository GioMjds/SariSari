import { RefreshControl, View, ScrollView } from 'react-native';
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
  HomeRecommendation,
  HomeDestination,
} from '@/components/home';
import { useHomeDashboardData } from '@/hooks/useHomeDashboardData';
import { useTabBarBottomOffset } from '@/components/layout';
import { formatCurrency } from '@/utils';

export default function OverviewScreen() {
  const router = useRouter();
  const tabBarBottomOffset = useTabBarBottomOffset();
  const {
    stats,
    products,
    recentSales,
    topProduct,
    currentSession,
    goal,
    suggestions,
    isError,
    isLoading,
    refreshing,
    refetchAll,
  } = useHomeDashboardData();

  if (isLoading) return <HomeOverviewSkeleton />;

  const handleGoalAction = (rec: HomeRecommendation) => {
    const map: Record<HomeRecommendation['destination'], Href> = {
      addProduct: '/(edit-forms)/add-product',
      inventory: '/inventory',
      utang: '/(tabs)/customers/credit',
      cashSession: '/(edit-forms)/cash-session',
      newSale: '/(tabs)/sales/pos',
      reports: '/reports',
    };
    router.push(map[rec.destination] as Href);
  };

  const handleSuggestionPress = (destination: HomeDestination) => {
    const map: Record<HomeDestination, Href> = {
      addProduct: '/(edit-forms)/add-product',
      inventory: '/inventory',
      utang: '/(tabs)/customers/credit',
      cashSession: '/(edit-forms)/cash-session',
      newSale: '/(tabs)/sales/pos',
      reports: '/reports',
    };
    router.push(map[destination] as Href);
  };

  return (
    <ScrollView
      className="flex-1 bg-paper-200"
      contentContainerStyle={{
        paddingTop: 8,
        paddingBottom: tabBarBottomOffset + 24,
      }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refetchAll}
          tintColor="#E85A1F"
          colors={['#E85A1F']}
        />
      }
    >
      {isError ? (
        <DashboardErrorState onRetry={refetchAll} />
      ) : products.length === 0 && stats.transactionCount === 0 ? (
        <DashboardEmptyState
          onAddProduct={() => router.push('/(edit-forms)/add-product' as Href)}
          onStartFirstSale={() => router.push('/(tabs)/sales/pos' as Href)}
        />
      ) : (
        <>
          {/* 1. Slim total-sales hero */}
          <View className="px-4 mb-5">
            <StyledText
              variant="extrabold"
              className="text-ink-500 text-xs tracking-wider uppercase"
            >
              TOTAL SALES TODAY
            </StyledText>
            <View className="flex-row items-baseline gap-3 mt-1.5">
              <StyledText
                variant="extrabold"
                className="text-ink-900 text-hero"
              >
                {formatCurrency(stats.todaySalesTotal)}
              </StyledText>
            </View>
            <View className="flex-row items-center gap-2 mt-2">
              <StyledText variant="regular" className="text-ink-500 text-xs">
                {stats.transactionCount} transactions today
              </StyledText>
              <View className="bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200">
                <StyledText
                  variant="extrabold"
                  className="text-emerald-800 text-[11px]"
                >
                  RECORDED
                </StyledText>
              </View>
            </View>
          </View>

          <DashboardKPIGrid
            totalSales={stats.todaySalesTotal}
            transactionCount={stats.transactionCount}
            profitMargin={stats.profitMargin}
            cashSessionStatus={
              currentSession?.status === 'closed' ? 'Closed' : 'Open'
            }
            startingFloat={
              currentSession?.startingFloat
                ? currentSession.startingFloat / 100
                : 500
            }
            lowStockCount={stats.lowStockCount}
            totalCredits={stats.overdueAmount}
            creditCustomersCount={stats.overdueCount}
            onDetailsPress={() => router.push('/reports' as Href)}
            onKpiPress={(target) => {
              if (target === 'inventory') router.push('/inventory' as Href);
              else if (target === 'cash')
                router.push('/(edit-forms)/cash-session' as Href);
              else router.push('/reports' as Href);
            }}
          />

          {/* 3. GoalCard */}
          <DashboardGoalCard
            recommendation={goal}
            onPress={() => handleGoalAction(goal)}
          />

          {/* 4. StockAlert (conditional) */}
          {stats.lowStockCount > 0 && (
            <DashboardStockAlert
              lowStockCount={stats.lowStockCount}
              onRestock={() => router.push('/inventory' as Href)}
            />
          )}

          {/* 5. Quick Actions */}
          <DashboardQuickActions
            onNewSale={() => router.push('/(tabs)/sales/pos' as Href)}
            onAddProduct={() => router.push('/(edit-forms)/add-product' as any)}
            onAddStock={() => router.push('/inventory' as Href)}
            onOpenCredits={() => router.push('/(tabs)/customers/credit' as Href)}
            onOpenReports={() => router.push('/reports' as Href)}
            overdueCount={stats.overdueCount}
          />

          {/* 6. Suggestions (conditional — already filtered by resolveHomeState) */}
          {suggestions.length > 0 && (
            <DashboardSuggestions
              suggestions={suggestions}
              onPress={handleSuggestionPress}
            />
          )}

          {/* 7. Recent Activity */}
          <DashboardRecentSales
            sales={recentSales}
            onOpenSale={(id) =>
              router.push(`/(edit-forms)/sale-details/${id}` as Href)
            }
            onSeeAll={() => router.push('/sales' as Href)}
          />

          {/* 8. Top Seller */}
          <MiniInsightsCard
            topProductName={topProduct.name}
            unitsSold={topProduct.unitsSold}
          />
        </>
      )}
    </ScrollView>
  );
}
