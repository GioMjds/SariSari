import { useCallback, useEffect, useRef, useState, FC, ReactNode } from 'react';
import { BackHandler, Modal, Pressable, View } from 'react-native';
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AuthScreenShell } from '@/components/auth/AuthScreenShell';
import { OwnerPinRecoveryModal } from '@/components/auth/OwnerPinRecoveryModal';
import { OWNER_PIN_LENGTH } from '@/components/auth/OwnerPinSetupFlow';
import { PinBoxes } from '@/components/auth/PinBoxes';
import { PinPad } from '@/components/auth/PinPad';
import { useOwnerPinEntry } from '@/components/auth/useOwnerPinEntry';
import { StyledText } from '@/components/elements/StyledText';
import { SariWordmark } from '@/components/brand/SariWordmark';
import { isOwnerPinConfigured } from '@/database/auth';
import { getAppSetting } from '@/database/settings';
import {
  authenticateOwner,
  getBiometricCapability,
  type BiometricLabel,
} from '@/lib/auth/biometrics';
import { ICON_COLOR } from '@/lib/theme';
import { useAuthStore } from '@/stores/useAuthStore';

interface Props {
  isReady: boolean;
  children: ReactNode;
}

type Resolution = 'pending' | 'armed' | 'inert';

const BIOMETRIC_LABEL_KEY = {
  face: 'biometrics.lock_biometric_face',
  fingerprint: 'biometrics.lock_biometric_fingerprint',
  iris: 'biometrics.lock_biometric_generic',
  none: 'biometrics.lock_biometric_generic',
} as const satisfies Record<BiometricLabel, string>;

export const AppLockGate: FC<Props> = ({ isReady, children }) => {
  const { t } = useTranslation('settings');
  const isAppUnlocked = useAuthStore((state) => state.isAppUnlocked);
  const markUnlocked = useAuthStore((state) => state.markUnlocked);
  const [resolution, setResolution] = useState<Resolution>('pending');
  const [showRecovery, setShowRecovery] = useState(false);
  const [biometric, setBiometric] = useState<BiometricLabel | null>(null);
  const autoPromptedRef = useRef(false);

  useEffect(() => {
    if (!isReady || resolution !== 'pending') return;
    let isMounted = true;
    Promise.all([
      getAppSetting('app_launch_lock_enabled'),
      isOwnerPinConfigured(),
      useAuthStore.getState().hydrateLockout(),
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
    if (result !== 'success') return;
    useAuthStore.getState().resetFailedAttempts();
    markUnlocked();
  }, [markUnlocked, t]);

  useEffect(() => {
    if (phase !== 'locked') {
      autoPromptedRef.current = false;
      return;
    }
    if (autoPromptedRef.current) return;
    autoPromptedRef.current = true;
    void attempt();
  }, [phase, attempt]);

  const locked = phase === 'locked';
  const entry = useOwnerPinEntry(locked, markUnlocked);
  const hidden = phase !== 'open';

  return (
    <>
      {/* Hidden from screen readers while locked so the app behind cannot be focused or activated. */}
      <View
        style={{ flex: 1 }}
        importantForAccessibility={hidden ? 'no-hide-descendants' : 'auto'}
        accessibilityElementsHidden={hidden}
      >
        {children}
      </View>
      {hidden ? (
        <View testID="app-lock-flash" className="absolute inset-0 bg-paper-200" />
      ) : null}
      {/* A native modal so sheets and dialogs left open before backgrounding stay underneath the lock. */}
      <Modal
        visible={locked}
        animationType="none"
        presentationStyle="fullScreen"
        statusBarTranslucent
        onRequestClose={() => BackHandler.exitApp()}
      >
        <View
          testID="app-lock-overlay"
          accessibilityViewIsModal
          className="flex-1 bg-paper-200"
        >
          <AuthScreenShell
            sari={entry.showError ? 'error' : 'default'}
            sariLabel={t('biometrics.lock_sari_label')}
            title={t('biometrics.lock_title')}
            titleArt={<SariWordmark height={46} decorative={true} />}
            subtitle={t('biometrics.lock_subtitle')}
            footer={
              <>
                <PinPad
                  disabled={entry.lockedOut}
                  onDigit={entry.handleDigit}
                  onBackspace={entry.handleBackspace}
                  leftSlot={
                    biometric ? (
                      <Pressable
                        testID="app-lock-retry"
                        accessibilityRole="button"
                        accessibilityLabel={t(BIOMETRIC_LABEL_KEY[biometric])}
                        disabled={entry.lockedOut || entry.isVerifying}
                        onPress={() => void attempt()}
                        className="w-full h-full rounded-2xl bg-persimmon-50 border border-persimmon-200 items-center justify-center active:scale-95 active:bg-persimmon-100"
                      >
                        {biometric === 'face' ? (
                          <MaterialCommunityIcons
                            name="face-recognition"
                            size={28}
                            color={ICON_COLOR.persimmon}
                          />
                        ) : (
                          <FontAwesome5
                            name="fingerprint"
                            size={26}
                            color={ICON_COLOR.persimmon}
                          />
                        )}
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
                    className="text-persimmon-700 text-[15px]"
                  >
                    {t('pin.forgot_pin')}
                  </StyledText>
                </Pressable>
              </>
            }
          >
            <PinBoxes
              testID="app-lock-pin-boxes"
              accessibilityLabel={t('pin.title')}
              value={entry.pin}
              length={OWNER_PIN_LENGTH}
              status={entry.boxStatus}
              shakeKey={entry.shakeKey}
              active={!entry.lockedOut}
            />
            <View className="min-h-[44px] justify-center mt-1 w-full items-center">
              {entry.message ? (
                <StyledText
                  variant="semibold"
                  className="text-semantic-danger text-sm text-center"
                >
                  {entry.message}
                </StyledText>
              ) : null}
            </View>
          </AuthScreenShell>

          <OwnerPinRecoveryModal
            visible={showRecovery}
            onSuccess={() => {
              setShowRecovery(false);
              markUnlocked();
            }}
            onCancel={() => setShowRecovery(false)}
          />
        </View>
      </Modal>
    </>
  );
};
