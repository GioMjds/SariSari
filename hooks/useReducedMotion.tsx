import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * useReducedMotion — subscribes to the OS-level "Reduce Motion" setting
 * and returns its current value as a boolean. Defaults to `false` while
 * the initial async read is in flight, so a transient first frame never
 * skips the entrance animation by accident.
 *
 * Components that animate (Moti envelopes, scale, translate) should
 * read this and collapse multi-property transitions to opacity-only fades
 * when it returns `true`.
 *
 * @example
 *   const reducedMotion = useReducedMotion();
 *   <MotiView
 *     from={{ opacity: 0, translateY: reducedMotion ? 0 : 18 }}
 *     animate={{ opacity: 1, translateY: 0 }}
 *   />
 */
export function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (active) setReducedMotion(enabled);
    });
    const sub = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (enabled) => {
        if (active) setReducedMotion(enabled);
      },
    );
    return () => {
      active = false;
      sub.remove();
    };
  }, []);

  return reducedMotion;
}
