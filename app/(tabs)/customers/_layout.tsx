import { View, TouchableOpacity } from 'react-native';
import { Href, usePathname, useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SubTabScreenShell } from '@/components/layout/SubTabScreenShell';
import { CustomersHeader, CustomersSubTab } from '@/components/customers';
import { TopTabs } from '@/components/navigation/top-tabs';
import { useCustomers, useCreditKPIs } from '@/hooks/useCredits';
import { useTabProgress } from '@/hooks';
import { CUSTOMERS_SUB_TABS } from '@/constants/tabs';
import { useTabBarBottomOffset } from '@/components/layout';

// NOTE: tab bar badges (CREDIT = debtor count, COLLECTION = overdue count)
// are omitted in this migration. The shell's SubTabItem shape supports
// badgeCount; add per-tab badge entries here when refactoring tabs config.
const CUSTOMERS_TAB_DEFS: { key: CustomersSubTab; label: string }[] = [
  { key: 'all', label: 'ALL' },
  { key: 'credit', label: 'CREDIT' },
  { key: 'collection', label: 'COLLECTION' },
];

export default function CustomersLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const tabBarBottomOffset = useTabBarBottomOffset();
  const { data: customers = [] } = useCustomers();
  const { data: kpis } = useCreditKPIs();

  const debtorCount = customers.filter((c) => c.outstanding_balance > 0).length;
  const loyalCount = customers.filter(
    (c) => c.loyalty_tier === 'loyal' || c.loyalty_tier === 'vip',
  ).length;

  const activeTab: CustomersSubTab = pathname.includes('credit')
    ? 'credit'
    : pathname.includes('collection')
      ? 'collection'
      : 'all';

  const isDetailScreen =
    pathname.includes('/customers/') &&
    !['credit', 'collection', 'insights', 'all', ''].includes(
      pathname.split('/customers/')[1] || '',
    );

  const progress = useTabProgress(activeTab, CUSTOMERS_SUB_TABS);

  const handleTabPress = (tab: CustomersSubTab) => {
    if (tab === 'all') {
      router.push('/(tabs)/customers' as Href);
    } else {
      router.push(`/(tabs)/customers/${tab}` as Href);
    }
  };

  const handleAddCustomer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.push('/(edit-forms)/add-customer' as Href);
  };

  return (
    <SubTabScreenShell<CustomersSubTab>
      tabs={CUSTOMERS_TAB_DEFS}
      activeTab={activeTab}
      onTabPress={handleTabPress}
      progress={progress}
      topSlot={
        !isDetailScreen ? (
          <CustomersHeader
            totalCustomers={customers.length}
            debtorCount={debtorCount}
            loyalCount={loyalCount}
            totalCredit={kpis?.totalOutstanding || 0}
            overdueCount={kpis?.overdueCount || 0}
          />
        ) : null
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
          <TopTabs.Screen name="credit" />
          <TopTabs.Screen name="collection" />
        </TopTabs>

        {!isDetailScreen && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleAddCustomer}
            style={{ bottom: tabBarBottomOffset + 16 }}
            className="absolute right-5 bg-cinnamon-500 w-14 h-14 rounded-full items-center justify-center shadow-lg z-50 border border-cinnamon-600"
            accessibilityRole="button"
            accessibilityLabel="Add Customer"
          >
            <FontAwesome name="user-plus" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>
    </SubTabScreenShell>
  );
}
