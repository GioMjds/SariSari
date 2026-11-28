import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, BackHandler, StyleSheet, View } from 'react-native';
import { usePathname } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { isPrimaryTabPath } from '@/constants';
import { perfMark } from '@/configs/sqlite';
import { useTabBarBottomOffset } from './StyledTab';

const EXIT_WINDOW_MS = 2000;

/** Owns the double-back-to-exit logic so route changes do not re-render the tabs layout. */
export function ExitToast() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const tabBarOffset = useTabBarBottomOffset();
  const [visible, setVisible] = useState(false);
  const lastBackRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fade = useRef(new Animated.Value(0)).current;

  const clearTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const hide = useCallback(() => {
    clearTimer();
    lastBackRef.current = 0;
    Animated.timing(fade, { toValue: 0, duration: 150, useNativeDriver: true }).start(
      () => setVisible(false),
    );
  }, [fade, clearTimer]);

  const show = useCallback(() => {
    setVisible(true);
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    clearTimer();
    timerRef.current = setTimeout(hide, EXIT_WINDOW_MS);
  }, [fade, hide, clearTimer]);

  useEffect(() => {
    hide();
    perfMark(`route ${pathname}`);
  }, [pathname, hide]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!isPrimaryTabPath(pathname)) return false;
      const now = Date.now();
      if (lastBackRef.current > 0 && now - lastBackRef.current < EXIT_WINDOW_MS) {
        clearTimer();
        lastBackRef.current = 0;
        BackHandler.exitApp();
        return true;
      }
      lastBackRef.current = now;
      show();
      return true;
    });
    return () => {
      sub.remove();
      clearTimer();
    };
  }, [pathname, show, clearTimer]);

  if (!visible) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.container, { opacity: fade, bottom: tabBarOffset + 12 }]}
    >
      <View style={styles.card}>
        <StyledText variant="medium" style={styles.text}>
          {t('common:exitToast')}
        </StyledText>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    elevation: 999,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
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
  text: { color: '#F7F6F2', fontSize: 13, textAlign: 'center' },
});
