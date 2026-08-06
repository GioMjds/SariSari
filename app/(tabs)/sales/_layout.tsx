import React from 'react';
import { View } from 'react-native';
import { Href, usePathname, useRouter } from 'expo-router';
import { SalesHeader, SalesSubTab } from '@/components/sales';
import { TopTabs } from '@/components/navigation/top-tabs';
import { useTodayStats } from '@/hooks/useSales';

export default function SalesLayout() {
  const router = useRouter();
  const pathname = usePathname();
  // Direct query subscription — avoids the full useCart() cascade
  // (which also pulls in usePaginatedProducts('') and the cart store)
  // that this layout was previously paying just for a header number.
  const { data: todayStats } = useTodayStats();

  const getCurrentTab = (): SalesSubTab => {
    if (pathname.includes('/cart')) return 'cart';
    if (pathname.includes('/checkout')) return 'checkout';
    if (pathname.includes('/receipts')) return 'receipts';
    return 'pos';
  };

  const handleTabPress = (tab: SalesSubTab) => {
    router.push(`/(tabs)/sales/${tab}` as Href);
  };

  return (
    <View className="flex-1 bg-paper-200">
      <SalesHeader
        activeTab={getCurrentTab()}
        todayTotal={todayStats?.total || 0}
        onTabPress={handleTabPress}
      />
      <View className="flex-1 bg-paper-200 relative">
        <TopTabs
          screenOptions={{
            tabBarStyle: { display: 'none' },
            swipeEnabled: true,
            lazy: true,
            lazyPreloadDistance: 0,
          }}
          initialRouteName="pos"
        >
          <TopTabs.Screen name="pos" />
          <TopTabs.Screen name="receipts" />
        </TopTabs>
      </View>
    </View>
  );
}
