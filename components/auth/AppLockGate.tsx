import { useCallback, useEffect, useRef, useState, FC, ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
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

/**
 * `pending` - the launch-lock flag has not been read yet.
 * `armed`   - the lock is on; the tree stays covered until markUnlocked() runs.
 * `inert`   - the lock is off for this session and never engages again.
 */
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

  // Resolve the lock once per app session. A launch lock with no owner PIN
  // would have no fallback, so "no PIN" resolves the same way as "flag off".
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
        // Fail open. A lock the owner cannot get past is worse than no lock,
        // and a database broken enough to throw here has already routed to
        // DatabaseErrorScreen before isReady ever turned true.
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
    // Read the biometric toggle on every attempt, not once at resolution:
    // "lock on, biometrics off" must leave only the PIN pad.
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
    if (result === 'success') {
      markUnlocked();
    }
    // Every other result leaves the inline PIN pad up. The sensor key on the
    // pad is the retry.
  }, [markUnlocked, t]);

  // Prompt once per lock, then hand control to the pad.
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

  // Lockout countdown. Ticks only while a lockout is active.
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
    return <View testID="app-lock-flash" style={styles.flash} />;
  }

  const showError = lockedOut || pinStatus === 'error' || Boolean(errorMsg);

  return (
    <>
      {children}
      {phase === 'locked' ? (
        <View testID="app-lock-overlay" style={styles.overlay}>
          <ScrollView
            bounces={false}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[
              styles.content,
              {
                paddingTop: insets.top + 24,
                paddingBottom: insets.bottom + 24,
              },
            ]}
          >
            <SariMascot
              state={showError ? 'error' : 'default'}
              size={112}
              accessibilityLabel={t('biometrics.lock_sari_label')}
            />
            <StyledText
              variant="extrabold"
              accessibilityRole="header"
              style={styles.title}
            >
              {t('biometrics.lock_title')}
            </StyledText>
            <StyledText variant="regular" style={styles.subtitle}>
              {t('biometrics.lock_subtitle')}
            </StyledText>

            <View style={styles.boxes}>
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
            <View style={styles.messageSlot}>
              {lockedOut || errorMsg ? (
                <StyledText
                  variant="semibold"
                  accessibilityLiveRegion="polite"
                  style={styles.errorText}
                >
                  {lockedOut
                    ? t('pin.locked_out', { seconds: secondsLeft })
                    : errorMsg}
                </StyledText>
              ) : pin.length >= 4 && pin.length < PIN_LENGTH && !padBlocked ? (
                // PINs made before the 6-digit rule are 4-5 digits long and
                // never reach the auto-submit length.
                <Pressable
                  testID="app-lock-submit"
                  accessibilityRole="button"
                  onPress={() => void submitPin(pin)}
                  style={({ pressed }) => [
                    styles.submitPill,
                    pressed && styles.pressed,
                  ]}
                >
                  <StyledText variant="semibold" style={styles.submitText}>
                    {t('pin.btn_unlock')}
                  </StyledText>
                </Pressable>
              ) : null}
            </View>

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
                    style={({ pressed }) => [
                      styles.bioKey,
                      pressed && styles.pressed,
                    ]}
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
              style={({ pressed }) => [
                styles.forgot,
                pressed && styles.pressed,
              ]}
            >
              <StyledText variant="semibold" style={styles.forgotText}>
                {t('pin.forgot_pin')}
              </StyledText>
            </Pressable>
          </ScrollView>

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

const styles = StyleSheet.create({
  flash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F7F6F2',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F7F6F2',
  },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 26,
    color: '#28231D',
    marginTop: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#564E45',
    marginTop: 6,
    textAlign: 'center',
  },
  boxes: { marginTop: 28 },
  messageSlot: { minHeight: 44, justifyContent: 'center' },
  errorText: { color: '#C22D2D', fontSize: 14, textAlign: 'center' },
  submitPill: {
    alignSelf: 'center',
    minHeight: 44,
    paddingHorizontal: 28,
    borderRadius: 22,
    backgroundColor: '#E85A1F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: { color: '#FFFFFF', fontSize: 15 },
  bioKey: {
    width: 76,
    height: 60,
    borderRadius: 18,
    backgroundColor: '#FFF4EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  forgot: {
    minHeight: 48,
    paddingHorizontal: 16,
    marginTop: 12,
    justifyContent: 'center',
  },
  forgotText: { color: '#E85A1F', fontSize: 15 },
  pressed: { opacity: 0.7 },
});
