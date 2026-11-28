import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { consumeQueue, runStartupChecks, subscribeCounter } from '@/lib/backup';
import { useSchedulerInputs } from '@/hooks/useBackup';

const STARTUP_CHECKS_DELAY_MS = 5000;

export function useBackupScheduler(enabled: boolean) {
  const schedulerInputs = useSchedulerInputs();

  const inputsRef = useRef(schedulerInputs);
  useEffect(() => {
    inputsRef.current = schedulerInputs;
  }, [schedulerInputs]);

  const didRunStartup = useRef(false);
  useEffect(() => {
    if (!enabled || didRunStartup.current) return;
    didRunStartup.current = true;
    const timer = setTimeout(() => {
      void runStartupChecks(inputsRef.current).catch((e) =>
        console.warn('runStartupChecks failed', e),
      );
    }, STARTUP_CHECKS_DELAY_MS);
    return () => clearTimeout(timer);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    return subscribeCounter(schedulerInputs);
  }, [enabled, schedulerInputs]);

  useEffect(() => {
    if (!enabled) return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      void consumeQueue(inputsRef.current).catch((e) =>
        console.warn('consumeQueue failed', e),
      );
    });
    return () => sub.remove();
  }, [enabled]);
}
