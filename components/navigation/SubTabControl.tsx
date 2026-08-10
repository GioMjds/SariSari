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
  progress?: SharedValue<number>;
  dragToSwitch?: boolean;
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
  const layoutVersion = useSharedValue(0);
  const measuredIndices = useRef<Set<number>>(new Set());
  const [ready, setReady] = useState(false);

  const internalProgress = useSharedValue(0);
  const activeIndexShared = useSharedValue(0);
  const dragX = useSharedValue(0);

  const tabKeys = tabs.map((t) => t.key).join(',');
  const prevTabKeysRef = useRef(tabKeys);

  useEffect(() => {
    if (prevTabKeysRef.current !== tabKeys) {
      prevTabKeysRef.current = tabKeys;
      measuredIndices.current.clear();
      setReady(false);
      // xs/widths are sized once at mount via useSharedValue's initial
      // value, which is only ever evaluated on first render. If tabCount
      // changes later (a tab is added or removed), these arrays keep
      // their old length. interpolate() then reads an inputRange built
      // from the current tab count against an outputRange of the wrong
      // length, and silently degrades toward the last defined entry
      // instead of throwing, which is what pins the underline to the
      // last tab. Resetting both to a fresh zero-filled array of the
      // current length keeps them in sync with inputRange and gives
      // handleLayout a clean slate to remeasure into.
      xs.value = new Array(tabCount).fill(0);
      widths.value = new Array(tabCount).fill(0);
    }
  }, [tabKeys, tabCount, xs, widths]);

  useEffect(() => {
    const index = tabs.findIndex((t) => t.key === activeTab);
    if (index < 0) return;
    activeIndexShared.value = index;
    if (!progress) {
      // Before layout has completed once, xs/widths are still zero-filled,
      // so animating internalProgress toward `index` here would animate
      // through meaningless positions. Snap instantly until `ready`, then
      // animate on every activeTab change after that.
      internalProgress.value = ready
        ? withTiming(index, { duration: 200 })
        : index;
    }
  }, [activeTab, progress, ready, activeIndexShared, internalProgress, tabs]);

  const handleLayout = (index: number) => (e: LayoutChangeEvent) => {
    // Guard against a stale closure firing onLayout for an index that no
    // longer exists in the current tab set (e.g. a tab was removed between
    // when this callback was created and when RN actually calls it).
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
      // Snap activeIndexShared here since the pan gesture and drag math
      // need a correct starting index immediately once layout is known.
      // internalProgress is intentionally NOT written here: the
      // activeTab-driven effect below is the single owner of
      // internalProgress, so this block doesn't race it. Before this
      // fix, both this block and that effect wrote internalProgress on
      // mount, and whichever one ran last "won", non-deterministically,
      // which was a second, independent source of an incorrect resting
      // position for the underline.
      const activeIndex = tabs.findIndex((t) => t.key === activeTab);
      if (activeIndex >= 0) {
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
      if (atStart && next > 0) next *= 0.3;
      if (atEnd && next < 0) next *= 0.3;
      dragX.value = next;
    })
    .onEnd(() => {
      const advancing =
        dragX.value < -dragThreshold && activeIndexShared.value < tabCount - 1;
      const retreating =
        dragX.value > dragThreshold && activeIndexShared.value > 0;

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
                  className={`text-xs uppercase ${
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
