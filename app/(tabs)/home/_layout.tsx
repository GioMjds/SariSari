import { DashboardHeader, HomeSubTab } from '@/components/home';
import { TopTabs } from '@/components/navigation/top-tabs';
import { Href, usePathname, useRouter } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeLayout() {
  const router = useRouter();
  const pathname = usePathname();

  const getCurrentTab = (): HomeSubTab => {
    if (pathname.includes('today')) return 'today';
    if (pathname.includes('alerts')) return 'alerts';
    return 'index';
  };

  const handleTabPress = (tab: HomeSubTab) => {
    router.push(`/(tabs)/home/${tab}` as Href);
  };

  const handleNotificationPress = () => {
    router.push('/(tabs)/home/alerts' as Href);
  };

  return (
    <SafeAreaView className="flex-1 bg-paper-200" edges={['top']}>
      <DashboardHeader
        activeTab={getCurrentTab()}
        alertCount={2}
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
