import { useMemo, useState } from 'react';
import { ScrollView, View, RefreshControl } from 'react-native';
import { Href, useRouter } from 'expo-router';
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
  const { alerts, refreshing, refetchAll, isLoading } = useHomeDashboardData();

  const [category, setCategory] = useState<AlertCategory>('all');

  const filteredAlerts = useMemo(
    () =>
      category === 'all' ? alerts : alerts.filter((a) => a.type === category),
    [category, alerts],
  );

  if (isLoading) return <HomeAlertsSkeleton />;

  return (
    <ScrollView
      className="flex-1 bg-paper-200"
      contentContainerStyle={{
        paddingTop: 8,
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
              <StyledText variant="medium" className="text-ink-600 text-sm text-center">
                No active alerts in this category. Store is operating smoothly!
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
                onAction={
                  (() => router.push(alert.targetPath as Href))
                }
              />
            ))
          )}
        </View>
      </MotiView>
    </ScrollView>
  );
}
