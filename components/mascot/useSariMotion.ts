import { useEffect } from 'react';
import {
  cancelAnimation,
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

const BREATH_MS = 1700;

/**
 * Shared clock for a Sari state. `cycle` loops 0..1 once per `cycleMs`;
 * `breath` ping-pongs 0..1 for idle breathing. When `animate` is false
 * both freeze: `cycle` at `restPose`, `breath` at 0.
 */
export function useSariClock(
  animate: boolean,
  cycleMs: number,
  restPose: number,
) {
  const cycle = useSharedValue(restPose);
  const breath = useSharedValue(0);

  useEffect(() => {
    if (!animate) {
      cancelAnimation(cycle);
      cancelAnimation(breath);
      cycle.value = restPose;
      breath.value = 0;
      return;
    }
    cycle.value = 0;
    cycle.value = withRepeat(
      withTiming(1, { duration: cycleMs, easing: Easing.linear }),
      -1,
      false,
    );
    breath.value = withRepeat(
      withTiming(1, { duration: BREATH_MS, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    return () => {
      cancelAnimation(cycle);
      cancelAnimation(breath);
    };
  }, [animate, cycleMs, restPose, cycle, breath]);

  return { cycle, breath };
}

/** Breathing squash for the body and the matching shadow shrink. */
export function useSariBreathStyles(
  breath: ReturnType<typeof useSariClock>['breath'],
  unit: number,
) {
  const breathStyle = useAnimatedStyle(() => ({
    transformOrigin: '50% 90%',
    transform: [
      { translateY: interpolate(breath.value, [0, 1], [0, -2.5 * unit]) },
      { scaleX: interpolate(breath.value, [0, 1], [1, 0.99]) },
      { scaleY: interpolate(breath.value, [0, 1], [1, 1.025]) },
    ],
  }));

  const shadowStyle = useAnimatedStyle(() => ({
    transformOrigin: [100 * unit, 185 * unit, 0],
    transform: [{ scaleX: interpolate(breath.value, [0, 1], [1, 0.93]) }],
  }));

  return { breathStyle, shadowStyle };
}

/**
 * Hop keyframes on the cycle: crouch (0.04-0.12), airborne (0.2),
 * land squash (0.28), settle (0.34-0.42).
 */
export const SARI_HOP_T = [0.04, 0.12, 0.2, 0.28, 0.34, 0.42];

/** Squash-and-stretch hop for the body, plus the shadow shrinking while airborne. */
export function useSariHopStyles(
  cycle: ReturnType<typeof useSariClock>['cycle'],
  unit: number,
) {
  const hopStyle = useAnimatedStyle(() => ({
    transformOrigin: [100 * unit, 185 * unit, 0],
    transform: [
      {
        translateY: interpolate(
          cycle.value,
          SARI_HOP_T,
          [0, 2 * unit, -16 * unit, 0, unit, 0],
          Extrapolation.CLAMP,
        ),
      },
      {
        scaleX: interpolate(
          cycle.value,
          SARI_HOP_T,
          [1, 1.06, 0.96, 1.07, 0.99, 1],
          Extrapolation.CLAMP,
        ),
      },
      {
        scaleY: interpolate(
          cycle.value,
          SARI_HOP_T,
          [1, 0.9, 1.06, 0.9, 1.03, 1],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const hopShadowStyle = useAnimatedStyle(() => ({
    transformOrigin: [100 * unit, 185 * unit, 0],
    opacity: interpolate(
      cycle.value,
      SARI_HOP_T,
      [1, 1, 0.6, 1, 1, 1],
      Extrapolation.CLAMP,
    ),
    transform: [
      {
        scaleX: interpolate(
          cycle.value,
          SARI_HOP_T,
          [1, 1.06, 0.7, 1.08, 1, 1],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  return { hopStyle, hopShadowStyle };
}
