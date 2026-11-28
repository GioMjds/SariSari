import { useCallback, useEffect, useState } from 'react';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { initializeDatabases } from '@/configs';
import { initI18n } from '@/lib/i18n';

const FONTS = {
  'StackSansText-Regular': require('../assets/fonts/StackSansText-Regular.ttf'),
  'StackSansText-ExtraLight': require('../assets/fonts/StackSansText-ExtraLight.ttf'),
  'StackSansText-Light': require('../assets/fonts/StackSansText-Light.ttf'),
  'StackSansText-Medium': require('../assets/fonts/StackSansText-Medium.ttf'),
  'StackSansText-SemiBold': require('../assets/fonts/StackSansText-SemiBold.ttf'),
  'StackSansText-Bold': require('../assets/fonts/StackSansText-Bold.ttf'),
};

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Unknown error';

/** Loads fonts, database and i18n, and hides the splash once the UI can render. */
export function useAppBootstrap() {
  const [fontsLoaded] = useFonts(FONTS);
  const [dbReady, setDbReady] = useState(false);
  const [dbInitError, setDbInitError] = useState<string | null>(null);
  const [i18nReady, setI18nReady] = useState(false);

  const retryDb = useCallback(async () => {
    setDbInitError(null);
    setDbReady(false);
    try {
      await initializeDatabases();
      setDbReady(true);
    } catch (error) {
      const message = errorMessage(error);
      setDbInitError(message);
      console.error('Failed to initialize database:', message);
    }
  }, []);

  useEffect(() => {
    if (!fontsLoaded) return;
    void retryDb();
    initI18n()
      .catch((error) =>
        console.warn(
          'Failed to initialize i18n, falling back to English:',
          errorMessage(error),
        ),
      )
      .finally(() => setI18nReady(true));
  }, [fontsLoaded, retryDb]);

  const uiReady = fontsLoaded && i18nReady;

  useEffect(() => {
    if (uiReady) void SplashScreen.hideAsync();
  }, [uiReady]);

  return { uiReady, dbReady, dbInitError, retryDb };
}
