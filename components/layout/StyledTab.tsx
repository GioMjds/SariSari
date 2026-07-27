import { getTabs, Tab } from '@/constants';
import { FontAwesome } from '@expo/vector-icons';
import { Href, usePathname, useRouter } from 'expo-router';
import { memo, useCallback, useMemo, useRef, useState, useEffect } from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  Keyboard,
  Platform,
  LayoutChangeEvent,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  useReducedMotion,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

export const TAB_BAR_TOTAL_OFFSET = 72;

export const TAB_BAR_RAIL_HEIGHT = 72;
export const TAB_BAR_ACTION_OVERHANG = 0;
export const TAB_BAR_MARGIN = 16;

export function getTabBarBottomOffset(bottomInset: number): number {
  return TAB_BAR_RAIL_HEIGHT + Math.max(bottomInset, TAB_BAR_MARGIN);
}

export function useTabBarBottomOffset(): number {
  const insets = useSafeAreaInsets();
  return getTabBarBottomOffset(insets.bottom);
}

/**
 * Active icon uses persimmon-50 (nearly white on the persimmon pill).
 * Inactive icon uses high-contrast warm paper tone (#C8C0B2) - readable on cinnamon-900 background.
 */
const ICON_ACTIVE = '#FFF1EA'; // persimmon-50
const ICON_INACTIVE = '#C8C0B2'; // warm paper neutral (contrast ratio > 4.5:1 against cinnamon-900)
const SHADOW_COLOR = 'rgba(86, 78, 69, 0.15)'; // ink-muted

const getHrefString = (href: Href): string =>
  typeof href === 'object' ? href.pathname : href;

type TabLayout = { x: number; y: number; width: number; height: number };

interface TabButtonProps {
  tab: Tab;
  hrefString: string;
  isFocused: boolean;
  onPress: () => void;
  onLayoutMeasured: (key: string, focused: boolean, layout: TabLayout) => void;
}

const TabButton = memo(
  ({
    tab,
    hrefString,
    isFocused,
    onPress,
    onLayoutMeasured,
  }: TabButtonProps) => {
    const scale = useSharedValue(1);
    const shouldReduceMotion = useReducedMotion();

    const animatedIconStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    const handleLayout = useCallback(
      (e: LayoutChangeEvent) => {
        const { x, y, width, height } = e.nativeEvent.layout;
        onLayoutMeasured(hrefString, isFocused, { x, y, width, height });
      },
      [hrefString, isFocused, onLayoutMeasured],
    );

    const handlePressIn = useCallback(() => {
      if (!shouldReduceMotion) {
        scale.value = withSpring(0.92, { damping: 16, stiffness: 350 });
      }
    }, [scale, shouldReduceMotion]);

    const handlePressOut = useCallback(() => {
      if (!shouldReduceMotion) {
        scale.value = withSpring(1, { damping: 16, stiffness: 350 });
      }
    }, [scale, shouldReduceMotion]);

    return (
      <TouchableOpacity
        accessibilityRole="tab"
        accessibilityLabel={tab.name}
        accessibilityState={{ selected: isFocused }}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        onLayout={handleLayout}
        className="items-center justify-center flex-1 py-1"
        style={{ minWidth: 48, minHeight: 48 }}
      >
        <Animated.View
          className="items-center justify-center px-1"
          style={animatedIconStyle}
        >
          <FontAwesome
            name={tab.icon}
            size={26}
            color={isFocused ? ICON_ACTIVE : ICON_INACTIVE}
          />
          <Text
            numberOfLines={1}
            className="text-sm font-bold mt-0.5 text-center"
            style={{ color: isFocused ? ICON_ACTIVE : ICON_INACTIVE }}
          >
            {tab.name}
          </Text>
        </Animated.View>
      </TouchableOpacity>
    );
  },
);

TabButton.displayName = 'TabButton';

