import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, usePathname, Href } from 'expo-router';
import { TopTabs } from '@/components/navigation';
import {
  DashboardHeader,
  HomeSubTab,
} from '@/components/dashboard';

export default function HomeLayout() {
  const router = useRouter();
  const pathname = usePathname();

  const getCurrentTab = (): HomeSubTab => {
    if (pathname.includes('today')) return 'today';
    if (pathname.includes('alerts')) return 'alerts';
    return 'overview';
  };

  const handleTabPress = (tab: HomeSubTab) => {
    router.push(`/(tabs)/home/${tab}` as Href);
  };

  const handleSettingsPress = () => {
    router.push('/settings' as Href);
  };

  return (
    <SafeAreaView className="flex-1 bg-cinnamon-500" edges={['top']}>
      <DashboardHeader
        activeTab={getCurrentTab()}
        alertCount={2}
        onTabPress={handleTabPress}
        onSettingsPress={handleSettingsPress}
      />
      <View className="flex-1 bg-paper-200">
        <TopTabs
          screenOptions={{
            tabBarStyle: { display: 'none' },
            swipeEnabled: true,
          }}
        >
          <TopTabs.Screen name="overview" />
          <TopTabs.Screen name="today" />
          <TopTabs.Screen name="alerts" />
        </TopTabs>
      </View>
    </SafeAreaView>
  );
}
