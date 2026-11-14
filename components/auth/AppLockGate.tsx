import { useCallback, useEffect, useRef, useState, FC, ReactNode } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { OwnerPinRecoveryModal } from '@/components/auth/OwnerPinRecoveryModal';
import { PinBoxes, type PinBoxStatus } from '@/components/auth/PinBoxes';
import { PinPad } from '@/components/auth/PinPad';
import { StyledText } from '@/components/elements/StyledText';
import { SariMascot } from '@/components/mascot';
import { isOwnerPinConfigured, verifyOwnerPin } from '@/database/auth';
import { getAppSetting } from '@/database/settings';
import {
  authenticateOwner,
  getBiometricCapability,
  type BiometricLabel,
} from '@/lib/auth/biometrics';
import { useAuthStore } from '@/stores/useAuthStore';

interface Props {
  isReady: boolean;
  children: ReactNode;
}

type Resolution = 'pending' | 'armed' | 'inert';
const PIN_LENGTH = 6;
const WRONG_PIN_CLEAR_MS = 600;

export const AppLockGate: FC<Props> = ({ isReady, children }) => {
  const { t } = useTranslation('settings');
  const insets = useSafeAreaInsets();
  const isAppUnlocked = useAuthStore((state) => state.isAppUnlocked);
  const markUnlocked = useAuthStore((state) => state.markUnlocked);
  const registerFailedAttempt = useAuthStore((s) => s.registerFailedAttempt);
  const resetFailedAttempts = useAuthStore((s) => s.resetFailedAttempts);
  const clearExpiredLockout = useAuthStore((s) => s.clearExpiredLockout);
  const lockoutUntil = useAuthStore((s) => s.lockoutUntil);
  const [resolution, setResolution] = useState<Resolution>('pending');
  const [showRecovery, setShowRecovery] = useState(false);
  const [biometric, setBiometric] = useState<BiometricLabel | null>(null);
  const [pin, setPin] = useState('');
  const [pinStatus, setPinStatus] = useState<PinBoxStatus>('idle');
  const [shakeKey, setShakeKey] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const autoPromptedRef = useRef(false);

  useEffect(() => {
    if (!isReady || resolution !== 'pending') return;
    let isMounted = true;
    Promise.all([
      getAppSetting('app_launch_lock_enabled'),
      isOwnerPinConfigured(),
    ])
      .then(([flag, hasPin]) => {
        if (!isMounted) return;
        if (flag === '1' && hasPin) {
          setResolution('armed');
        } else {
          setResolution('inert');
          markUnlocked();
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setResolution('inert');
        markUnlocked();
      });
    return () => {
      isMounted = false;
    };
  }, [isReady, resolution, markUnlocked]);

  const phase: 'resolving' | 'locked' | 'open' =
    resolution === 'pending'
      ? isReady
        ? 'resolving'
        : 'open'
      : resolution === 'inert' || isAppUnlocked
        ? 'open'
        : 'locked';

  const attempt = useCallback(async () => {
    const [flag, capability] = await Promise.all([
      getAppSetting('biometric_unlock_enabled').catch(() => null),
      getBiometricCapability(),
    ]);
    if (flag !== '1' || !capability.available || !capability.enrolled) {
      setBiometric(null);
      return;
    }
    setBiometric(capability.label);
    const result = await authenticateOwner(t('biometrics.reason_unlock'));
    if (result === 'success') markUnlocked();
  }, [markUnlocked, t]);

  useEffect(() => {
    if (phase !== 'locked') {
      autoPromptedRef.current = false;
      setPin('');
      setPinStatus('idle');
      setErrorMsg('');
      return;
    }
    if (autoPromptedRef.current) return;
    autoPromptedRef.current = true;
    void attempt();
  }, [phase, attempt]);

  const lockedOut = lockoutUntil !== null && lockoutUntil > now;
  useEffect(() => {
    if (lockoutUntil === null) return;
    setNow(Date.now());
    const id = setInterval(() => {
      setNow(Date.now());
      clearExpiredLockout();
    }, 1000);
    return () => clearInterval(id);
  }, [lockoutUntil, clearExpiredLockout]);

  const secondsLeft = lockedOut
    ? Math.max(0, Math.ceil(((lockoutUntil ?? 0) - now) / 1000))
    : 0;

  const submitPin = useCallback(
    async (value: string) => {
      setIsVerifying(true);
      try {
        const ok = await verifyOwnerPin(value);
        if (ok) {
          void Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success,
          );
          resetFailedAttempts();
          setPinStatus('success');
          markUnlocked();
          return;
        }
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        registerFailedAttempt();
        setNow(Date.now());
        setPinStatus('error');
        setShakeKey((k) => k + 1);
        setErrorMsg(t('pin.wrong_pin'));
        setTimeout(() => {
          setPin('');
          setPinStatus('idle');
        }, WRONG_PIN_CLEAR_MS);
      } catch {
        setPin('');
        setErrorMsg(t('pin.verify_failed'));
      } finally {
        setIsVerifying(false);
      }
    },
    [markUnlocked, registerFailedAttempt, resetFailedAttempts, t],
  );

  const padBlocked = lockedOut || isVerifying || pinStatus !== 'idle';

  const handleDigit = (digit: string) => {
    if (padBlocked || pin.length >= PIN_LENGTH) return;
    setErrorMsg('');
    const next = pin + digit;
    setPin(next);
    if (next.length === PIN_LENGTH) void submitPin(next);
  };

  const handleBackspace = () => {
    if (padBlocked) return;
    setErrorMsg('');
    setPin((v) => v.slice(0, -1));
  };

  if (phase === 'resolving') {
    return (
      <View testID="app-lock-flash" className="absolute inset-0 bg-paper-200" />
    );
  }

  const showError = lockedOut || pinStatus === 'error' || Boolean(errorMsg);

  return (
    <>
      {children}
      {phase === 'locked' ? (
        <View
          testID="app-lock-overlay"
          className="absolute inset-0 bg-paper-200 paper-texture"
        >
          <View
            className="flex-1"
            style={{
              paddingTop: insets.top + 24,
              paddingBottom: insets.bottom + 16,
            }}
          >
            <ScrollView
              bounces={false}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{
                flexGrow: 1,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              className="flex-1 px-6"
            >
              <SariMascot
                state={showError ? 'error' : 'default'}
                size={112}
                accessibilityLabel={t('biometrics.lock_sari_label')}
              />
              <StyledText
                variant="extrabold"
                accessibilityRole="header"
                className="text-[26px] text-ink-900 mt-2 text-center"
              >
                {t('biometrics.lock_title')}
              </StyledText>
              <StyledText
                variant="regular"
                className="text-[15px] text-ink-500 mt-1.5 text-center"
              >
                {t('biometrics.lock_subtitle')}
              </StyledText>

              <View className="mt-7">
                <PinBoxes
                  testID="app-lock-pin-boxes"
                  accessibilityLabel={t('pin.title')}
                  value={pin}
                  length={PIN_LENGTH}
                  status={lockedOut ? 'error' : pinStatus}
                  shakeKey={shakeKey}
                  active={!lockedOut}
                />
              </View>

              <View className="min-h-[44px] justify-center mt-1 w-full items-center">
                {lockedOut || errorMsg && (
                  <StyledText
                    variant="semibold"
                    accessibilityLiveRegion="polite"
                    className="text-semantic-danger text-sm text-center"
                  >
                    {lockedOut
                      ? t('pin.locked_out', { seconds: secondsLeft })
                      : errorMsg}
                  </StyledText>
                )}
              </View>
            </ScrollView>

            <View className="px-6">
              <PinPad
                disabled={lockedOut || isVerifying}
                onDigit={handleDigit}
                onBackspace={handleBackspace}
                leftSlot={
                  biometric ? (
                    <Pressable
                      testID="app-lock-retry"
                      accessibilityRole="button"
                      accessibilityLabel={t('biometrics.lock_retry')}
                      disabled={lockedOut || isVerifying}
                      onPress={() => void attempt()}
                      className="w-full h-full rounded-2xl bg-persimmon-50 border border-persimmon-200 items-center justify-center active:scale-95 active:bg-persimmon-100"
                    >
                      <FontAwesome5
                        name={biometric === 'face' ? 'smile' : 'fingerprint'}
                        size={26}
                        color="#E85A1F"
                      />
                    </Pressable>
                  ) : null
                }
              />

              <Pressable
                testID="app-lock-use-pin"
                accessibilityRole="button"
                onPress={() => setShowRecovery(true)}
                className="min-h-[48px] items-center justify-center mt-2 active:opacity-70"
              >
                <StyledText
                  variant="semibold"
                  className="text-persimmon-500 text-[15px]"
                >
                  {t('pin.forgot_pin')}
                </StyledText>
              </Pressable>
            </View>
          </View>

          <OwnerPinRecoveryModal
            visible={showRecovery}
            onSuccess={() => {
              setShowRecovery(false);
              markUnlocked();
            }}
            onCancel={() => setShowRecovery(false)}
          />
        </View>
      ) : null}
    </>
  );
};
