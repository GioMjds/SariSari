import { useCallback, useMemo } from 'react';
import { Href, useRouter, useSegments } from 'expo-router';
import { SubTabScreenShell } from '@/components/layout/SubTabScreenShell';
import { SalesHeader, SalesSubTab } from '@/components/sales';
import { TopTabs } from '@/components/navigation/top-tabs';
import { useTodayStats } from '@/hooks/useSales';
import { useTabProgress } from '@/hooks';
import { SALES_SUB_TABS } from '@/constants/tabs';

const TOP_TABS_SCREEN_OPTIONS = {
  tabBarStyle: { display: 'none' as const },
  swipeEnabled: false,
  lazy: true,
  lazyPreloadDistance: 0,
} as const;

const SALES_TAB_DEFS = [
  { key: 'pos', label: 'Sell' },
  { key: 'receipts', label: 'Receipts' },
] satisfies { key: SalesSubTab; label: string }[];

const DEFAULT_TAB = SALES_SUB_TABS[0];

export default function SalesLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { data: todayStats } = useTodayStats();

  const activeSubTab = useMemo<SalesSubTab>(() => {
    const matched = SALES_SUB_TABS.find((tab) => segments.includes(tab));
    return (matched as SalesSubTab | undefined) ?? DEFAULT_TAB;
  }, [segments]);

  const progress = useTabProgress(activeSubTab, SALES_SUB_TABS);

  const handleTabPress = useCallback(
    (tab: SalesSubTab) => {
      if (tab === activeSubTab) return;
      router.navigate(`/(tabs)/sales/${tab}` as Href);
    },
    [router, activeSubTab],
  );

  const todayTotal = todayStats?.total ?? 0;

  return (
    <SubTabScreenShell<SalesSubTab>
      tabs={SALES_TAB_DEFS}
      activeTab={activeSubTab}
      onTabPress={handleTabPress}
      progress={progress}
      belowTabsSlot={<SalesHeader todayTotal={todayTotal} />}
    >
      <TopTabs
        screenOptions={TOP_TABS_SCREEN_OPTIONS}
        initialRouteName={DEFAULT_TAB}
      >
        {SALES_SUB_TABS.map((name) => 
          <TopTabs.Screen key={name} name={name} />
        )}
      </TopTabs>
    </SubTabScreenShell>
  );
}
