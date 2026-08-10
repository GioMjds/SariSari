import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, {
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
  /** Optional text label displayed next to or below beads */
  label?: string;
  /** Position of optional label relative to beads */
  labelPosition?: 'right' | 'bottom';
  /** NativeWind class name wrapper for layout & margins */
  className?: string;
  /** Optional test identifier */
  testID?: string;
}

const SIZE_MAP = {
  sm: { beadWidth: 4, beadHeight: 10, gap: 4, height: 16 },
  md: { beadWidth: 6, beadHeight: 16, gap: 6, height: 24 },
  lg: { beadWidth: 8, beadHeight: 22, gap: 8, height: 32 },
};

const COLOR_MAP = {
  brand: ['#E85A1F', '#FA7A4B', '#623418', '#4F7A24', '#4F7A24'],
  persimmon: ['#FA7A4B', '#E85A1F', '#C8460F', '#E85A1F', '#FA7A4B'],
  sage: ['#92B662', '#4F7A24', '#3D5E1B', '#4F7A24', '#92B662'],
  ink: ['#A89F90', '#564E45', '#28231D', '#564E45', '#A89F90'],
};

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
          withTiming(0, { duration: 350, easing: Easing.in(Easing.quad) })
        )
      ),
      -1,
      false
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
  label,
  labelPosition = 'right',
  className = '',
  testID = 'loading-bar',
}: LoadingBarProps) {
  const config = SIZE_MAP[size];
  const colors = COLOR_MAP[colorScheme];

  const isBottom = labelPosition === 'bottom';

  return (
    <View
      testID={testID}
      accessibilityRole="progressbar"
      accessibilityState={{ busy: true }}
      className={`flex-row items-center justify-center ${
        isBottom ? 'flex-col gap-2' : 'gap-3'
      } ${className}`}
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
      {Boolean(label) && (
        <Text className="text-xs font-semibold text-ink-500">{label}</Text>
      )}
    </View>
  );
}

export interface PullToRefreshHeaderProps {
  isRefreshing: boolean;
  label?: string;
  className?: string;
}

export function PullToRefreshHeader({
  isRefreshing,
  label = 'Ina-update ang datos...',
  className = '',
}: PullToRefreshHeaderProps) {
  const height = useSharedValue(0);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-20);

  useEffect(() => {
    if (isRefreshing) {
      height.value = withSpring(56, { damping: 16, stiffness: 140 });
      opacity.value = withTiming(1, { duration: 180 });
      translateY.value = withSpring(0, { damping: 14, stiffness: 120 });
    } else {
      height.value = withTiming(0, { duration: 250 });
      opacity.value = withTiming(0, { duration: 180 });
      translateY.value = withTiming(-20, { duration: 200 });
    }
  }, [isRefreshing, height, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
    overflow: 'hidden',
  }));

  return (
    <Animated.View style={animatedStyle} className={`px-4 ${className}`}>
      <View className="items-center justify-center py-3 rounded-xl bg-paper-50 border border-paper-300 shadow-sm">
        <LoadingBar size="sm" label={label} colorScheme="brand" />
      </View>
    </Animated.View>
  );
}