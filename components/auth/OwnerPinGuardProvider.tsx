import { createContext, useState, useEffect, FC } from 'react';
import { getAppSetting } from '@/database/settings';
import {
  authenticateOwner,
  getBiometricCapability,
} from '@/lib/auth/biometrics';
import { isOwnerPinConfigured } from '@/database/auth';
import { useAuthStore } from '@/stores/useAuthStore';
import { OwnerPinModal } from '@/components/auth/OwnerPinModal';
import { OwnerPinSetupModal } from '@/components/auth/OwnerPinSetupModal';
import { OwnerPinRecoveryModal } from '@/components/auth/OwnerPinRecoveryModal';
import { Alert } from '@/utils';
import { t } from 'i18next';

export interface GuardOptions {
  title?: string;
  actionDescription?: string;
  onApproved: () => Promise<void> | void;
}

export interface OwnerPinGuardContextType {
  runWithPinGuard: (options: GuardOptions) => Promise<void>;
}

export const OwnerPinGuardContext =
  createContext<OwnerPinGuardContextType | null>(null);

export const OwnerPinGuardProvider: FC<{
  children: React.ReactNode;
  isReady?: boolean;
}> = ({ children, isReady = true }) => {
  const { setIsPinConfigured } = useAuthStore();
  const [activeOptions, setActiveOptions] = useState<GuardOptions | null>(null);
  const [showChallenge, setShowChallenge] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);

  useEffect(() => {
    if (!isReady) return;
    let isMounted = true;
    isOwnerPinConfigured()
      .then((configured) => {
        if (isMounted) {
          setIsPinConfigured(configured);
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsPinConfigured(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [isReady, setIsPinConfigured]);

  const tryBiometricApproval = async (
    options: GuardOptions,
  ): Promise<'approved' | 'aborted' | 'fall-through'> => {
    if (useAuthStore.getState().isLockedOut()) return 'fall-through';
    let enabled: boolean = false;
    try {
      enabled = (await getAppSetting('biometric_unlock_enabled')) === '1';
    } catch {
      return 'fall-through';
    }
    if (!enabled) return 'fall-through';

    const capability = await getBiometricCapability();
    if (!capability.available || !capability.enrolled) return 'fall-through';

    const reason =
      options.actionDescription ??
      t('biometrics.reason_default', { ns: 'settings' });
    const result = await authenticateOwner(reason);

    if (result === 'success') {
      useAuthStore.getState().resetFailedAttempts();
      setActiveOptions(null);
      await options.onApproved();
      return 'approved';
    }
    if (result === 'cancelled') {
      setActiveOptions(null);
      return 'aborted';
    }
    return 'fall-through';
  };

  const runWithPinGuard = async (options: GuardOptions) => {
    setActiveOptions(options);
    let configured = false;
    try {
      configured = await isOwnerPinConfigured();
    } catch {
      setActiveOptions(null);
      Alert.alert(
        'Owner PIN Unavailable',
        'Owner PIN verification is currently unavailable. Please try again.',
      );
      return;
    }
    setIsPinConfigured(configured);
    if (!configured) {
      setShowSetup(true);
      return;
    }
    if ((await tryBiometricApproval(options)) === 'fall-through') {
      setShowChallenge(true);
    }
  };

  const handleChallengeSuccess = async () => {
    setShowChallenge(false);
    if (activeOptions) {
      const opts = activeOptions;
      setActiveOptions(null);
      await opts.onApproved();
    }
  };

  const handleSetupSuccess = async () => {
    setShowSetup(false);
    setIsPinConfigured(true);
    if (activeOptions) {
      const opts = activeOptions;
      setActiveOptions(null);
      await opts.onApproved();
    }
  };

  const handleRecoverySuccess = () => {
    setShowRecovery(false);
    setShowChallenge(true);
  };

  const handleCancel = () => {
    setShowChallenge(false);
    setShowSetup(false);
    setShowRecovery(false);
    setActiveOptions(null);
  };

  return (
    <OwnerPinGuardContext.Provider value={{ runWithPinGuard }}>
      {children}
      {showChallenge && (
        <OwnerPinModal
          visible={showChallenge}
          {...(activeOptions?.title !== undefined && {
            title: activeOptions.title,
          })}
          {...(activeOptions?.actionDescription !== undefined && {
            actionDescription: activeOptions.actionDescription,
          })}
          onSuccess={handleChallengeSuccess}
          onCancel={handleCancel}
          onForgotPin={() => {
            setShowChallenge(false);
            setShowRecovery(true);
          }}
        />
      )}
      {showSetup && (
        <OwnerPinSetupModal
          visible={showSetup}
          onSuccess={handleSetupSuccess}
          onCancel={handleCancel}
        />
      )}
      {showRecovery && (
        <OwnerPinRecoveryModal
          visible={showRecovery}
          onSuccess={handleRecoverySuccess}
          onCancel={handleCancel}
        />
      )}
    </OwnerPinGuardContext.Provider>
  );
};
