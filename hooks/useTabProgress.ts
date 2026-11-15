import { useEffect, useMemo } from 'react';
import {
  useReducedMotion,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

const DEFAULT_DURATION_MS = 200;

export function useTabProgress<T extends string>(
  activeTab: T,
  tabs: readonly T[],
  duration: number = DEFAULT_DURATION_MS,
): SharedValue<number> {
  const reduceMotion = useReducedMotion();
  
  const targetIndex = useMemo(() => {
    const idx = tabs.indexOf(activeTab);
    return idx < 0 ? 0 : idx;
  }, [activeTab, tabs]);

  const progress = useSharedValue<number>(targetIndex);

  useEffect(() => {
    progress.value = withTiming(targetIndex, {
      duration: reduceMotion ? 0 : duration,
    });
  }, [targetIndex, duration, reduceMotion, progress]);

  return progress;
}
