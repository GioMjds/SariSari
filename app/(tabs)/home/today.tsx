import { ScrollView } from 'react-native';
import { useRouter, Href } from 'expo-router';
import {
  HourlySalesTimeline,
  TodayTransactionLog,
  TodaySnapshotSkeleton,
} from '@/components/home';
import { useHomeDashboardData } from '@/hooks/useHomeDashboardData';
import { useTabBarBottomOffset } from '@/components/layout';
import { RefreshControl } from 'react-native-gesture-handler';

export default function TodayScreen() {
  const router = useRouter();
  const tabBarBottomOffset = useTabBarBottomOffset();
  const { isLoading, hourlySales, recentSales, refreshing, refetchAll } =
    useHomeDashboardData();

  if (isLoading) return <TodaySnapshotSkeleton />;

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
