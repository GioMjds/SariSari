import { useCallback, useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, Pressable, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import * as Haptics from 'expo-haptics';
import { StyledText } from '@/components/elements';

export interface SubTabItem<T extends string> {
  key: T;
  label: string;
  badgeCount?: number;
}

export interface SubTabControlProps<T extends string> {
  tabs: SubTabItem<T>[];
  activeTab: T;
  onTabPress: (tab: T) => void;
  containerClassName?: string;
  /**
   * Continuous page position from an external swipeable pager, 0-indexed,
   * fractional mid-swipe (e.g. 1.35). Drive this from your pager's onScroll
   * worklet to have the underline track that gesture instead of this
   * control's own. When set, the built-in drag-to-switch gesture below is
   * disabled since the pager already owns the swipe.
   */
  progress?: SharedValue<number>;
  /**
   * Lets the user drag directly on the tab row to switch tabs, mirroring
   * RefreshableScrollView's pull gesture: live elastic tracking while
   * dragging, a threshold check on release, spring settle either way.
   * Ignored when `progress` is provided. Defaults to true.
   */
  dragToSwitch?: boolean;
  /** Horizontal drag distance (px) needed to commit a tab switch. */
  dragThreshold?: number;
}

export function SubTabControl<T extends string>({
  tabs,
  activeTab,
  onTabPress,
  containerClassName = 'mb-3',
  progress,
  dragToSwitch = true,
  dragThreshold = 40,
}: SubTabControlProps<T>) {
  const tabCount = tabs.length;

  const xs = useSharedValue<number[]>(new Array(tabCount).fill(0));
  const widths = useSharedValue<number[]>(new Array(tabCount).fill(0));
  const measuredCount = useRef(0);
  const [ready, setReady] = useState(false);

  const internalProgress = useSharedValue(0);
  const activeIndexShared = useSharedValue(0);
  const dragX = useSharedValue(0);

  useEffect(() => {
    const index = tabs.findIndex((t) => t.key === activeTab);
    if (index < 0) return;
    activeIndexShared.value = index;
    if (!progress) {
      internalProgress.value = withTiming(index, { duration: 200 });
    }
  }, [activeTab, progress, activeIndexShared, internalProgress, tabs]);

  const handleLayout = (index: number) => (e: LayoutChangeEvent) => {
    const { x, width } = e.nativeEvent.layout;

    const nextXs = [...xs.value];
    nextXs[index] = x;
    xs.value = nextXs;

    const nextWidths = [...widths.value];
    nextWidths[index] = width;
    widths.value = nextWidths;

    measuredCount.current += 1;
    if (measuredCount.current === tabCount) {
      const activeIndex = tabs.findIndex((t) => t.key === activeTab);
      if (activeIndex >= 0) {
        internalProgress.value = activeIndex;
        activeIndexShared.value = activeIndex;
      }
      setReady(true);
    }
  };

  const handleSelect = (tabKey: T) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onTabPress(tabKey);
  };

  const selectByIndex = useCallback(
    (index: number) => {
      const tab = tabs[index];
      if (!tab) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      onTabPress(tab.key);
    },
    [tabs, onTabPress],
  );

  const springConfig = { damping: 16, stiffness: 140 };

  const panGesture = Gesture.Pan()
    .enabled(!progress && dragToSwitch)
    .activeOffsetX([-10, 10])
    .failOffsetY([-10, 10])
    .onUpdate((event) => {
      const atStart = activeIndexShared.value === 0;
      const atEnd = activeIndexShared.value === tabCount - 1;
      let next = event.translationX;
      if (atStart && next < 0) next *= 0.3;
      if (atEnd && next > 0) next *= 0.3;
      dragX.value = next;
    })
    .onEnd(() => {
      const advancing =
        dragX.value > dragThreshold && activeIndexShared.value < tabCount - 1;
      const retreating =
        dragX.value < -dragThreshold && activeIndexShared.value > 0;

      if (advancing || retreating) {
        const nextIndex = activeIndexShared.value + (advancing ? 1 : -1);
        activeIndexShared.value = nextIndex;
        internalProgress.value = withTiming(nextIndex, { duration: 200 });
        dragX.value = withSpring(0, springConfig);
        scheduleOnRN(selectByIndex, nextIndex);
      } else {
        dragX.value = withSpring(0, springConfig);
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
      transform: [{ translateX: baseX + dragX.value }],
      width: baseWidth,
    };
  });

  return (
    <View accessibilityRole="tablist" className={containerClassName}>
      <GestureDetector gesture={panGesture}>
        <View className="flex-row gap-5">
          {tabs.map((tab, index) => {
            const isActive = activeTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => handleSelect(tab.key)}
                onLayout={handleLayout(index)}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={`${tab.label} tab`}
                hitSlop={{ top: 12, bottom: 12, left: 4, right: 4 }}
                className="flex-row items-center py-2.5"
              >
                <StyledText
                  variant="extrabold"
                  className={`text-xs ${
                    isActive ? 'text-ink-900' : 'text-ink-400'
                  }`}
                >
                  {tab.label}
                </StyledText>
                {tab.badgeCount && tab.badgeCount > 0 ? (
                  <View className="ml-1.5 h-4 min-w-[16px] items-center justify-center rounded-full bg-[#E85A1F] px-1">
                    <StyledText
                      variant="extrabold"
                      className="text-paper-50 text-[10px]"
                    >
                      {tab.badgeCount > 99 ? '99+' : tab.badgeCount}
                    </StyledText>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </GestureDetector>

      {/* Track + sliding underline */}
      <View className="h-[2px] bg-paper-200">
        {ready && (
          <Animated.View
            style={underlineStyle}
            className="absolute h-[2px] rounded-full bg-ink-900"
          />
        )}
      </View>
    </View>
  );
}
