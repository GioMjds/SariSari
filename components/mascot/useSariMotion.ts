import { useEffect } from 'react';
import {
  cancelAnimation,
  Easing,
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
export function useSariClock(animate: boolean, cycleMs: number, restPose: number) {
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
    transformOrigin: '50% 92.5%',
    transform: [{ scaleX: interpolate(breath.value, [0, 1], [1, 0.93]) }],
  }));

  return { breathStyle, shadowStyle };
}
