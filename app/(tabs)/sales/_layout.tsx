import React from 'react';
import { Href, usePathname, useRouter } from 'expo-router';
import { SubTabScreenShell } from '@/components/layout/SubTabScreenShell';
import { SalesHeader, SalesSubTab } from '@/components/sales';
import { TopTabs } from '@/components/navigation/top-tabs';
import { useTodayStats } from '@/hooks/useSales';
import { useTabProgress } from '@/hooks';
import { SALES_SUB_TABS } from '@/constants/tabs';

const SALES_TAB_DEFS: { key: SalesSubTab; label: string }[] = [
  { key: 'pos', label: 'POS' },
  { key: 'receipts', label: 'RECEIPTS' },
];

export default function SalesLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: todayStats } = useTodayStats();

  const rawTab: SalesSubTab = pathname.includes('/cart')
    ? 'cart'
    : pathname.includes('/checkout')
      ? 'checkout'
      : pathname.includes('/receipts')
        ? 'receipts'
        : 'pos';

  const effectiveTab: SalesSubTab =
    rawTab === 'cart' || rawTab === 'checkout' ? 'pos' : rawTab;

  const progress = useTabProgress(effectiveTab, SALES_SUB_TABS);

  const handleTabPress = (tab: SalesSubTab) => {
    router.push(`/(tabs)/sales/${tab}` as Href);
  };

  return (
    <SubTabScreenShell<SalesSubTab>
      tabs={SALES_TAB_DEFS}
      activeTab={effectiveTab}
      onTabPress={handleTabPress}
      progress={progress}
      topSlot={<SalesHeader todayTotal={todayStats?.total || 0} />}
    >
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
    </SubTabScreenShell>
  );
}
