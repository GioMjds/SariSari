import { RefreshControl, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
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
  const { stats, refreshing, refetchAll, isLoading } = useHomeDashboardData();

  if (isLoading) {
    return <HomeOverviewSkeleton />;
  }

  return (
    <ScrollView
      className="flex-1 bg-paper-200"
      contentContainerStyle={{
        paddingVertical: 16,
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
        totalSales={stats.todaySalesTotal || 3840}
        transactionCount={stats.transactionCount || 24}
        profitMargin={912}
        cashSessionStatus="Open"
        startingFloat={500}
        lowStockCount={7}
        totalCredits={stats.overdueAmount || 1250}
        creditCustomersCount={stats.overdueCount || 3}
        onDetailsPress={() => router.push('/reports' as any)}
      />

      {/* Hero CTA & Quick Action Grid */}
      <DashboardQuickActions
        onNewSale={() => router.push('/(edit-forms)/add-sales' as any)}
        onAddProduct={() => router.push('/(edit-forms)/add-product' as any)}
        onAddStock={() => router.push('/inventory' as any)}
        onOpenCredits={() => router.push('/utang' as any)}
        onOpenReports={() => router.push('/reports' as any)}
        overdueCount={stats.overdueCount}
      />

      {/* Recent Activity Feed */}
      <DashboardRecentSales
        sales={[]}
        onOpenSale={(id) =>
          router.push(`/(edit-forms)/sale-details/${id}` as any)
        }
        onSeeAll={() => router.push('/sales' as any)}
      />

      {/* Dark Espresso Top Seller Banner */}
      <MiniInsightsCard
        topProductName="Palmolive 12ml"
        unitsSold={18}
      />
    </ScrollView>
  );
}
