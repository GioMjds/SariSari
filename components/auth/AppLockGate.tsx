import { useCallback, useEffect, useRef, useState, FC, ReactNode } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { OwnerPinModal } from '@/components/auth/OwnerPinModal';
import { StyledText } from '@/components/elements/StyledText';
import { isOwnerPinConfigured } from '@/database/auth';
import { getAppSetting } from '@/database/settings';
import {
  authenticateOwner,
  getBiometricCapability,
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

export const AppLockGate: FC<Props> = ({ isReady, children }) => {
  const { t } = useTranslation('settings');
  const isAppUnlocked = useAuthStore((state) => state.isAppUnlocked);
  const markUnlocked = useAuthStore((state) => state.markUnlocked);
  const [resolution, setResolution] = useState<Resolution>('pending');
  const [showPin, setShowPin] = useState(false);
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
    // "lock on, biometrics off" must go straight to the PIN.
    const [flag, capability] = await Promise.all([
      getAppSetting('biometric_unlock_enabled').catch(() => null),
      getBiometricCapability(),
    ]);

    if (flag !== '1' || !capability.available || !capability.enrolled) {
      setShowPin(true);
      return;
    }

    const result = await authenticateOwner(t('biometrics.reason_unlock'));

    if (result === 'success') {
      markUnlocked();
      return;
    }

    if (result === 'fallback' || result === 'unavailable') {
      setShowPin(true);
      return;
    }

    // 'cancelled' and 'failed' leave the lock screen up with its retry button.
  }, [markUnlocked, t]);

  // Prompt once per lock, then hand control to the retry button.
  useEffect(() => {
    if (phase !== 'locked') {
      autoPromptedRef.current = false;
      return;
    }
    if (autoPromptedRef.current) return;
    autoPromptedRef.current = true;
    void attempt();
  }, [phase, attempt]);

  if (phase === 'resolving') {
    return <View testID="app-lock-flash" style={styles.flash} />;
  }

  return (
    <>
      {children}
      {phase === 'locked' ? (
        <View testID="app-lock-overlay" style={styles.overlay}>
          <StyledText variant="semibold" style={styles.title}>
            {t('biometrics.lock_title')}
          </StyledText>
          <StyledText variant="regular" style={styles.subtitle}>
            {t('biometrics.lock_subtitle')}
          </StyledText>
          <TouchableOpacity
            testID="app-lock-retry"
            style={styles.primaryBtn}
            onPress={() => void attempt()}
          >
            <StyledText variant="semibold" style={styles.primaryText}>
              {t('biometrics.lock_retry')}
            </StyledText>
          </TouchableOpacity>
          <TouchableOpacity
            testID="app-lock-use-pin"
            style={styles.secondaryBtn}
            onPress={() => setShowPin(true)}
          >
            <StyledText variant="semibold" style={styles.secondaryText}>
              {t('biometrics.lock_use_pin')}
            </StyledText>
          </TouchableOpacity>
          <OwnerPinModal
            visible={showPin}
            title={t('biometrics.lock_title')}
            onSuccess={() => {
              setShowPin(false);
              markUnlocked();
            }}
            onCancel={() => setShowPin(false)}
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  title: {
    fontSize: 22,
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#4B5563',
    marginBottom: 32,
    textAlign: 'center',
  },
  primaryBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 10,
    marginBottom: 12,
    minWidth: 220,
    alignItems: 'center',
  },
  primaryText: { color: '#fff', fontSize: 15 },
  secondaryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    minWidth: 220,
    alignItems: 'center',
  },
  secondaryText: { color: '#374151', fontSize: 15 },
});
