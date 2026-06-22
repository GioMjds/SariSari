import { GlobalModal, Toast } from '@/components/ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { initializeDatabases } from '@/configs';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '../global.css';
import { View } from 'react-native';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

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

  useEffect(() => {
    if (!fontsLoaded) return;
  }, [fontsLoaded]);

  useEffect(() => {
    if (!fontsLoaded) return;

    (async () => {
      try {
        await initializeDatabases();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        setDbInitError(errorMessage);
        console.error('Failed to initialize database:', errorMessage);
      }
    })();
  }, [fontsLoaded]);

  useEffect(() => {
    if (fontsLoaded && !dbInitError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, dbInitError]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <SQLiteProvider databaseName="sarisari.db">
          <SafeAreaProvider>
            <StatusBar style="inverted" />
            <View style={{ flex: 1 }}>
              <Stack
                screenOptions={{
                  headerShown: false,
                  animation: 'ios_from_right',
                }}
              />
            </View>
            <Toast />
            <GlobalModal />
          </SafeAreaProvider>
        </SQLiteProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