export const StyledTab = memo(() => {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const shouldReduceMotion = useReducedMotion();

  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);

  const pathnameRef = useRef(pathname);
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  const activeLayout = useSharedValue<TabLayout>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const indicatorOpacity = useSharedValue(0);
  const layouts = useRef<Record<string, TabLayout>>({});

  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, () =>
      setKeyboardVisible(true),
    );
    const hideSubscription = Keyboard.addListener(hideEvent, () =>
      setKeyboardVisible(false),
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  useEffect(() => {
    const duration = shouldReduceMotion ? 0 : 200;
    translateY.value = withTiming(keyboardVisible ? 160 : 0, { duration });
    opacity.value = withTiming(keyboardVisible ? 0 : 1, { duration });
  }, [keyboardVisible, translateY, opacity, shouldReduceMotion]);

  const wrapperAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const indicatorStyle = useAnimatedStyle(() => {
    const layout = activeLayout.value;
    return {
      transform: [{ translateX: layout.x }, { translateY: layout.y }],
      width: layout.width,
      height: layout.height,
      opacity: indicatorOpacity.value,
    };
  });

  const visibleRoutes = useMemo<Tab[]>(() => getTabs(t).slice(0, 5), [t]);

  const isRouteFocused = useCallback((hrefString: string) => {
    const currentPath = pathnameRef.current;
    return hrefString === '/' || hrefString === '/home'
      ? currentPath === '/' ||
          currentPath === '' ||
          currentPath === '/home' ||
          currentPath.startsWith('/home/') ||
          currentPath.startsWith('/(tabs)/home')
      : currentPath === hrefString || currentPath.startsWith(`${hrefString}/`);
  }, []);

  const moveIndicatorTo = useCallback(
    (key: string) => {
      const layout = layouts.current[key];
      if (layout) {
        if (shouldReduceMotion) {
          activeLayout.value = layout;
          indicatorOpacity.value = 1;
        } else {
          activeLayout.value = withSpring(layout, {
            damping: 22,
            stiffness: 320,
            mass: 0.5,
          }) as unknown as TabLayout;
          indicatorOpacity.value = withTiming(1, { duration: 100 });
        }
      }
    },
    [activeLayout, indicatorOpacity, shouldReduceMotion],
  );

  useEffect(() => {
    const activeTab = visibleRoutes.find((tab) =>
      isRouteFocused(getHrefString(tab.href)),
    );
    if (activeTab) {
      moveIndicatorTo(getHrefString(activeTab.href));
    } else {
      indicatorOpacity.value = withTiming(0, { duration: shouldReduceMotion ? 0 : 120 });
    }
  }, [
    pathname,
    visibleRoutes,
    isRouteFocused,
    moveIndicatorTo,
    indicatorOpacity,
    shouldReduceMotion,
  ]);

  const onLayoutMeasured = useCallback(
    (key: string, focused: boolean, layout: TabLayout) => {
      layouts.current[key] = layout;
      if (focused) moveIndicatorTo(key);
    },
    [moveIndicatorTo],
  );

  const handlePress = useCallback(
    (href: Href) => {
      const hrefString = getHrefString(href);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      if (!isRouteFocused(hrefString)) {
        router.navigate(href);
      }
    },
    [isRouteFocused, router],
  );

  const bottomInset = Math.max(insets.bottom, TAB_BAR_MARGIN);

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          bottom: bottomInset,
          left: 16,
          right: 16,
          zIndex: 1000,
        },
        wrapperAnimatedStyle,
      ]}
      pointerEvents={keyboardVisible ? 'none' : 'auto'}
    >
      <View
        accessibilityRole="tablist"
        className="bg-cinnamon-900 border border-cinnamon-800/80 rounded-[16px] flex-row justify-evenly items-center"
        style={{
          height: 56,
          paddingHorizontal: 4,
          shadowColor: SHADOW_COLOR,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.12,
          shadowRadius: 6,
          elevation: 3,
        }}
      >
        <Animated.View
          pointerEvents="none"
          className="absolute bg-persimmon-500 rounded-[12px]"
          style={[{ top: 0, left: 0 }, indicatorStyle]}
        />

        {visibleRoutes.map((tab: Tab) => {
          const hrefString = getHrefString(tab.href);
          const isFocused = isRouteFocused(hrefString);

          return (
            <TabButton
              key={hrefString}
              tab={tab}
              hrefString={hrefString}
              isFocused={isFocused}
              onPress={() => handlePress(tab.href)}
              onLayoutMeasured={onLayoutMeasured}
            />
          );
        })}
      </View>
    </Animated.View>
  );
});

StyledTab.displayName = 'StyledTab';

