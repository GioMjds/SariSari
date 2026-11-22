import { useCallback, useMemo } from 'react';
import { View } from 'react-native';
import { Href, useRouter, useSegments } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SubTabScreenShell } from '@/components/layout/SubTabScreenShell';
import { CustomersHeader, CustomersSubTab } from '@/components/customers';
import { TopTabs, type SubTabItem } from '@/components/navigation';
import { useCustomers, useCreditKPIs } from '@/hooks/useCredits';
import { useTabProgress } from '@/hooks';
import { CUSTOMERS_SUB_TABS } from '@/constants/tabs';

const TOP_TABS_SCREEN_OPTIONS = {
  tabBarStyle: { display: 'none' as const },
  swipeEnabled: false,
  lazy: true,
  lazyPreloadDistance: 0,
} as const;

const DEFAULT_TAB = CUSTOMERS_SUB_TABS[0];

export default function CustomersLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { t } = useTranslation('utang');
  const { data: customers = [] } = useCustomers();
  const { data: kpis } = useCreditKPIs();

  const activeTab = useMemo<CustomersSubTab>(() => {
    const matched = CUSTOMERS_SUB_TABS.find((tab) => segments.includes(tab));
    return (matched ?? DEFAULT_TAB) as CustomersSubTab;
  }, [segments]);

  const debtorCount = useMemo(
    () => customers.filter((c) => c.outstanding_balance > 0).length,
    [customers],
  );

  const overdueCount = kpis?.overdueCount ?? 0;
  const totalOutstanding = kpis?.totalOutstanding ?? 0;
  const collectedToday = kpis?.totalCollectedToday ?? 0;

  const tabs = useMemo<SubTabItem<CustomersSubTab>[]>(
    () => [
      { key: 'all', label: t('tabAll') },
      {
        key: 'collection',
        label: t('tabCollect'),
        badgeCount: overdueCount,
        badgeTone: 'action',
        badgeAccessibilityLabel: t('tabOverdueBadgeA11y'),
      },
    ],
    [t, overdueCount],
  );

  const progress = useTabProgress(activeTab, CUSTOMERS_SUB_TABS);

  const handleTabPress = useCallback(
    (tab: CustomersSubTab) => {
      if (tab === activeTab) return;
      router.navigate(`/(tabs)/customers/${tab}` as Href);
    },
    [router, activeTab],
  );

  const handleDuePress = useCallback(() => {
    handleTabPress('collection');
  }, [handleTabPress]);

  return (
    <SubTabScreenShell<CustomersSubTab>
      tabs={tabs}
      activeTab={activeTab}
      onTabPress={handleTabPress}
      progress={progress}
      belowTabsSlot={
        <CustomersHeader
          totalCredit={totalOutstanding}
          debtorCount={debtorCount}
          overdueCount={overdueCount}
          collectedToday={collectedToday}
          onOverduePress={handleDuePress}
        />
      }
    >
      <View className="flex-1 bg-paper-200 relative">
        <TopTabs
          initialRouteName={DEFAULT_TAB}
          screenOptions={TOP_TABS_SCREEN_OPTIONS}
        >
          {CUSTOMERS_SUB_TABS.map((name) => 
            <TopTabs.Screen key={name} name={name} />
          )}
        </TopTabs>
      </View>
    </SubTabScreenShell>
  );
}
