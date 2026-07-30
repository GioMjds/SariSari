import { StyledTab, StoreHeader } from '@/components/layout';
import { StyledText } from '@/components/elements';
import { Tabs, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, BackHandler, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { isPrimaryTabPath } from '@/constants';

export default function ScreensLayout() {
  const pathname = usePathname();
  const [toastVisible, setToastVisible] = useState(false);
  const lastBackPressedRef = useRef<number>(0);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const hideExitToast = useCallback(() => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    lastBackPressedRef.current = 0;
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setToastVisible(false);
    });
  }, [fadeAnim]);

  const showExitToast = useCallback(() => {
    setToastVisible(true);
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }

    toastTimerRef.current = setTimeout(() => {
      hideExitToast();
    }, 2000);
  }, [fadeAnim, hideExitToast]);

  useEffect(() => {
    // Reset back press state & dismiss toast whenever screen/pathname changes
    hideExitToast();
  }, [pathname, hideExitToast]);

  useEffect(() => {
    const backAction = () => {
      if (isPrimaryTabPath(pathname)) {
        const now = Date.now();
        if (
          lastBackPressedRef.current > 0 &&
          now - lastBackPressedRef.current < 2000
        ) {
          if (toastTimerRef.current) {
            clearTimeout(toastTimerRef.current);
            toastTimerRef.current = null;
          }
          lastBackPressedRef.current = 0;
          setToastVisible(false);
          fadeAnim.setValue(0);
          BackHandler.exitApp();
          return true;
        }

        lastBackPressedRef.current = now;
        showExitToast();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => {
      backHandler.remove();
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, [pathname, showExitToast, hideExitToast, fadeAnim]);

  return (
    <SafeAreaView className="flex-1 bg-paper-200" edges={['top']}>
      <StatusBar style="dark" backgroundColor="#F7F6F2" />
      <StoreHeader />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: 'none' },
          lazy: true,
        }}
      />
      <StyledTab />

      {toastVisible && (
        <Animated.View
          pointerEvents="none"
          style={[styles.toastContainer, { opacity: fadeAnim }]}
          className="absolute bottom-20 left-4 right-4 items-center justify-center z-50"
        >
          <View
            style={styles.toastCard}
            className="bg-ink-900/90 px-4 py-2.5 rounded-full flex-row items-center border border-paper-400/20 shadow-lg"
          >
            <StyledText
              variant="medium"
              style={styles.toastText}
              className="text-paper-100 text-xs text-center"
            >
              Press back again to exit
            </StyledText>
          </View>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    right: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    elevation: 999,
  },
  toastCard: {
    backgroundColor: 'rgba(30, 27, 24, 0.92)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  toastText: {
    color: '#F7F6F2',
    fontSize: 13,
    textAlign: 'center',
  },
});
