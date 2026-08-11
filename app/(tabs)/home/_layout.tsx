import { DashboardHeader, HomeSubTab } from '@/components/home';
import { TopTabs } from '@/components/navigation/top-tabs';
import { useHomeDashboardData } from '@/hooks/useHomeDashboardData';
import { useTabProgress } from '@/hooks';
import { HOME_SUB_TABS } from '@/constants/tabs';
import { Href, usePathname, useRouter } from 'expo-router';
import { View } from 'react-native';

export default function HomeLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const { profile } = useHomeDashboardData();

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
    return 'overview';
  };

  const progress = useTabProgress(getCurrentTab(), HOME_SUB_TABS);

  const handleTabPress = (tab: HomeSubTab) => {
    if (tab === 'overview') {
      router.push('/(tabs)/home' as Href);
    } else {
      router.push(`/(tabs)/home/${tab}` as Href);
    }
  };

  return (
    <View className="flex-1 bg-paper-200">
      <DashboardHeader
        storeName={storeName || ''}
        ownerInitials={ownerInitials || ''}
        activeTab={getCurrentTab()}
        showTopHeader={false}
        onTabPress={handleTabPress}
        progress={progress}
      />
      <View className="flex-1 bg-paper-200">
        <TopTabs
          screenOptions={{
            tabBarStyle: { display: 'none' },
            swipeEnabled: true,
            lazy: true,
            lazyPreloadDistance: 0,
          }}
          initialRouteName="overview"
        >
          <TopTabs.Screen name="overview" />
          <TopTabs.Screen name="today" />
        </TopTabs>
      </View>
    </View>
  );
}
