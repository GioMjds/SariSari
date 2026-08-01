import { RefreshControl, ScrollView } from 'react-native';
import { Href, useRouter } from 'expo-router';
import {
  DashboardKPIGrid,
  DashboardQuickActions,
  DashboardRecentSales,
  MiniInsightsCard,
  HomeOverviewSkeleton,
} from '@/components/home';
import { useHomeDashboardData } from '@/hooks/useHomeDashboardData';
import { useTabBarBottomOffset } from '@/components/layout';

export default function OverviewScreen() {
  const router = useRouter();
  const tabBarBottomOffset = useTabBarBottomOffset();
  const {
    stats,
    recentSales,
    topProduct,
    currentSession,
    refreshing,
    refetchAll,
    isLoading,
  } = useHomeDashboardData();

  if (isLoading) return <HomeOverviewSkeleton />;

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
      {/* Total Sales Hero & 2x2 KPI Grid */}
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
          else if (target === 'utang') router.push('/utang' as Href);
          else if (target === 'cash')
            router.push('/(edit-forms)/cash-session' as Href);
          else router.push('/reports' as Href);
        }}
      />

      {/* Hero CTA & Quick Action Grid */}
      <DashboardQuickActions
        onNewSale={() => router.push('/(tabs)/sales/pos' as Href)}
        onAddProduct={() => router.push('/(edit-forms)/add-product' as any)}
        onAddStock={() => router.push('/inventory' as Href)}
        onOpenCredits={() => router.push('/utang' as Href)}
        onOpenReports={() => router.push('/reports' as Href)}
        overdueCount={stats.overdueCount}
      />

      {/* Recent Activity Feed */}
      <DashboardRecentSales
        sales={recentSales}
        onOpenSale={(id) =>
          router.push(`/(edit-forms)/sale-details/${id}` as Href)
        }
        onSeeAll={() => router.push('/sales' as Href)}
      />

      {/* Dark Espresso Top Seller Banner */}
      <MiniInsightsCard
        topProductName={topProduct.name}
        unitsSold={topProduct.unitsSold}
      />
    </ScrollView>
  );
}
