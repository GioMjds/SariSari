import { DashboardHeader, HomeSubTab } from '@/components/home';
import { TopTabs } from '@/components/navigation/top-tabs';
import { useHomeDashboardData } from '@/hooks/useHomeDashboardData';
import { Href, usePathname, useRouter } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const { profile, alertCount } = useHomeDashboardData();

  const storeName = profile?.storeName || "Juan's Store";
  const ownerName = profile?.ownerName || 'Maria';
  const ownerInitials =
    ownerName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'AN';

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
    <SafeAreaView className="flex-1 bg-paper-200" edges={['top']}>
      <DashboardHeader
        storeName={storeName}
        ownerInitials={ownerInitials}
        activeTab={getCurrentTab()}
        alertCount={alertCount}
        onTabPress={handleTabPress}
        onNotificationPress={handleNotificationPress}
      />
      <View className="flex-1 bg-paper-200">
        <TopTabs
          screenOptions={{
            tabBarStyle: { display: 'none' },
            swipeEnabled: true,
          }}
        >
          <TopTabs.Screen name="index" />
          <TopTabs.Screen name="today" />
          <TopTabs.Screen name="alerts" />
        </TopTabs>
      </View>
    </SafeAreaView>
  );
}
