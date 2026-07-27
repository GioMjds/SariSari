import React from 'react';
import { RefreshControl, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useHomeDashboardData } from '@/hooks/useHomeDashboardData';
import {
  DashboardKPIGrid,
  DashboardQuickActions,
  DashboardRecentSales,
  MiniInsightsCard,
} from '@/components/dashboard';
import { useTabBarBottomOffset } from '@/components/layout';

export default function OverviewScreen() {
  const router = useRouter();
  const tabBarBottomOffset = useTabBarBottomOffset();
  const { stats, refreshing, refetchAll } = useHomeDashboardData();

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
      {/* 2x2 KPI Grid */}
      <DashboardKPIGrid
        totalSales={stats.todaySalesTotal}
        transactionCount={stats.transactionCount}
        profitMargin={28}
        lowStockCount={3}
        totalCredits={stats.overdueAmount}
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

      {/* Mini Insights Card */}
      <MiniInsightsCard
        topProductName="Lucky Me Pancit Canton"
        unitsSold={38}
      />

      {/* Recent Activity */}
      <DashboardRecentSales
        sales={[]}
        onOpenSale={(id) =>
          router.push(`/(edit-forms)/sale-details/${id}` as any)
        }
        onSeeAll={() => router.push('/sales' as any)}
      />
    </ScrollView>
  );
}
