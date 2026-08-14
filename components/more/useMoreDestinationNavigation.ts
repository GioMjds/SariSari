import { router } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import type { MoreDestination } from './moreNavigation';

const NAVIGATION_LOCK_MS = 500;

export function useMoreDestinationNavigation() {
  const lockedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  return useCallback((destination: MoreDestination) => {
    if (lockedRef.current) return;
    lockedRef.current = true;
    router.navigate(destination);
    timerRef.current = setTimeout(() => {
      lockedRef.current = false;
      timerRef.current = null;
    }, NAVIGATION_LOCK_MS);
  }, []);
}
