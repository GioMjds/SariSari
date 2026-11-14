import { getTabs, Tab } from '@/constants';
import {
  Home,
  Sales,
  Inventory,
  Customers,
  More,
  type TabIconProps,
} from '../elements';
import type { ComponentType } from 'react';
import { Href, usePathname, useRouter } from 'expo-router';
import { memo, useCallback, useMemo, useState, useEffect } from 'react';
import { Pressable, View, Keyboard, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyledText } from '../elements';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  useReducedMotion,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useProducts } from '@/hooks/useProducts';
import { useCreditKPIs } from '@/hooks/useCredits';

export const TAB_BAR_TOTAL_OFFSET = 68;
export const TAB_BAR_RAIL_HEIGHT = 68;
export const TAB_BAR_ACTION_OVERHANG = 0;
export const TAB_BAR_MARGIN = 8;

export function getTabBarBottomOffset(bottomInset: number): number {
  return TAB_BAR_RAIL_HEIGHT + Math.max(bottomInset, TAB_BAR_MARGIN);
}

export function useTabBarBottomOffset(): number {
  const insets = useSafeAreaInsets();
  return getTabBarBottomOffset(insets.bottom);
}

const ACTIVE_COLOR = '#FFFFFF';
const INACTIVE_COLOR = '#C8C0B2';
const ACTIVE_LABEL_COLOR = '#FFFFFF';
const INACTIVE_LABEL_COLOR = '#C8C0B2';
const ACTIVE_PILL_COLOR = '#E85A1F';
const BADGE_COLOR = '#C62828';
const BAR_COLOR = '#150903';
const LOW_STOCK_THRESHOLD = 5;

const TAB_ROOTS: Record<string, Href> = {
  '/sales': '/(tabs)/sales/pos' as Href,
  '/inventory': '/(tabs)/inventory/products' as Href,
  '/customers': '/(tabs)/customers/all' as Href,
};

const getHrefString = (href: Href): string =>
  typeof href === 'object' ? href.pathname : href;

interface TabButtonProps {
  tab: Tab;
  isFocused: boolean;
  badge?: number;
  onPress: () => void;
}

const TAB_ICONS: Record<string, ComponentType<TabIconProps>> = {
  '/home': Home,
  '/sales': Sales,
  '/inventory': Inventory,
  '/customers': Customers,
  '/more': More,
};

const TabButton = memo(({ tab, isFocused, badge = 0, onPress }: TabButtonProps) => {
  const scale = useSharedValue(1);
  const shouldReduceMotion = useReducedMotion();

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

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const color = isFocused ? ACTIVE_COLOR : INACTIVE_COLOR;

  const hrefString = getHrefString(tab.href);
  const Icon = TAB_ICONS[hrefString] ?? More;

  const badgeLabel = badge > 99 ? '99+' : String(badge);

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={badge > 0 ? `${tab.name}, ${badgeLabel}` : tab.name}
      accessibilityState={{ selected: isFocused }}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      android_ripple={{ color: 'rgba(255,255,255,0.12)', borderless: false }}
      className="flex-1 items-center justify-center"
      style={{ height: TAB_BAR_RAIL_HEIGHT, minWidth: 48 }}
    >
      <View style={{ alignItems: 'center' }}>
        <Animated.View
          className="items-center justify-center rounded-full"
          style={[
            {
              width: 64,
              height: 36,
              backgroundColor: isFocused ? ACTIVE_PILL_COLOR : 'transparent',
            },
            pressStyle,
          ]}
        >
          <Icon size={28} color={color} />
          {badge > 0 && (
            <View
              style={{
                position: 'absolute',
                top: -2,
                right: 4,
                minWidth: 18,
                height: 18,
                paddingHorizontal: 4,
                borderRadius: 9,
                backgroundColor: BADGE_COLOR,
                borderWidth: 2,
                borderColor: BAR_COLOR,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <StyledText
                variant="extrabold"
                style={{ fontSize: 10, lineHeight: 12, color: '#FFFFFF' }}
              >
                {badgeLabel}
              </StyledText>
            </View>
          )}
        </Animated.View>
        <StyledText
          variant={isFocused ? 'extrabold' : 'medium'}
          style={{
            fontSize: 13,
            lineHeight: 16,
            marginTop: 2,
            color: isFocused ? ACTIVE_LABEL_COLOR : INACTIVE_LABEL_COLOR,
          }}
          numberOfLines={1}
        >
          {tab.name}
        </StyledText>
      </View>
    </Pressable>
  );
});

TabButton.displayName = 'TabButton';

export function isPathFocused(
  targetHref: string,
  currentPathname: string,
): boolean {
  const normalize = (p: string) => {
    let clean = p.replace(/^\/\(tabs\)/, '');
    if (!clean || clean === '/' || clean === '/index') {
      return '/home';
    }
    if (!clean.startsWith('/')) {
      clean = '/' + clean;
    }
    return clean;
  };

  const normCurrent = normalize(currentPathname);
  const normTarget = normalize(targetHref);

  return normCurrent === normTarget || normCurrent.startsWith(`${normTarget}/`);
}

export const StyledTab = memo(() => {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const shouldReduceMotion = useReducedMotion();

  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);

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
    translateY.value = withTiming(keyboardVisible ? 200 : 0, { duration });
    opacity.value = withTiming(keyboardVisible ? 0 : 1, { duration });
  }, [keyboardVisible, translateY, opacity, shouldReduceMotion]);

  const wrapperAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const visibleRoutes = useMemo<Tab[]>(() => getTabs(t).slice(0, 5), [t]);

  const isRouteFocused = useCallback(
    (hrefString: string) => isPathFocused(hrefString, pathname),
    [pathname],
  );

  const { getAllProductsQuery } = useProducts();
  const { data: creditKpis } = useCreditKPIs();

  const badges = useMemo<Record<string, number>>(() => {
    const lowStock = (getAllProductsQuery.data ?? []).filter(
      (p) => p.quantity <= LOW_STOCK_THRESHOLD,
    ).length;
    return {
      '/inventory': lowStock,
      '/customers': creditKpis?.overdueCount ?? 0,
    };
  }, [getAllProductsQuery.data, creditKpis?.overdueCount]);

  const handlePress = useCallback(
    (href: Href) => {
      const hrefString = getHrefString(href);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      if (!isRouteFocused(hrefString)) {
        router.navigate(href);
        return;
      }
      const root = TAB_ROOTS[hrefString];
      if (root && !isPathFocused(getHrefString(root), pathname)) {
        router.navigate(root);
      }
    },
    [isRouteFocused, router, pathname],
  );

  const bottomInset = Math.max(insets.bottom, TAB_BAR_MARGIN);

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
        },
        wrapperAnimatedStyle,
      ]}
      pointerEvents={keyboardVisible ? 'none' : 'auto'}
    >
      <View
        accessibilityRole="tablist"
        className="bg-cinnamon-900 border-t border-cinnamon-800 flex-row items-center"
        style={{
          paddingBottom: bottomInset,
          paddingHorizontal: 4,
          elevation: 8,
        }}
      >
        {visibleRoutes.map((tab: Tab) => {
          const hrefString = getHrefString(tab.href);
          const isFocused = isRouteFocused(hrefString);

          return (
            <TabButton
              key={hrefString}
              tab={tab}
              isFocused={isFocused}
              badge={badges[hrefString] ?? 0}
              onPress={() => handlePress(tab.href)}
            />
          );
        })}
      </View>
    </Animated.View>
  );
});

StyledTab.displayName = 'StyledTab';
