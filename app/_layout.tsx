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
import { useCallback, useEffect, useState } from 'react';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View } from 'react-native';
import '../global.css';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5000,
    },
  },
});

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
  const [i18nReady, setI18nReady] = useState<boolean>(false);

  const runDbInit = useCallback(async () => {
    setDbInitError(null);
    try {
      await initializeDatabases();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      setDbInitError(errorMessage);
      console.error('Failed to initialize database:', errorMessage);
    }
  }, []);

  /**
   * Initialize i18n separately from the DB so a malformed locale JSON
   * never surfaces as a "Database Error" screen. If i18n init fails for
   * any reason we log and continue — `react-i18next` falls back to its
   * `fallbackLng: 'en'` so the user still sees English.
   */
  const runI18nInit = useCallback(async () => {
    try {
      await initI18n();
      setI18nReady(true);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error';
      console.warn('Failed to initialize i18n, falling back to English:', message);
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
    NavigationBar.setBackgroundColorAsync('#EFE6D2');
  }, []);

  const CustomTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: '#EFE6D2', // Sets the fallback background for all screens
    },
  };

  // When the DB fails to initialize, fail loud. Don't render the Stack —
  // a partially-mounted navigator on top of a broken DB would render
  // empty screens that look "fine" until the user tries an action.
  if (dbInitError) {
    return (
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#EFE6D2' }}>
        <SafeAreaProvider>
          <StatusBar style="dark" backgroundColor="#EFE6D2" />
          <DatabaseErrorScreen message={dbInitError} onRetry={runDbInit} />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <ThemeProvider value={CustomTheme}>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#EFE6D2' }}>
        <QueryClientProvider client={queryClient}>
          <SafeAreaProvider>
            <View style={{ flex: 1, backgroundColor: '#EFE6D2' }}>
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: '#EFE6D2' },
                }}
              />
            </View>
            <Toast />
            <GlobalModal />
          </SafeAreaProvider>
        </QueryClientProvider>
      </GestureHandlerRootView>
    </ThemeProvider>
  );
}
