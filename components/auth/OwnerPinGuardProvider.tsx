import { createContext, useState, useEffect, FC } from 'react';
import { isOwnerPinConfigured } from '@/database/auth';
import { useAuthStore } from '@/stores/useAuthStore';
import { OwnerPinModal } from '@/components/auth/OwnerPinModal';
import { OwnerPinSetupModal } from '@/components/auth/OwnerPinSetupModal';
import { OwnerPinRecoveryModal } from '@/components/auth/OwnerPinRecoveryModal';

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

export const OwnerPinGuardProvider: FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { setIsPinConfigured } = useAuthStore();
  const [activeOptions, setActiveOptions] = useState<GuardOptions | null>(null);
  const [showChallenge, setShowChallenge] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);

  useEffect(() => {
    isOwnerPinConfigured().then(setIsPinConfigured);
  }, [setIsPinConfigured]);

  const runWithPinGuard = async (options: GuardOptions) => {
    setActiveOptions(options);
    const configured = await isOwnerPinConfigured();
    setIsPinConfigured(configured);
    if (!configured) {
      setShowSetup(true);
    } else {
      setShowChallenge(true);
    }
  };

  const handleChallengeSuccess = async () => {
    setShowChallenge(false);
    if (activeOptions) {
      await activeOptions.onApproved();
      setActiveOptions(null);
    }
  };

  const handleSetupSuccess = async () => {
    setShowSetup(false);
    setIsPinConfigured(true);
    if (activeOptions) {
      await activeOptions.onApproved();
      setActiveOptions(null);
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
      <OwnerPinModal
        visible={showChallenge}
        {...(activeOptions?.title !== undefined && { title: activeOptions.title })}
        {...(activeOptions?.actionDescription !== undefined && { actionDescription: activeOptions.actionDescription })}
        onSuccess={handleChallengeSuccess}
        onCancel={handleCancel}
        onForgotPin={() => {
          setShowChallenge(false);
          setShowRecovery(true);
        }}
      />
      <OwnerPinSetupModal
        visible={showSetup}
        onSuccess={handleSetupSuccess}
        onCancel={handleCancel}
      />
      <OwnerPinRecoveryModal
        visible={showRecovery}
        onSuccess={handleRecoverySuccess}
        onCancel={handleCancel}
      />
    </OwnerPinGuardContext.Provider>
  );
};
