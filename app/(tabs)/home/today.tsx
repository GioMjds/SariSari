import { ScrollView } from 'react-native';
import { useRouter, Href } from 'expo-router';
import {
  SalesTargetCard,
  CashSessionCard,
  HourlySalesTimeline,
  TodayTransactionLog,
  TodaySnapshotSkeleton,
} from '@/components/home';
import { useHomeDashboardData } from '@/hooks/useHomeDashboardData';
import { useTabBarBottomOffset } from '@/components/layout';

export default function TodayScreen() {
  const router = useRouter();
  const tabBarBottomOffset = useTabBarBottomOffset();
  const { stats, currentSession, isLoading, hourlySales, recentSales } =
    useHomeDashboardData();

  if (isLoading) {
    return <TodaySnapshotSkeleton />;
  }

  return (
    <ScrollView
      className="flex-1 bg-paper-200"
      contentContainerStyle={{
        paddingVertical: 16,
        paddingBottom: tabBarBottomOffset + 24,
      }}
    >
      <SalesTargetCard
        currentSales={stats.todaySalesTotal}
        targetSales={5000}
      />
      <CashSessionCard
        status={currentSession?.status}
        startingFloat={currentSession?.startingFloat}
        expectedCash={currentSession?.expectedCash}
        variance={currentSession?.variance}
        onSessionAction={() =>
          router.push('/(edit-forms)/cash-session' as Href)
        }
      />
      <HourlySalesTimeline hourlyData={hourlySales} />
      <TodayTransactionLog
        sales={recentSales}
        onOpenSale={(id) =>
          router.push(`/(edit-forms)/sale-details/${id}` as Href)
        }
        onSeeAll={() => router.push('/sales' as Href)}
      />
    </ScrollView>
  );
}
