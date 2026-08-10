import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Extrapolation,
  SharedValue,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  withSpring,
  Easing,
  interpolate,
} from 'react-native-reanimated';

export interface LoadingBarProps {
  /** Size variant of the tally beads */
  size?: 'sm' | 'md' | 'lg';
  /** Color palette variant */
  colorScheme?: 'brand' | 'persimmon' | 'sage' | 'ink';
  /** NativeWind class name wrapper for layout & margins */
  className?: string;
  /** Optional test identifier */
  testID?: string;
}

const SIZE_MAP = {
  sm: { beadWidth: 4, beadHeight: 10, gap: 4, height: 16 },
  md: { beadWidth: 6, beadHeight: 16, gap: 6, height: 24 },
  lg: { beadWidth: 8, beadHeight: 22, gap: 8, height: 32 },
} as const;

const COLOR_MAP = {
  brand: ['#E85A1F', '#FA7A4B', '#623418', '#4F7A24', '#4F7A24'],
  persimmon: ['#FA7A4B', '#E85A1F', '#C8460F', '#E85A1F', '#FA7A4B'],
  sage: ['#92B662', '#4F7A24', '#3D5E1B', '#4F7A24', '#92B662'],
  ink: ['#A89F90', '#564E45', '#28231D', '#564E45', '#A89F90'],
} as const;

interface BeadItemProps {
  index: number;
  color: string;
  beadWidth: number;
  beadHeight: number;
}

function BeadItem({ index, color, beadWidth, beadHeight }: BeadItemProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withDelay(
        index * 120,
        withSequence(
          withTiming(1, { duration: 350, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 350, easing: Easing.in(Easing.quad) }),
        ),
      ),
      -1,
      false,
    );
  }, [index, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scaleY: interpolate(progress.value, [0, 1], [0.75, 1.25]),
        },
      ],
      opacity: interpolate(progress.value, [0, 1], [0.35, 1.0]),
    };
  });

  return (
    <Animated.View
      style={[
        {
          width: beadWidth,
          height: beadHeight,
          backgroundColor: color,
          borderRadius: beadWidth / 2,
        },
        animatedStyle,
      ]}
    />
  );
}

export function LoadingBar({
  size = 'md',
  colorScheme = 'brand',
  className = '',
  testID = 'loading-bar',
}: LoadingBarProps) {
  const config = SIZE_MAP[size];
  const colors = COLOR_MAP[colorScheme];

  return (
    <View
      testID={testID}
      accessibilityRole="progressbar"
      accessibilityState={{ busy: true }}
      className={`flex-row items-center justify-center ${className}`}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: config.gap,
          height: config.height,
        }}
      >
        {colors.map((color, index) => (
          <BeadItem
            key={index}
            index={index}
            color={color}
            beadWidth={config.beadWidth}
            beadHeight={config.beadHeight}
          />
        ))}
      </View>
    </View>
  );
}

export interface PullToRefreshHeaderProps {
  isRefreshing: boolean;
  label?: string;
  className?: string;
  /**
   * Live scroll offset (negative while pulling past the top). When provided,
   * the header animates directly from this value so the LoadingBar tracks the
   * user's finger in real time. When omitted, the header falls back to a
   * snap animation driven only by `isRefreshing` toggling.
   */
  scrollY?: SharedValue<number>;
  /**
   * Pull distance (px) at which the header reaches its full visible size.
   * Only used when `scrollY` is provided. Defaults to 80.
   */
  refreshThreshold?: number;
}

export function PullToRefreshHeader({
  isRefreshing,
  className = '',
  scrollY,
  refreshThreshold = 80,
}: PullToRefreshHeaderProps) {
  const height = useSharedValue(0);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-20);

  useEffect(() => {
    if (scrollY !== undefined) return;

    if (isRefreshing) {
      height.value = withSpring(56, { damping: 16, stiffness: 140 });
      opacity.value = withTiming(1, { duration: 180 });
      translateY.value = withSpring(0, { damping: 14, stiffness: 120 });
    } else {
      height.value = withTiming(0, { duration: 250 });
      opacity.value = withTiming(0, { duration: 180 });
      translateY.value = withTiming(-20, { duration: 200 });
    }
  }, [isRefreshing, height, opacity, translateY, scrollY]);

  const animatedStyle = useAnimatedStyle(() => {
    if (scrollY !== undefined) {
      // Negative contentOffset means the user is pulling past the top edge.
      // Clamp so we never grow the header from a downward scroll.
      const pullDistance = Math.max(0, -scrollY.value);

      const h = interpolate(
        pullDistance,
        [0, refreshThreshold, refreshThreshold * 1.5],
        [0, 56, 64],
        Extrapolation.CLAMP,
      );
      const o = interpolate(
        pullDistance,
        [0, refreshThreshold * 0.4],
        [0, 1],
        Extrapolation.CLAMP,
      );
      const ty = interpolate(
        pullDistance,
        [0, refreshThreshold],
        [-20, 0],
        Extrapolation.CLAMP,
      );

      return {
        height: h,
        opacity: o,
        transform: [{ translateY: ty }],
        overflow: 'hidden',
      };
    }

    return {
      height: height.value,
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
      overflow: 'hidden',
    };
  });

  return (
    <Animated.View style={animatedStyle} className={`px-4 ${className}`}>
      <View className="items-center justify-center py-3">
        <LoadingBar size="md" colorScheme="brand" />
      </View>
    </Animated.View>
  );
}
