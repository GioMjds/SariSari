import { useCallback, useEffect, useRef } from 'react';
import { Platform, ScrollViewProps, StyleProp, ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedScrollHandler,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { PullToRefreshHeader } from './LoadingBar';
import { scheduleOnRN } from 'react-native-worklets';
import { RefObject } from '@testing-library/react-native/dist/types';

interface RefreshableScrollViewProps extends Omit<ScrollViewProps, 'onScroll'> {
  isRefreshing: boolean;
  onRefresh: () => void | Promise<void>;
  refreshLabel?: string;
  refreshThreshold?: number;
  children: React.ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  className?: string;
}

export function RefreshableScrollView({
  isRefreshing,
  onRefresh,
  refreshLabel = '',
  refreshThreshold = 80,
  children,
  className = '',
  contentContainerStyle,
  ...scrollViewProps
}: RefreshableScrollViewProps) {
  const scrollRef = useRef<Animated.ScrollView>(
    null,
  ) as RefObject<Animated.ScrollView>;
  const isAtTop = useSharedValue(true);
  const pullY = useSharedValue(0);

  const virtualScrollY = useDerivedValue(() => -pullY.value);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    isAtTop.value = event.contentOffset.y <= 0;
  });

  const triggerRefresh = useCallback(() => {
    onRefresh();
  }, [onRefresh]);

  const panGesture = Gesture.Pan()
    .activeOffsetY(20)
    .failOffsetY(-10)
    .failOffsetX([-15, 15])
    .onUpdate((event) => {
      if (isAtTop.value && event.translationY > 0) {
        pullY.value = Math.min(
          event.translationY * 0.5,
          refreshThreshold * 1.6,
        );
      }
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
    })
    .simultaneousWithExternalGesture(scrollRef);

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
        <Animated.ScrollView
          {...scrollViewProps}
          ref={scrollRef}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          contentContainerStyle={contentContainerStyle}
          bounces={false}
          overScrollMode={Platform.OS === 'android' ? 'never' : 'auto'}
        >
          {children}
        </Animated.ScrollView>
      </Animated.View>
    </GestureDetector>
  );
}
