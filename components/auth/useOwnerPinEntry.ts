import { useCallback, useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { verifyOwnerPin } from '@/database/auth';
import { useAuthStore } from '@/stores/useAuthStore';
import type { PinBoxStatus } from './PinBoxes';
import { OWNER_PIN_LENGTH } from './OwnerPinSetupFlow';

const WRONG_PIN_CLEAR_MS = 400;

/** Shared keypad state, verification, and lockout for every Owner PIN challenge. */
export const useOwnerPinEntry = (active: boolean, onSuccess: () => void) => {
  const { t } = useTranslation('settings');
  const registerFailedAttempt = useAuthStore((s) => s.registerFailedAttempt);
  const resetFailedAttempts = useAuthStore((s) => s.resetFailedAttempts);
  const clearExpiredLockout = useAuthStore((s) => s.clearExpiredLockout);
  const lockoutUntil = useAuthStore((s) => s.lockoutUntil);
  const [pin, setPin] = useState('');
  const [status, setStatus] = useState<PinBoxStatus>('idle');
  const [shakeKey, setShakeKey] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (active) return;
    setPin('');
    setStatus('idle');
    setErrorMsg('');
  }, [active]);

  const lockedOut = lockoutUntil !== null && lockoutUntil > now;
  useEffect(() => {
    if (!active || lockoutUntil === null) return;
    setNow(Date.now());
    const id = setInterval(() => {
      setNow(Date.now());
      clearExpiredLockout();
    }, 1000);
    return () => clearInterval(id);
  }, [active, lockoutUntil, clearExpiredLockout]);

  const secondsLeft = lockedOut
    ? Math.max(0, Math.ceil(((lockoutUntil ?? 0) - now) / 1000))
    : 0;

  const submit = useCallback(
    async (value: string) => {
      setIsVerifying(true);
      try {
        if (await verifyOwnerPin(value)) {
          void Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success,
          );
          resetFailedAttempts();
          setStatus('success');
          onSuccess();
          return;
        }
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        registerFailedAttempt();
        const until = useAuthStore.getState().lockoutUntil;
        const current = Date.now();
        setNow(current);
        setStatus('error');
        setShakeKey((k) => k + 1);
        setErrorMsg(t('pin.wrong_pin'));
        // Announced once here instead of a live region, which iOS ignores and TalkBack repeats every tick.
        AccessibilityInfo.announceForAccessibility(
          until !== null && until > current
            ? t('pin.locked_out', { seconds: Math.ceil((until - current) / 1000) })
            : t('pin.wrong_pin'),
        );
        setTimeout(() => {
          setPin('');
          setStatus('idle');
        }, WRONG_PIN_CLEAR_MS);
      } catch {
        setPin('');
        setErrorMsg(t('pin.verify_failed'));
        AccessibilityInfo.announceForAccessibility(t('pin.verify_failed'));
      } finally {
        setIsVerifying(false);
      }
    },
    [onSuccess, registerFailedAttempt, resetFailedAttempts, t],
  );

  const blocked = lockedOut || isVerifying || status !== 'idle';

  const handleDigit = (digit: string) => {
    if (blocked || pin.length >= OWNER_PIN_LENGTH) return;
    setErrorMsg('');
    const next = pin + digit;
    setPin(next);
    if (next.length === OWNER_PIN_LENGTH) void submit(next);
  };

  const handleBackspace = () => {
    if (blocked) return;
    setErrorMsg('');
    setPin((v) => v.slice(0, -1));
  };

  return {
    pin,
    boxStatus: lockedOut ? ('error' as const) : status,
    shakeKey,
    lockedOut,
    isVerifying,
    showError: lockedOut || status === 'error' || Boolean(errorMsg),
    message: lockedOut ? t('pin.locked_out', { seconds: secondsLeft }) : errorMsg,
    handleDigit,
    handleBackspace,
  };
};
