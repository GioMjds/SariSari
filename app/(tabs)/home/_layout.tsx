import { Href, usePathname, useRouter } from 'expo-router';
import { SubTabScreenShell } from '@/components/layout/SubTabScreenShell';
import { HomeSubTab } from '@/components/home';
import { TopTabs } from '@/components/navigation/top-tabs';
import { useTabProgress } from '@/hooks';
import { HOME_SUB_TABS, type HomeSubTab as HomeTabKey } from '@/constants/tabs';

const HOME_TAB_DEFS = [
  { key: 'overview', label: 'OVERVIEW' },
  { key: 'today', label: 'TODAY' },
] satisfies { key: HomeTabKey; label: string }[];

export default function HomeLayout() {
  const router = useRouter();
  const pathname = usePathname();

  const activeTab: HomeSubTab = pathname.endsWith('/today')
    ? 'today'
    : 'overview';

  const progress = useTabProgress(activeTab, HOME_SUB_TABS);

  const handleTabPress = (tab: HomeTabKey) => {
    router.push(`/(tabs)/home/${tab}` as Href);
  };

  return (
    <SubTabScreenShell<HomeTabKey>
      tabs={HOME_TAB_DEFS}
      activeTab={activeTab}
      onTabPress={handleTabPress}
      progress={progress}
    >
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
    </SubTabScreenShell>
  );
}
