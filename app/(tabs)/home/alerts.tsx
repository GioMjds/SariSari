import { useState } from 'react';
import { ScrollView, View, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import {
  AlertCategory,
  AlertFilterPills,
  AlertCardItem,
  HomeAlertsSkeleton,
} from '@/components/home';
import { useTabBarBottomOffset } from '@/components/layout';
import { useHomeDashboardData } from '@/hooks';
import { StyledText } from '@/components/elements';

export default function AlertsScreen() {
  const router = useRouter();
  const tabBarBottomOffset = useTabBarBottomOffset();
  const { stats, refreshing, refetchAll, isLoading } = useHomeDashboardData();

  const [category, setCategory] = useState<AlertCategory>('all');

  if (isLoading) {
    return <HomeAlertsSkeleton />;
  }

  const alerts = [
    {
      id: 1,
      type: 'low_stock' as const,
      title: 'Coca-Cola 1.5L',
      subtitle: '2 bottles remaining (Threshold: 10)',
      actionLabel: 'Restock',
      onAction: () => router.push('/inventory' as any),
    },
    {
      id: 2,
      type: 'expiring' as const,
      title: 'Gardenia Bread',
      subtitle: 'Expires in 2 days (July 28)',
      actionLabel: 'Discount',
      onAction: () => router.push('/inventory' as any),
    },
    {
      id: 3,
      type: 'overdue_debts' as const,
      title: 'Aling Nena',
      subtitle: `₱${stats.overdueAmount > 0 ? stats.overdueAmount.toLocaleString() : '450.00'} overdue by 5 days`,
      actionLabel: 'Collect',
      onAction: () => router.push('/utang' as any),
    },
  ];

  const filteredAlerts =
    category === 'all' ? alerts : alerts.filter((a) => a.type === category);

  return (
    <ScrollView
      className="flex-1 bg-paper-200"
      contentContainerStyle={{
        paddingVertical: 16,
        paddingBottom: tabBarBottomOffset + 24,
      }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refetchAll}
          tintColor="#E85A1F"
          colors={['#E85A1F']}
        />
      }
    >
      <MotiView
        from={{ opacity: 0, translateY: 15 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 350, delay: 50 }}
      >
        <AlertFilterPills
          activeCategory={category}
          onSelectCategory={setCategory}
        />
      </MotiView>

      <MotiView
        from={{ opacity: 0, translateY: 15 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 350, delay: 150 }}
      >
        <View className="px-4">
          {filteredAlerts.length === 0 ? (
            <View className="bg-paper-50 p-6 rounded-2xl border border-ink-100 items-center justify-center">
              <StyledText variant="medium" className="text-ink-400 text-sm">
                No active alerts in this category.
              </StyledText>
            </View>
          ) : (
            filteredAlerts.map((alert) => (
              <AlertCardItem
                key={alert.id}
                type={alert.type}
                title={alert.title}
                subtitle={alert.subtitle}
                actionLabel={alert.actionLabel}
                onAction={alert.onAction}
              />
            ))
          )}
        </View>
      </MotiView>
    </ScrollView>
  );
}
