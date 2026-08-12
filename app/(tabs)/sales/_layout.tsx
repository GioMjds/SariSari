import { Href, usePathname, useRouter } from 'expo-router';
import { SubTabScreenShell } from '@/components/layout/SubTabScreenShell';
import { SalesHeader, SalesSubTab } from '@/components/sales';
import { TopTabs } from '@/components/navigation/top-tabs';
import { useTodayStats } from '@/hooks/useSales';
import { useTabProgress } from '@/hooks';
import { SALES_SUB_TABS } from '@/constants/tabs';

const SALES_TAB_DEFS = [
  { key: 'pos', label: 'POS' },
  { key: 'receipts', label: 'RECEIPTS' },
] satisfies { key: SalesSubTab; label: string }[];

export default function SalesLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: todayStats } = useTodayStats();

  const activeSubTab: SalesSubTab = pathname.includes('/receipts')
    ? 'receipts'
    : 'pos';

  const progress = useTabProgress(activeSubTab, SALES_SUB_TABS);

  const handleTabPress = (tab: SalesSubTab) => {
    router.push(`/(tabs)/sales/${tab}` as Href);
  };

  return (
    <SubTabScreenShell<SalesSubTab>
      tabs={SALES_TAB_DEFS}
      activeTab={activeSubTab}
      onTabPress={handleTabPress}
      progress={progress}
      belowTabsSlot={<SalesHeader todayTotal={todayStats?.total || 0} />}
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
