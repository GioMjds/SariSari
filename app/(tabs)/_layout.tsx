import { ExitToast, StyledTab, StoreHeader } from '@/components/layout';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Prof } from '@/utils/perf';

const TABS_SCREEN_OPTIONS = {
  headerShown: false,
  tabBarStyle: { display: 'none' as const },
  lazy: true,
  freezeOnBlur: true,
} as const;

// Stateless on purpose: route and toast state live in ExitToast so this never re-renders.
export default function ScreensLayout() {
  return (
    <SafeAreaView className="flex-1 bg-paper-200" edges={['top']}>
      <StatusBar style="dark" backgroundColor="#F7F6F2" />
      <Prof id="StoreHeader">
        <StoreHeader />
      </Prof>
      <Prof id="TabScreens">
        <Tabs screenOptions={TABS_SCREEN_OPTIONS} initialRouteName="home" />
      </Prof>
      <Prof id="StyledTab">
        <StyledTab />
      </Prof>
      <ExitToast />
    </SafeAreaView>
  );
}
