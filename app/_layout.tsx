import '../global.css';
import '@/lib/css-interop';
import { useEffect } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as NavigationBar from 'expo-navigation-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from 'react-native-reanimated';
import { PortalHost } from '@rn-primitives/portal';
import { GlobalModal, Toast } from '@/components/ui';
import { DatabaseErrorScreen } from '@/components/system/DatabaseErrorScreen';
import { CloudNewerBanner } from '@/components/settings/backup';
import { OwnerPinGuardProvider } from '@/components/auth/OwnerPinGuardProvider';
import { AppLockGate } from '@/components/auth/AppLockGate';
import { useAppBootstrap } from '@/hooks/useAppBootstrap';
import { useAppLockOnResume } from '@/hooks/useAppLockOnResume';
import { useBackupScheduler } from '@/hooks/useBackupScheduler';
import { useCloudNewerBanner } from '@/hooks/useCloudNewerBanner';
import { NAV_THEME } from '@/lib/theme';

configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

// Keep the splash up until useAppBootstrap hides it.
SplashScreen.preventAutoHideAsync();

const PAGE_BG = '#F7F6F2';
const FILL_PAGE = { flex: 1, backgroundColor: PAGE_BG } as const;

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 5000 } },
});

function BackupBanner() {
  const { dismissed, restore, dismiss } = useCloudNewerBanner();
  if (dismissed) return null;
  return <CloudNewerBanner onRestorePress={restore} onDismiss={dismiss} />;
}

export default function RootLayout() {
  const { uiReady, dbReady, dbInitError, retryDb } = useAppBootstrap();

  useEffect(() => {
    void NavigationBar.setButtonStyleAsync('dark').catch(() => {});
  }, []);

  useAppLockOnResume(uiReady && dbReady);
  useBackupScheduler(uiReady && dbReady);

  if (dbInitError) {
    return (
      <GestureHandlerRootView style={FILL_PAGE}>
        <SafeAreaProvider>
          <StatusBar style="dark" backgroundColor={PAGE_BG} />
          <DatabaseErrorScreen message={dbInitError} onRetry={retryDb} />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <ThemeProvider value={NAV_THEME.light}>
      <GestureHandlerRootView style={FILL_PAGE}>
        <KeyboardProvider>
          <QueryClientProvider client={queryClient}>
            <SafeAreaProvider>
              <OwnerPinGuardProvider isReady={dbReady}>
                <AppLockGate isReady={dbReady}>
                  <View style={FILL_PAGE}>
                    <Stack
                      screenOptions={{
                        headerShown: false,
                        contentStyle: { backgroundColor: PAGE_BG },
                      }}
                    />
                    <PortalHost />
                    {uiReady ? <BackupBanner /> : null}
                  </View>
                  <Toast />
                  <GlobalModal />
                </AppLockGate>
              </OwnerPinGuardProvider>
            </SafeAreaProvider>
          </QueryClientProvider>
        </KeyboardProvider>
      </GestureHandlerRootView>
    </ThemeProvider>
  );
}
