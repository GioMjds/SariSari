import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Href, usePathname, useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { CustomersHeader, CustomersSubTab } from '@/components/customers';
import { TopTabs } from '@/components/navigation/top-tabs';
import { useCustomers, useCreditKPIs } from '@/hooks/useCredits';
import { useTabBarBottomOffset } from '@/components/layout';

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

  const getCurrentTab = (): CustomersSubTab => {
    if (pathname.includes('credit')) return 'credit';
    if (pathname.includes('insights')) return 'insights';
    return 'index';
  };

  const isDetailScreen =
    pathname.includes('/customers/') &&
    !['credit', 'insights', 'index', ''].includes(
      pathname.split('/customers/')[1] || '',
    );

  const handleTabPress = (tab: CustomersSubTab) => {
    if (tab === 'index') {
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
    <View className="flex-1 bg-paper-200">
      {!isDetailScreen && (
        <CustomersHeader
          activeTab={getCurrentTab()}
          totalCustomers={customers.length}
          debtorCount={debtorCount}
          loyalCount={loyalCount}
          totalCredit={kpis?.totalOutstanding || 0}
          onTabPress={handleTabPress}
          onAddCustomer={handleAddCustomer}
        />
      )}
      <View className="flex-1 bg-paper-200 relative">
        <TopTabs
          screenOptions={{
            tabBarStyle: { display: 'none' },
            swipeEnabled: true,
            lazy: true,
            lazyPreloadDistance: 0,
          }}
        >
          <TopTabs.Screen name="index" />
          <TopTabs.Screen name="credit" />
          <TopTabs.Screen name="insights" />
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
    </View>
  );
}
