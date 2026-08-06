import { useEffect, useRef } from 'react';
import { logger } from '@/lib/logger';

/**
 * Threshold-based render counter for spotting runaway re-renders.
 *
 * Drop into a suspect component to detect when a render storm happens
 * inside a short window. The hook itself never triggers a re-render —
 * it uses `useRef` counters only and emits a single warn event before
 * going silent for the rest of the component's lifetime.
 *
 * Use only while debugging. The reported threshold is high enough
 * (30 renders in 1s by default) that normal layouts, keystrokes, and
 * one-shot fetches do not trigger it.
 */

export interface RenderCounterOptions {
  /** Render count inside the window that triggers the warn. Default 30. */
  threshold?: number;
  /** Window size in milliseconds. Default 1000. */
  windowMs?: number;
  /** Subsystem tag. Defaults to 'unknown'. */
  feature?: string;
}

export function useRenderCounter(
  componentName: string,
  opts: RenderCounterOptions = {},
): void {
  const threshold = opts.threshold ?? 30;
  const windowMs = opts.windowMs ?? 1000;
  const feature = opts.feature ?? 'unknown';

  const countRef = useRef(0);
  const windowStartRef = useRef<number>(Date.now());
  const firedRef = useRef(false);

  countRef.current += 1;

  const now = Date.now();
  if (now - windowStartRef.current >= windowMs) {
    windowStartRef.current = now;
    countRef.current = 1;
  }

  if (!firedRef.current && countRef.current >= threshold) {
    firedRef.current = true;
    logger.warn(
      {
        event: 'render_loop_suspected',
        feature,
        component: componentName,
        renders: countRef.current,
        windowMs,
        threshold,
      },
      `render loop suspected in ${componentName}`,
    );
  }

  useEffect(() => {
    logger.debug({
      event: 'component_mounted',
      feature,
      component: componentName,
    });
    return () => {
      logger.debug({
        event: 'component_unmounted',
        feature,
        component: componentName,
      });
    };
  }, [componentName, feature]);
}
