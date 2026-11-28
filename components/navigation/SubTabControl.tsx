import * as Haptics from 'expo-haptics';
import { StyledText } from '@/components/elements';
import { logger } from '@/lib/logger';
import { centerOffset } from '@/lib/subTabLayout';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, Pressable, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
} from 'react-native-reanimated';

export type SubTabBadgeTone = 'action' | 'info';

export interface SubTabItem<T extends string> {
  key: T;
  label: string;
  badgeCount?: number;
  badgeTone?: SubTabBadgeTone;
  badgeAccessibilityLabel?: string;
}

export interface SubTabControlProps<T extends string> {
  tabs: SubTabItem<T>[];
  activeTab: T;
  onTabPress: (tab: T) => void;
  containerClassName?: string;
  progress: SharedValue<number>;
}

const BADGE_CLAMP_LIMIT = 999;
const BADGE_DISPLAY_CAP = '999+';

function formatBadgeCount(count: number): string {
  if (count > BADGE_CLAMP_LIMIT) return BADGE_DISPLAY_CAP;
  return String(count);
}

function buildTabAccessibilityLabel(
  label: string,
  badgeCount: number | undefined,
  badgeAccessibilityLabel: string | undefined,
): string {
  if (badgeCount === undefined || badgeCount <= 0) return label;
  const noun = badgeAccessibilityLabel ?? 'notifications';
  return `${label}, ${badgeCount} ${noun}`;
}

export function SubTabControl<T extends string>({
  tabs,
  activeTab,
  onTabPress,
  containerClassName,
  progress,
}: SubTabControlProps<T>) {
  const tabCount = tabs.length;
  const resolvedContainerClassName = containerClassName ?? '';

  const xs = useSharedValue<number[]>(new Array(tabCount).fill(0));
  const widths = useSharedValue<number[]>(new Array(tabCount).fill(0));
  const measuredIndices = useRef<Set<number>>(new Set());
  const layoutRef = useRef<{ xs: number[]; widths: number[] }>({
    xs: new Array(tabCount).fill(0),
    widths: new Array(tabCount).fill(0),
  });
  const [ready, setReady] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(0);
  const scrollRef = useRef<Animated.ScrollView>(null);
  // The underline lives outside the scroller, so it must follow the scroll offset.
  const scrollX = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollX.value = e.contentOffset.x;
  });

  const reduceMotion = useReducedMotion();

  const tabKeys = tabs.map((t) => t.key).join(',');
  const prevTabKeysRef = useRef(tabKeys);
  const inputRange = useMemo(() => Array.from({ length: tabCount }, (_, i) => i), [tabCount]);

  useEffect(() => {
    if (prevTabKeysRef.current !== tabKeys) {
      prevTabKeysRef.current = tabKeys;
      measuredIndices.current.clear();
      layoutRef.current = {
        xs: new Array(tabCount).fill(0),
        widths: new Array(tabCount).fill(0),
      };
      setReady(false);
      xs.value = new Array(tabCount).fill(0);
      widths.value = new Array(tabCount).fill(0);
    }
  }, [tabKeys, tabCount, xs, widths]);

  // Keep the active tab centered; waits for a measured viewport so it never over-scrolls on mount.
  useEffect(() => {
    const index = tabKeys.split(',').indexOf(activeTab);
    const x = layoutRef.current.xs[index];
    const width = layoutRef.current.widths[index];
    if (index < 0 || !ready || x === undefined || width === undefined) return;
    const target = centerOffset(x, width, viewportWidth);
    if (target === null) return;
    scrollRef.current?.scrollTo({ x: target, animated: !reduceMotion });
  }, [activeTab, ready, viewportWidth, reduceMotion, tabKeys]);

  const handleLayout = (index: number) => (e: LayoutChangeEvent) => {
    if (index >= tabCount) return;

    const { x, width } = e.nativeEvent.layout;

    const layout = layoutRef.current;
    layout.xs[index] = x;
    layout.widths[index] = width;
    xs.value = [...layout.xs];
    widths.value = [...layout.widths];

    measuredIndices.current.add(index);
    if (measuredIndices.current.size === tabCount) setReady(true);
  };

  const handleSelect = useCallback(
    (tabKey: T) => {
      if (tabKey === activeTab) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      logger.info({
        event: 'tab_selected',
        feature: 'navigation',
        tabKey: tabKey,
        source: 'tap',
      });
      onTabPress(tabKey);
    },
    [activeTab, onTabPress],
  );

  const underlineStyle = useAnimatedStyle(() => {
    const p = progress.value;
    const baseX = interpolate(p, inputRange, xs.value, Extrapolation.CLAMP);
    const baseWidth = interpolate(
      p,
      inputRange,
      widths.value,
      Extrapolation.CLAMP,
    );
    return {
      transform: [{ translateX: baseX - scrollX.value }],
      width: baseWidth,
    };
  });

  return (
    <View accessibilityRole="tablist" className={resolvedContainerClassName}>
      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onLayout={(e) => setViewportWidth(e.nativeEvent.layout.width)}
        contentContainerStyle={{ gap: 16, paddingHorizontal: 4 }}
      >
        {tabs.map((tab, index) => {
          const isActive = activeTab === tab.key;
          const badgeVisible =
            typeof tab.badgeCount === 'number' && tab.badgeCount > 0;
          const badgeTone: SubTabBadgeTone = tab.badgeTone ?? 'action';
          return (
            <Pressable
              key={tab.key}
              onPress={() => handleSelect(tab.key)}
              onLayout={handleLayout(index)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={buildTabAccessibilityLabel(
                tab.label,
                tab.badgeCount,
                tab.badgeAccessibilityLabel,
              )}
              hitSlop={{ top: 12, bottom: 12, left: 4, right: 4 }}
              className="flex-row items-center py-2.5"
              style={{ flexShrink: 0 }}
              testID={`subtab-${tab.key}`}
            >
              {/* A hidden bold twin reserves the widest width, so selecting a tab never shifts neighbours or the underline. */}
              <View>
                <StyledText
                  variant="extrabold"
                  className="text-base opacity-0"
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                >
                  {tab.label}
                </StyledText>
                <StyledText
                  variant={isActive ? 'extrabold' : 'semibold'}
                  className={`text-base absolute inset-x-0 text-center ${
                    isActive ? 'text-ink-900' : 'text-ink-500'
                  }`}
                >
                  {tab.label}
                </StyledText>
              </View>
              {badgeVisible ? (
                <View
                  className={`ml-2 h-[18px] min-w-[18px] items-center justify-center rounded-full px-1.5 ${
                    badgeTone === 'action'
                      ? 'bg-persimmon-600'
                      : 'bg-paper-200 border border-paper-300'
                  }`}
                  accessibilityElementsHidden
                  importantForAccessibility="no"
                >
                  <StyledText
                    variant="extrabold"
                    className={`text-caption ${
                      badgeTone === 'action' ? 'text-paper-50' : 'text-ink-700'
                    }`}
                  >
                    {formatBadgeCount(tab.badgeCount as number)}
                  </StyledText>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </Animated.ScrollView>

      <View className="h-[3px] bg-paper-200 overflow-hidden">
        <Animated.View
          style={underlineStyle}
          className="absolute h-[3px] rounded-full bg-persimmon-500"
        />
      </View>
    </View>
  );
}
