import { useMemo } from 'react';
import { View } from 'react-native';
import { Href, usePathname, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SubTabScreenShell } from '@/components/layout/SubTabScreenShell';
import { CustomersHeader, CustomersSubTab } from '@/components/customers';
import { TopTabs, type SubTabItem } from '@/components/navigation';
import { useCustomers, useCreditKPIs } from '@/hooks/useCredits';
import { useTabProgress } from '@/hooks';
import { CUSTOMERS_SUB_TABS } from '@/constants/tabs';

export default function CustomersLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation('utang');
  const { data: customers = [] } = useCustomers();
  const { data: kpis } = useCreditKPIs();

  const debtorCount = customers.filter((c) => c.outstanding_balance > 0).length;
  const overdueCount = kpis?.overdueCount ?? 0;

  const activeTab: CustomersSubTab = pathname.includes('collection')
    ? 'collection'
    : 'all';

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

  const handleTabPress = (tab: CustomersSubTab) => {
    router.push(`/(tabs)/customers/${tab}` as Href);
  };

  return (
    <SubTabScreenShell<CustomersSubTab>
      tabs={tabs}
      activeTab={activeTab}
      onTabPress={handleTabPress}
      progress={progress}
      belowTabsSlot={
        <CustomersHeader
          totalCredit={kpis?.totalOutstanding ?? 0}
          debtorCount={debtorCount}
          overdueCount={overdueCount}
          collectedToday={kpis?.totalCollectedToday ?? 0}
          onOverduePress={() => handleTabPress('collection')}
        />
      }
    >
      <View className="flex-1 bg-paper-200 relative">
        <TopTabs
          initialRouteName="all"
          screenOptions={{
            tabBarStyle: { display: 'none' },
            swipeEnabled: true,
            lazy: true,
            lazyPreloadDistance: 0,
          }}
        >
          <TopTabs.Screen name="all" />
          <TopTabs.Screen name="collection" />
        </TopTabs>
      </View>
    </SubTabScreenShell>
  );
}
