import { useEffect, useRef } from 'react';
import {
  useReducedMotion,
  useSharedValue,
  withTiming,
  SharedValue,
} from 'react-native-reanimated';

const DEFAULT_DURATION_MS = 200;

export function useTabProgress<T extends string>(
  activeTab: T,
  tabs: readonly T[],
  duration: number = DEFAULT_DURATION_MS,
): SharedValue<number> {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue<number>(0);
  const seededRef = useRef(false);

  // Resolve the index for a tab key. Falls back to 0 when the active tab
  // is not present in the list (defensive — the layouts guard against
  // this, but the hook should not throw).
  const indexOf = (key: T): number => {
    const i = tabs.indexOf(key);
    return i < 0 ? 0 : i;
  };

  // Seed on first render so the underline starts in the right place
  // before any layout pass. Mirrors SubTabControl's cold-mount seeding.
  if (!seededRef.current) {
    seededRef.current = true;
    progress.value = indexOf(activeTab);
  }

  useEffect(() => {
    const target = indexOf(activeTab);
    const ms = reduceMotion ? 0 : duration;
    // Always go through withTiming so the underline tween matches the
    // page transition in TopTabs. Duration 0 collapses to an instant jump,
    // which is the right behavior for reduced motion.
    progress.value = withTiming(target, { duration: ms });
  }, [activeTab, duration, progress, reduceMotion, tabs]);

  return progress;
}
