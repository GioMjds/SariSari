import '../global.css';
import { GlobalModal, Toast } from '@/components/ui';
import { DatabaseErrorScreen } from '@/components/system/DatabaseErrorScreen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { initializeDatabases } from '@/configs';
import { initI18n } from '@/lib/i18n';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as NavigationBar from 'expo-navigation-bar';
import { StatusBar } from 'expo-status-bar';
import { AppState, View } from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { consumeQueue, runStartupChecks, subscribeCounter } from '@/lib/backup';
import { useSchedulerInputs } from '@/hooks/useBackup';
import { safeNavigate } from '@/lib/navigation';
import { CloudNewerBanner } from '@/components/settings/backup';
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from 'react-native-reanimated';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { OwnerPinGuardProvider } from '@/components/auth/OwnerPinGuardProvider';

configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5000,
    },
  },
});

const CUSTOM_THEME = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#F7F6F2',
  },
} as const;

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'StackSansText-Regular': require('../assets/fonts/StackSansText-Regular.ttf'),
    'StackSansText-ExtraLight': require('../assets/fonts/StackSansText-ExtraLight.ttf'),
    'StackSansText-Light': require('../assets/fonts/StackSansText-Light.ttf'),
    'StackSansText-Medium': require('../assets/fonts/StackSansText-Medium.ttf'),
    'StackSansText-SemiBold': require('../assets/fonts/StackSansText-SemiBold.ttf'),
    'StackSansText-Bold': require('../assets/fonts/StackSansText-Bold.ttf'),
  });

  const [dbInitError, setDbInitError] = useState<string | null>(null);
  const [dbReady, setDbReady] = useState<boolean>(false);
  const [i18nReady, setI18nReady] = useState<boolean>(false);
  const schedulerInputs = useSchedulerInputs();

  const runDbInit = useCallback(async () => {
    setDbInitError(null);
    setDbReady(false);
    try {
      await initializeDatabases();
      setDbReady(true);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      setDbInitError(errorMessage);
      console.error('Failed to initialize database:', errorMessage);
    }
  }, []);

  const runI18nInit = useCallback(async () => {
    try {
      await initI18n();
      setI18nReady(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.warn(
        'Failed to initialize i18n, falling back to English:',
        message,
      );
      setI18nReady(true);
    }
  }, []);

  useEffect(() => {
    if (!fontsLoaded) return;
    runDbInit();
    runI18nInit();
  }, [fontsLoaded, runDbInit, runI18nInit]);

  useEffect(() => {
    if (fontsLoaded && i18nReady) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, i18nReady]);

  useEffect(() => {
    void NavigationBar.setButtonStyleAsync('dark').catch(() => {});
  }, []);

  useEffect(() => {
    if (!fontsLoaded || !i18nReady || !dbReady || dbInitError) return;
    void runStartupChecks(schedulerInputs);
    const unsubCounter = subscribeCounter(schedulerInputs);
    const subAppState = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void consumeQueue(schedulerInputs);
      }
    });
    return () => {
      unsubCounter();
      subAppState.remove();
    };
  }, [fontsLoaded, i18nReady, dbReady, dbInitError, schedulerInputs]);

  const [bannerDismissed, setBannerDismissed] = useState<boolean>(false);

  const handleBannerRestore = useCallback(() => {
    safeNavigate.push('/settings');
  }, []);

  const handleBannerDismiss = useCallback(async () => {
    setBannerDismissed(true);
    try {
      await AsyncStorage.setItem(
        'cloud_newer_banner_dismissed_at',
        String(Date.now()),
      );
    } catch {
      // ignore
    }
  }, []);

  if (dbInitError) {
    return (
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#F7F6F2' }}>
        <SafeAreaProvider>
          <StatusBar style="dark" backgroundColor="#F7F6F2" />
          <DatabaseErrorScreen message={dbInitError} onRetry={runDbInit} />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <ThemeProvider value={CUSTOM_THEME}>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#F7F6F2' }}>
        <KeyboardProvider>
          <QueryClientProvider client={queryClient}>
            <SafeAreaProvider>
              <OwnerPinGuardProvider isReady={dbReady}>
                <View style={{ flex: 1, backgroundColor: '#F7F6F2' }}>
                  <Stack
                    screenOptions={{
                      headerShown: false,
                      contentStyle: { backgroundColor: '#F7F6F2' },
                    }}
                  />
                  {fontsLoaded && i18nReady && !bannerDismissed ? (
                    <CloudNewerBanner
                      onRestorePress={handleBannerRestore}
                      onDismiss={handleBannerDismiss}
                    />
                  ) : null}
                </View>
                <Toast />
                <GlobalModal />
              </OwnerPinGuardProvider>
            </SafeAreaProvider>
          </QueryClientProvider>
        </KeyboardProvider>
      </GestureHandlerRootView>
    </ThemeProvider>
  );
}
