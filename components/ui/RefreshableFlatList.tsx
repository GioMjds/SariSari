import {
  useCallback,
  useEffect,
  useRef,
  forwardRef,
  ForwardedRef,
} from 'react';
import {
  FlatList,
  FlatListProps,
  Platform,
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
import { PullToRefreshHeader } from './LoadingBar';
import { scheduleOnRN } from 'react-native-worklets';

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

/**
 * FlatList counterpart of `RefreshableScrollView` — same pull-to-refresh feel
 * (custom `PullToRefreshHeader` / `LoadingBar`) but built on top of
 * `FlatList` so virtualization and pagination are preserved.
 *
 * The pull gesture is only intercepted when the list is scrolled to the top,
 * matching the ScrollView version's behavior.
 */
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
  // We can't pass the forwarded `ref` directly to the inner FlatList because
  // the gesture handler below needs its own stable ref to attach
  // `simultaneousWithExternalGesture`. We keep the inner ref as the source of
  // truth and mirror it to the forwarded ref after mount.
  useEffect(() => {
    if (typeof ref === 'function') ref(flatListRef.current);
    else if (ref) (ref as any).current = flatListRef.current;
  }, [ref]);

  // `simultaneousWithExternalGesture` is typed for `Animated.ScrollView` /
  // `ScrollView` refs, but `FlatList` is a thin wrapper over one — the
  // runtime works the same way. The cast mirrors the one in
  // `RefreshableScrollView` (which uses a `RefObject<Animated.ScrollView>`).
  const scrollRef = flatListRef as unknown as React.RefObject<any>;

  const isAtTop = useSharedValue(true);
  const pullY = useSharedValue(0);
  const virtualScrollY = useDerivedValue(() => -pullY.value);

  // `FlatList.onScroll` is called by RN with a native event on the JS
  // thread — it must be a real function. `useAnimatedScrollHandler`
  // returns an `EventHandlerProcessed` (a callable that dispatches into
  // the UI thread), but the dependency-array form of useEvent inside
  // reanimated occasionally mutates the returned handler identity, so
  // we cache the identity in a ref and wrap it in a stable JS function.
  // (An `Animated.ScrollView` does this wiring internally; `FlatList`
  // does not, which is why this differs from `RefreshableScrollView`.)
  const scrollHandler = useAnimatedScrollHandler((event) => {
    isAtTop.value = event.contentOffset.y <= 0;
  });
  const scrollHandlerRef = useRef(scrollHandler);
  useEffect(() => {
    scrollHandlerRef.current = scrollHandler;
  }, [scrollHandler]);
  const handleScroll = useCallback(
    (event: Parameters<NonNullable<FlatListProps<T>['onScroll']>>[0]) => {
      scrollHandlerRef.current(event);
    },
    [],
  );

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
      <View className={`flex-1 ${className}`}>
        <PullToRefreshHeader
          isRefreshing={isRefreshing}
          scrollY={virtualScrollY}
          refreshThreshold={refreshThreshold}
        />
        <FlatList<T>
          {...rest}
          ref={flatListRef}
          onScroll={handleScroll}
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
export const RefreshableFlatList = forwardRef(RefreshableFlatListInner) as <
  T,
>(
  props: RefreshableFlatListProps<T> & { ref?: ForwardedRef<FlatList<T>> },
) => ReturnType<typeof RefreshableFlatListInner>;
