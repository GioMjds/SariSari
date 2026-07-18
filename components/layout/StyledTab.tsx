import { getTabs, Tab } from '@/constants';
import { FontAwesome } from '@expo/vector-icons';
import { Href, usePathname, useRouter } from 'expo-router';
import { memo, useCallback, useMemo, useRef, useState, useEffect } from 'react';
import {
  TouchableOpacity,
  View,
  Keyboard,
  Platform,
  LayoutChangeEvent,
} from 'react-native';
import { StyledText } from '@/components/elements';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

/**
 * Static fallback kept for backward compatibility with non-hook consumers.
 * Prefer `useTabBarBottomOffset()` in scrollable screens for a value that
 * adapts to gesture vs. three-button navigation at runtime.
 */
export const TAB_BAR_TOTAL_OFFSET = 80;

/** Visible pill height: py-2 (8px * 2) + icon row (~46px). */
const TAB_BAR_HEIGHT = 62;

/**
 * Minimum margin between the pill bottom edge and the screen/app-window edge.
 * Applied regardless of navigation mode so the bar never hugs the very bottom.
 */
const TAB_BAR_MARGIN = 16;

/**
 * Returns the total vertical space (in dp) consumed by the tab bar from the
 * bottom of the screen, accounting for the system navigation mode:
 *
 * - **Gesture navigation** (Android / iOS home-indicator): `insets.bottom` is
 *   non-zero (16–34dp). The app window extends to the physical edge, so the
 *   pill must sit above the gesture strip → offset = height + margin + inset.
 *
 * - **Three-button navigation** (Android, non-edge-to-edge): `insets.bottom`
 *   is 0 because the app window ends at the top of the nav button bar. The
 *   pill only needs its own height plus a small visual margin.
 *
 * Use this as `bottomOffset` in `<FlatList>` / `<Pagination>` so list content
 * scrolls fully clear of the floating tab bar.
 */
export function useTabBarBottomOffset(): number {
  const insets = useSafeAreaInsets();
  // On Android three-button nav the window excludes the nav bar, so
  // insets.bottom is 0. We only need height + visual margin.
  // On gesture nav (Android / iOS) insets.bottom is the strip height and
  // must be added so the pill clears the system affordance.
  return TAB_BAR_HEIGHT + TAB_BAR_MARGIN + Math.max(insets.bottom, 0);
}

// Mirrors persimmon-500 / paper-50 / ink-300 from tailwind.config.js.
const ICON_ACTIVE = '#FBF7EE';
const ICON_INACTIVE = '#A89F90';

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

/**
 * TabButton is memoized to avoid redundant renders of inactive buttons.
 * Delegates layout event to the parent through a stable callback.
 */
const TabButton = memo(
  ({
    tab,
    hrefString,
    isFocused,
    onPress,
    onLayoutMeasured,
  }: TabButtonProps) => {
    const handleLayout = useCallback(
      (e: LayoutChangeEvent) => {
        const { x, y, width, height } = e.nativeEvent.layout;
        onLayoutMeasured(hrefString, isFocused, { x, y, width, height });
      },
      [hrefString, isFocused, onLayoutMeasured],
    );

    return (
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityState={{ selected: isFocused, disabled: isFocused }}
        onPress={onPress}
        activeOpacity={0.7}
        disabled={isFocused}
        onLayout={handleLayout}
        style={{
          paddingVertical: 4,
          paddingHorizontal: 2,
        }}
      >
        <View className="flex-row items-center py-3 px-4 rounded-full">
          <FontAwesome
            name={tab.icon}
            size={18}
            color={isFocused ? ICON_ACTIVE : ICON_INACTIVE}
          />
          {isFocused && (
            <StyledText
              variant="extrabold"
              className="text-xs text-paper-50 ml-2 font-extrabold"
              numberOfLines={1}
            >
              {tab.name}
            </StyledText>
          )}
        </View>
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

  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);

  // Keep a stable ref to the current pathname so that handlePress does not recreate
  // on every path change, preventing all 5 TabButtons from re-rendering.
  const pathnameRef = useRef(pathname);
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  // Keep track of the active indicator layout instantly with a single shared value,
  // snapping it on tab switches with no progress timeline animations.
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
    translateY.value = withTiming(keyboardVisible ? 120 : 0, { duration: 250 });
    opacity.value = withTiming(keyboardVisible ? 0 : 1, { duration: 250 });
  }, [keyboardVisible, translateY, opacity]);

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
    return hrefString === '/'
      ? currentPath === '/' || currentPath === ''
      : currentPath === hrefString || currentPath.startsWith(`${hrefString}/`);
  }, []);

  const moveIndicatorTo = useCallback(
    (key: string) => {
      const layout = layouts.current[key];
      if (layout) {
        activeLayout.value = layout;
        indicatorOpacity.value = 1;
      }
    },
    [activeLayout, indicatorOpacity],
  );

  // Re-anchor the indicator whenever the focused route changes.
  useEffect(() => {
    const activeTab = visibleRoutes.find((tab) =>
      isRouteFocused(getHrefString(tab.href)),
    );
    if (activeTab) {
      moveIndicatorTo(getHrefString(activeTab.href));
    } else {
      indicatorOpacity.value = 0;
    }
  }, [
    pathname,
    visibleRoutes,
    isRouteFocused,
    moveIndicatorTo,
    indicatorOpacity,
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
      if (!isRouteFocused(hrefString)) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        router.replace(href);
      }
    },
    [isRouteFocused, router],
  );

  // Gesture nav (Android / iOS): insets.bottom is 16–34dp and is added so
  // the pill clears the gesture strip or home indicator.
  // Three-button nav (Android, non-edge-to-edge): insets.bottom is 0 because
  // the app window already ends above the button bar — TAB_BAR_MARGIN alone
  // is enough visual breathing room.
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
        className="bg-cinnamon-900 border border-cinnamon-800 rounded-full py-2 px-2 flex-row justify-between items-center shadow-2xl"
        style={{
          shadowColor: '#150903',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.35,
          shadowRadius: 15,
          elevation: 10,
        }}
      >
        {/* Sliding highlight pill, snaps instantly to the active tab layout bounds. */}
        <Animated.View
          pointerEvents="none"
          className="absolute bg-persimmon-500 rounded-full"
          style={[{ top: 0, left: 0 }, indicatorStyle]}
        />

        {visibleRoutes.map((tab: Tab) => {
          const hrefString = getHrefString(tab.href);
          const isFocused =
            hrefString === '/'
              ? pathname === '/' || pathname === ''
              : pathname === hrefString ||
                pathname.startsWith(`${hrefString}/`);

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
