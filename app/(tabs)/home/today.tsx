import { ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import {
  SalesTargetCard,
  HourlySalesTimeline,
  TodayTransactionLog,
  CashSessionCard,
} from '@/components/dashboard';
import { useHomeDashboardData } from '@/hooks';
import { useTabBarBottomOffset } from '@/components/layout';

export default function Today() {
  const router = useRouter();
  const tabBarBottomOffset = useTabBarBottomOffset();
  const { stats, currentSession } = useHomeDashboardData();

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
        onSessionAction={() => router.push('/(edit-forms)/cash-session' as any)}
      />
      <HourlySalesTimeline hourlyData={[]} />
      <TodayTransactionLog
        sales={[]}
        onOpenSale={(id) =>
          router.push(`/(edit-forms)/sale-details/${id}` as any)
        }
      />
    </ScrollView>
  );
}
