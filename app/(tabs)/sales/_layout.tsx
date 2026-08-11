import React, { useMemo } from 'react';
import { View } from 'react-native';
import { Href, usePathname, useRouter } from 'expo-router';
import { SalesHeader, SalesSubTab } from '@/components/sales';
import { TopTabs } from '@/components/navigation/top-tabs';
import { useTodayStats } from '@/hooks/useSales';
import { useTabProgress } from '@/hooks';
import { SALES_SUB_TABS } from '@/constants/tabs';

export default function SalesLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: todayStats } = useTodayStats();

  const getCurrentTab = (): SalesSubTab => {
    if (pathname.includes('/cart')) return 'cart';
    if (pathname.includes('/checkout')) return 'checkout';
    if (pathname.includes('/receipts')) return 'receipts';
    return 'pos';
  };

  const effectiveActiveTab = useMemo<SalesSubTab>(() => {
    const raw = getCurrentTab();
    return raw === 'cart' || raw === 'checkout' ? 'pos' : raw;
  }, [pathname]);

  const progress = useTabProgress(effectiveActiveTab, SALES_SUB_TABS);

  const handleTabPress = (tab: SalesSubTab) => {
    router.push(`/(tabs)/sales/${tab}` as Href);
  };

  return (
    <View className="flex-1 bg-paper-200">
      <SalesHeader
        activeTab={getCurrentTab()}
        todayTotal={todayStats?.total || 0}
        onTabPress={handleTabPress}
        progress={progress}
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
