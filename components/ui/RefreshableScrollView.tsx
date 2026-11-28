import {
  ComponentProps,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { Platform, ScrollViewProps, StyleProp, ViewStyle } from 'react-native';
import {
  Gesture,
  GestureDetector,
  ScrollView as RNGHScrollView,
} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedScrollHandler,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { PullToRefreshHeader } from './LoadingBar';
import { scheduleOnRN } from 'react-native-worklets';

const AnimatedRNGHScrollView = Animated.createAnimatedComponent(RNGHScrollView);

// Reanimated's prop types clash with RN's under exactOptionalPropertyTypes (id, hitSlop), so cast the spread.
type AnimatedScrollViewProps = Omit<
  ComponentProps<typeof AnimatedRNGHScrollView>,
  'key'
>;

interface RefreshableScrollViewProps extends Omit<ScrollViewProps, 'onScroll'> {
  isRefreshing: boolean;
  onRefresh: () => void | Promise<void>;
  refreshThreshold?: number;
  children: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  className?: string;
}

export function RefreshableScrollView({
  isRefreshing,
  onRefresh,
  refreshThreshold = 80,
  children,
  className = '',
  contentContainerStyle,
  ...scrollViewProps
}: RefreshableScrollViewProps) {
  const scrollRef = useRef<RNGHScrollView>(null);
  const isAtTop = useSharedValue(true);
  const pullY = useSharedValue(0);

  const virtualScrollY = useDerivedValue(() => -pullY.value);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    isAtTop.value = event.contentOffset.y <= 0;
  });

  const triggerRefresh = useCallback(() => {
    onRefresh();
  }, [onRefresh]);

  const touchStartY = useSharedValue(0);

  // Activate only for a downward pull at the top, otherwise fail so the native scroll is never cancelled.
  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .manualActivation(true)
        .onTouchesDown((event) => {
          touchStartY.value = event.allTouches[0]?.absoluteY ?? 0;
        })
        .onTouchesMove((event, state) => {
          if (!isAtTop.value) {
            state.fail();
            return;
          }
          const dy = (event.allTouches[0]?.absoluteY ?? 0) - touchStartY.value;
          if (dy > 20) state.activate();
          else if (dy < -10) state.fail();
        })
        .onUpdate((event) => {
          if (!isAtTop.value) return;
          pullY.value = Math.max(
            0,
            Math.min(event.translationY * 0.5, refreshThreshold * 1.6),
          );
        })
        .onEnd(() => {
          if (pullY.value >= refreshThreshold) {
            pullY.value = withSpring(refreshThreshold, {
              damping: 16,
              stiffness: 140,
            });
            scheduleOnRN(triggerRefresh);
          } else {
            pullY.value = withTiming(0, { duration: 200 });
          }
        }),
    [isAtTop, pullY, refreshThreshold, touchStartY, triggerRefresh],
  );

  useEffect(() => {
    if (isRefreshing) {
      pullY.value = withSpring(refreshThreshold, {
        damping: 16,
        stiffness: 140,
      });
    } else {
      pullY.value = withTiming(0, { duration: 250 });
    }
  }, [isRefreshing, pullY, refreshThreshold]);

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View className={`flex-1 ${className}`}>
        <PullToRefreshHeader
          isRefreshing={isRefreshing}
          scrollY={virtualScrollY}
          refreshThreshold={refreshThreshold}
        />
        <AnimatedRNGHScrollView
          {...(scrollViewProps as AnimatedScrollViewProps)}
          ref={scrollRef}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          contentContainerStyle={contentContainerStyle}
          bounces={false}
          overScrollMode={Platform.OS === 'android' ? 'never' : 'auto'}
        >
          {children}
        </AnimatedRNGHScrollView>
      </Animated.View>
    </GestureDetector>
  );
}
