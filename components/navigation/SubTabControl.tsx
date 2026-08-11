import { useCallback, useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, Pressable, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import * as Haptics from 'expo-haptics';
import { StyledText } from '@/components/elements';
import { logger } from '@/lib/logger';

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
  progress?: SharedValue<number>;
  dragToSwitch?: boolean;
  dragThreshold?: number;
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
  dragToSwitch = true,
  dragThreshold = 40,
}: SubTabControlProps<T>) {
  const tabCount = tabs.length;
  const resolvedContainerClassName = containerClassName ?? '';

  const xs = useSharedValue<number[]>(new Array(tabCount).fill(0));
  const widths = useSharedValue<number[]>(new Array(tabCount).fill(0));
  const layoutVersion = useSharedValue(0);
  const measuredIndices = useRef<Set<number>>(new Set());
  const [ready, setReady] = useState(false);

  const internalProgress = useSharedValue(0);
  const activeIndexShared = useSharedValue(0);
  const coldMountSeededRef = useRef(false);

  const initialActiveIndex = Math.max(
    0,
    tabs.findIndex((t) => t.key === activeTab),
  );
  if (!coldMountSeededRef.current) {
    coldMountSeededRef.current = true;
    internalProgress.value = initialActiveIndex;
    activeIndexShared.value = initialActiveIndex;
  }

  const tabKeys = tabs.map((t) => t.key).join(',');
  const prevTabKeysRef = useRef(tabKeys);

  useEffect(() => {
    if (prevTabKeysRef.current !== tabKeys) {
      prevTabKeysRef.current = tabKeys;
      measuredIndices.current.clear();
      setReady(false);
      xs.value = new Array(tabCount).fill(0);
      widths.value = new Array(tabCount).fill(0);
    }
  }, [tabKeys, tabCount, xs, widths]);

  useEffect(() => {
    const index = tabs.findIndex((t) => t.key === activeTab);
    if (index < 0) return;
    activeIndexShared.value = index;
    if (!progress) {
      internalProgress.value = ready
        ? withTiming(index, { duration: 200 })
        : index;
    }
  }, [activeTab, progress, ready, activeIndexShared, internalProgress, tabs]);

  const handleLayout = (index: number) => (e: LayoutChangeEvent) => {
    if (index >= tabCount) return;

    const { x, width } = e.nativeEvent.layout;

    const nextXs = [...xs.value];
    nextXs[index] = x;
    xs.value = nextXs;

    const nextWidths = [...widths.value];
    nextWidths[index] = width;
    widths.value = nextWidths;

    measuredIndices.current.add(index);
    layoutVersion.value += 1;

    if (measuredIndices.current.size === tabCount) {
      const activeIndex = tabs.findIndex((t) => t.key === activeTab);
      if (activeIndex >= 0) {
        activeIndexShared.value = activeIndex;
      }
      setReady(true);
    }
  };

  const handleSelect = useCallback(
    (tabKey: T, source: 'tap' | 'gesture') => {
      if (tabKey === activeTab) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      logger.info({
        event: 'tab_selected',
        feature: 'navigation',
        tabKey: tabKey,
        source,
      });
      onTabPress(tabKey);
    },
    [activeTab, onTabPress],
  );

  const panGesture = Gesture.Pan()
    .enabled(!progress && dragToSwitch)
    .activeOffsetX([-10, 10])
    .failOffsetY([-10, 10])
    .onEnd((event) => {
      const advancing =
        event.translationX < -dragThreshold &&
        activeIndexShared.value < tabCount - 1;
      const retreating =
        event.translationX > dragThreshold && activeIndexShared.value > 0;

      if (advancing || retreating) {
        const nextIndex = activeIndexShared.value + (advancing ? 1 : -1);
        activeIndexShared.value = nextIndex;
        internalProgress.value = withTiming(nextIndex, { duration: 200 });
        const nextKey = tabs[nextIndex]?.key;
        if (nextKey !== undefined) {
          scheduleOnRN(handleSelect, nextKey, 'gesture');
        }
      }
    });

  const underlineStyle = useAnimatedStyle(() => {
    const p = progress ? progress.value : internalProgress.value;
    const inputRange = tabs.map((_, i) => i);
    const baseX = interpolate(p, inputRange, xs.value, Extrapolation.CLAMP);
    const baseWidth = interpolate(
      p,
      inputRange,
      widths.value,
      Extrapolation.CLAMP,
    );
    return {
      transform: [{ translateX: baseX }],
      width: baseWidth,
    };
  });

  return (
    <View accessibilityRole="tablist" className={resolvedContainerClassName}>
      <GestureDetector gesture={panGesture}>
        <View className="flex-row gap-4">
          {tabs.map((tab, index) => {
            const isActive = activeTab === tab.key;
            const badgeVisible =
              typeof tab.badgeCount === 'number' && tab.badgeCount > 0;
            const badgeTone: SubTabBadgeTone = tab.badgeTone ?? 'action';
            return (
              <Pressable
                key={tab.key}
                onPress={() => handleSelect(tab.key, 'tap')}
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
                testID={`subtab-${tab.key}`}
              >
                <StyledText
                  variant={isActive ? 'extrabold' : 'semibold'}
                  className={`text-base ${
                    isActive ? 'text-ink-900' : 'text-ink-500'
                  }`}
                >
                  {tab.label}
                </StyledText>
                {badgeVisible ? (
                  <View
                    className={`ml-2 h-[18px] min-w-[18px] items-center justify-center rounded-full px-1.5 ${
                      badgeTone === 'action'
                        ? 'bg-persimmon-500'
                        : 'bg-paper-200 border border-paper-300'
                    }`}
                    accessibilityElementsHidden
                    importantForAccessibility="no"
                  >
                    <StyledText
                      variant="extrabold"
                      className={`text-[11px] ${
                        badgeTone === 'action'
                          ? 'text-paper-50'
                          : 'text-ink-700'
                      }`}
                    >
                      {formatBadgeCount(tab.badgeCount as number)}
                    </StyledText>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </GestureDetector>

      <View className="h-[3px] bg-paper-200">
        <Animated.View
          style={underlineStyle}
          className="absolute h-[3px] rounded-full bg-persimmon-500"
        />
      </View>
    </View>
  );
}
