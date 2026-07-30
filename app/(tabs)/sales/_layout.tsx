import React from 'react';
import { View } from 'react-native';
import { Href, usePathname, useRouter } from 'expo-router';
import { SalesHeader, SalesSubTab } from '@/components/sales';
import { TopTabs } from '@/components/navigation/top-tabs';
import { useCartStore } from '@/stores';
import { useCart } from '@/components/sales/pos/useCart';

export default function SalesLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const cartItemCount = useCartStore((state) =>
    state.cartItems.reduce((sum, item) => sum + item.quantity, 0),
  );
  const { todayStats } = useCart();

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
        cartItemCount={cartItemCount}
        onTabPress={handleTabPress}
      />
      <View className="flex-1 bg-paper-200 relative">
        <TopTabs
          screenOptions={{
            tabBarStyle: { display: 'none' },
            swipeEnabled: true,
          }}
          initialRouteName="pos"
        >
          <TopTabs.Screen name="pos" />
          <TopTabs.Screen name="cart" />
          <TopTabs.Screen name="checkout" />
          <TopTabs.Screen name="receipts" />
          <TopTabs.Screen name="[detail]" />
          <TopTabs.Screen name="index" />
        </TopTabs>
      </View>
    </View>
  );
}
