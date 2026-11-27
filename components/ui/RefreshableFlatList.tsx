import {
  ForwardedRef,
  forwardRef,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import {
  FlatList,
  FlatListProps,
  Platform,
  RefreshControl,
  StyleProp,
  View,
  ViewStyle,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedScrollHandler,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { PullToRefreshHeader } from './LoadingBar';

type RefreshableFlatListProps<T> = Omit<
  FlatListProps<T>,
  'onRefresh' | 'refreshing' | 'onScroll' | 'refreshControl'
> & {
  isRefreshing: boolean;
  onRefresh: () => void | Promise<void>;
  refreshThreshold?: number;
  contentContainerStyle?: StyleProp<ViewStyle>;
  className?: string;
};

function RefreshableFlatListInner<T>(
  props: RefreshableFlatListProps<T>,
  ref: ForwardedRef<FlatList<T>>,
) {
  const {
    isRefreshing,
    onRefresh,
    refreshThreshold = 80,
    className = '',
    contentContainerStyle,
    ListHeaderComponent,
    ...rest
  } = props;

  const flatListRef = useRef<FlatList<T>>(null);

  useEffect(() => {
    if (typeof ref === 'function') ref(flatListRef.current);
    else if (ref) (ref as any).current = flatListRef.current;
  }, [ref]);

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
  const panGesture = Gesture.Pan()
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
    });

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

  const AnimatedFlatList = Animated.FlatList as any;

  // iOS keeps its native rubber-band and refresh control; the custom pull header is Android-only.
  if (Platform.OS === 'ios') {
    return (
      <View className={`flex-1 ${className}`}>
        <FlatList
          {...rest}
          ref={flatListRef}
          contentContainerStyle={contentContainerStyle}
          ListHeaderComponent={ListHeaderComponent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={triggerRefresh}
              tintColor="#623418"
            />
          }
        />
      </View>
    );
  }

  return (
    <GestureDetector gesture={panGesture}>
      <View className={`flex-1 ${className}`}>
        <PullToRefreshHeader
          isRefreshing={isRefreshing}
          scrollY={virtualScrollY}
          refreshThreshold={refreshThreshold}
        />
        <AnimatedFlatList
          {...rest}
          ref={flatListRef}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          contentContainerStyle={contentContainerStyle}
          bounces={false}
          overScrollMode={Platform.OS === 'android' ? 'never' : 'auto'}
          ListHeaderComponent={ListHeaderComponent}
        />
      </View>
    </GestureDetector>
  );
}

/**
 * Generic wrapper — usage is `RefreshableFlatList<SaleWithItems>`.
 * `forwardRef` preserves the standard `FlatList` ref contract.
 */
export const RefreshableFlatList = forwardRef(RefreshableFlatListInner) as <T>(
  props: RefreshableFlatListProps<T> & { ref?: ForwardedRef<FlatList<T>> },
) => ReturnType<typeof RefreshableFlatListInner>;
