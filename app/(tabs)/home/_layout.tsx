import { Href, usePathname, useRouter } from 'expo-router';
import { SubTabScreenShell } from '@/components/layout/SubTabScreenShell';
import { DashboardHeader, HomeSubTab } from '@/components/home';
import { TopTabs } from '@/components/navigation/top-tabs';
import { useHomeDashboardData } from '@/hooks/useHomeDashboardData';
import { useTabProgress } from '@/hooks';
import { HOME_SUB_TABS, type HomeSubTab as HomeTabKey } from '@/constants/tabs';

const HOME_TAB_DEFS: { key: HomeTabKey; label: string }[] = [
  { key: 'overview', label: 'OVERVIEW' },
  { key: 'today', label: 'TODAY' },
];

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

  const activeTab: HomeSubTab = pathname.includes('today')
    ? 'today'
    : 'overview';

  const progress = useTabProgress(activeTab, HOME_SUB_TABS);

  const handleTabPress = (tab: HomeTabKey) => {
    if (tab === 'overview') {
      router.push('/(tabs)/home' as Href);
    } else {
      router.push(`/(tabs)/home/${tab}` as Href);
    }
  };

  return (
    <SubTabScreenShell<HomeTabKey>
      tabs={HOME_TAB_DEFS}
      activeTab={activeTab}
      onTabPress={handleTabPress}
      progress={progress}
      topSlot={
        <DashboardHeader
          storeName={storeName || ''}
          ownerInitials={ownerInitials || ''}
          showTopHeader={true}
        />
      }
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