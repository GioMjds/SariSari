import { getTabs, Tab } from '@/constants';
import { FontAwesome } from '@expo/vector-icons';
import { Href, usePathname, useRouter } from 'expo-router';
import { memo, useCallback, useMemo, useState, useEffect } from 'react';
import { TouchableOpacity, View, Keyboard, Platform } from 'react-native';
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
export const TAB_BAR_MARGIN = 50;

export function getTabBarBottomOffset(bottomInset: number): number {
  return TAB_BAR_RAIL_HEIGHT + Math.max(bottomInset, TAB_BAR_MARGIN);
}

export function useTabBarBottomOffset(): number {
  const insets = useSafeAreaInsets();
  return getTabBarBottomOffset(insets.bottom);
}

const ACTIVE_COLOR = '#E85A1F';
const INACTIVE_COLOR = '#C8C0B2';

const SHADOW_COLOR = 'rgba(86, 78, 69, 0.15)';

const getHrefString = (href: Href): string =>
  typeof href === 'object' ? href.pathname : href;

interface TabButtonProps {
  tab: Tab;
  isFocused: boolean;
  onPress: () => void;
}

const TabButton = memo(({ tab, isFocused, onPress }: TabButtonProps) => {
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

  const color = isFocused ? ACTIVE_COLOR : INACTIVE_COLOR;

  return (
    <TouchableOpacity
      accessibilityRole="tab"
      accessibilityLabel={tab.name}
      accessibilityState={{ selected: isFocused }}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.9}
      className="items-center justify-center flex-1 py-1"
      style={{ minWidth: 48, minHeight: 48 }}
    >
      <View className="items-center justify-center px-1">
        <FontAwesome name={tab.icon} size={36} color={color} />
      </View>
    </TouchableOpacity>
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
    translateY.value = withTiming(keyboardVisible ? 160 : 0, { duration });
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
          height: 64,
          paddingHorizontal: 8,
          shadowColor: SHADOW_COLOR,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.12,
          shadowRadius: 6,
          elevation: 3,
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
              onPress={() => handlePress(tab.href)}
            />
          );
        })}
      </View>
    </Animated.View>
  );
});

StyledTab.displayName = 'StyledTab';
