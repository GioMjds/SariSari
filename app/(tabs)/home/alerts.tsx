import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  AlertCategory,
  AlertFilterPills,
  AlertCardItem,
} from '@/components/dashboard';
import { useTabBarBottomOffset } from '@/components/layout';
import { StyledText } from '@/components/elements';

export default function Alerts() {
  const router = useRouter();
  const tabBarBottomOffset = useTabBarBottomOffset();

  const [category, setCategory] = useState<AlertCategory>('all');

  // Must delete this hardcoded data to use user's local data
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
      subtitle: '₱450.00 overdue by 5 days',
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
    >
      <AlertFilterPills
        activeCategory={category}
        onSelectCategory={setCategory}
      />

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
    </ScrollView>
  );
}
