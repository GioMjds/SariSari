import { DashboardHeader, HomeSubTab } from '@/components/home';
import { TopTabs } from '@/components/navigation/top-tabs';
import { useHomeDashboardData } from '@/hooks/useHomeDashboardData';
import { Href, usePathname, useRouter } from 'expo-router';
import { View } from 'react-native';

export default function HomeLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const { profile, alertCount } = useHomeDashboardData();

  const storeName = profile?.storeName;
  const ownerName = profile?.ownerName;

  const ownerInitials = ownerName
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const getCurrentTab = (): HomeSubTab => {
    if (pathname.includes('today')) return 'today';
    if (pathname.includes('alerts')) return 'alerts';
    return 'index';
  };

  const handleTabPress = (tab: HomeSubTab) => {
    if (tab === 'index') {
      router.push('/(tabs)/home' as Href);
    } else {
      router.push(`/(tabs)/home/${tab}` as Href);
    }
  };

  const handleNotificationPress = () => {
    router.push('/(tabs)/home/alerts' as Href);
  };

  return (
    <View className="flex-1 bg-paper-200">
      <DashboardHeader
        storeName={storeName || ''}
        ownerInitials={ownerInitials || ''}
        activeTab={getCurrentTab()}
        alertCount={alertCount}
        showTopHeader={false}
        onTabPress={handleTabPress}
        onNotificationPress={handleNotificationPress}
      />
      <View className="flex-1 bg-paper-200">
        <TopTabs
          screenOptions={{
            tabBarStyle: { display: 'none' },
            swipeEnabled: true,
            lazy: true,
            lazyPreloadDistance: 0,
          }}
        >
          <TopTabs.Screen name="index" />
          <TopTabs.Screen name="today" />
          <TopTabs.Screen name="alerts" />
        </TopTabs>
      </View>
    </View>
  );
}
