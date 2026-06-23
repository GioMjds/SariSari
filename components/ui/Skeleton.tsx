import React, { useEffect } from 'react';
import { type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Reanimated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

/**
 * Skeleton — a pulsing greyed bar used as a loading placeholder.
 * Hand-rolled (no third-party) so it stays compatible with React 19
 * and the React Native New Architecture. The third-party
 * `react-loading-skeleton` package breaks under the new arch because
 * its DOM <span> wrapper fires a "View config getter" warning.
 *
 * Use it like a sizing primitive:
 *   <Skeleton width={120} height={14} />
 *   <Skeleton width={'100%'} height={20} style={{ marginTop: 6 }} />
 *   <Skeleton width={40} height={40} circle />
 *   <Skeleton width={200} height={16} shimmer />
 */

const INK_200 = '#D2CCC1';
const INK_100 = '#EAE6DF';

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  /** When true, draw as a circle (borderRadius = min(width, height) / 2). */
  circle?: boolean;
  /**
   * When true, layer a Reanimated 4 shimmer sweep on top of the
   * pulsing background. Useful for hero cards and the inventory
   * list rows.
   */
  shimmer?: boolean;
  style?: ViewStyle | ViewStyle[];
}

function resolveBorderRadius(
  width: SkeletonProps['width'],
  height: number,
  explicit: number | undefined,
  circle: boolean,
): number {
  if (circle && typeof width === 'number') {
    return Math.min(width, height) / 2;
  }
  return explicit ?? 4;
}

export function Skeleton({
  width = '100%',
  height = 12,
  borderRadius,
  circle = false,
  shimmer = false,
  style,
}: SkeletonProps) {
  const radius = resolveBorderRadius(width, height, borderRadius, circle);
  // Pulse is driven by a Reanimated shared value so the opacity
  // arriving on the UI thread is a plain `double`. Mixing the legacy
  // `Animated.Value` into a `Reanimated.View`'s style crashed the
  // new arch with "ReadableNativeMap cannot be cast to Double" on
  // Android — the legacy value serialized as a map, not a number.
  const opacity = useSharedValue(0.55);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    return () => {
      opacity.value = 0.55;
    };
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Reanimated.View
      accessibilityRole="progressbar"
      accessibilityLabel="Loading"
      style={[
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: INK_200,
          // Ink-200 sits between paper-50 and paper-100; the pulse
          // plus (optional) shimmer reads as a paper-craft loading
          // state rather than a flat grey bar.
          overflow: 'hidden',
        },
        animatedStyle,
        style,
      ]}
    >
      {shimmer && <ShimmerOverlay height={height} />}
    </Reanimated.View>
  );
}

interface ShimmerOverlayProps {
  height: number;
}

function ShimmerOverlay({ height }: ShimmerOverlayProps) {
  // A shared translateX value drives a LinearGradient sweep across
  // the skeleton. The gradient is 2x the surface width, so it can
  // fully exit on the right when translateX = 100%.
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.linear }),
      -1,
      false,
    );
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: `${progress.value * 200 - 100}%` }],
  }));

  return (
    <Reanimated.View
      style={[
        {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '200%',
        },
        animatedStyle,
      ]}
      pointerEvents="none"
    >
      <LinearGradient
        colors={[INK_200, INK_100, INK_200]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={{ flex: 1, height }}
      />
    </Reanimated.View>
  );
}
