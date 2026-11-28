import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useAuthStore } from '@/stores/useAuthStore';
import { isBiometricPromptActive } from '@/lib/auth/biometrics';
import { shouldRelockOnResume } from '@/lib/auth/appLock';

/** Records when the app leaves the foreground and relocks it on resume when the policy says so. */
export function useAppLockOnResume(enabled: boolean) {
  const markBackgrounded = useAuthStore((s) => s.markBackgrounded);
  const requireUnlock = useAuthStore((s) => s.requireUnlock);

  useEffect(() => {
    if (!enabled) return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background' || state === 'inactive') {
        markBackgrounded();
        return;
      }
      if (state !== 'active') return;
      const { lastBackgroundedAt } = useAuthStore.getState();
      if (
        shouldRelockOnResume(
          lastBackgroundedAt,
          Date.now(),
          isBiometricPromptActive(),
        )
      ) {
        requireUnlock();
      }
    });
    return () => sub.remove();
  }, [enabled, markBackgrounded, requireUnlock]);
}
