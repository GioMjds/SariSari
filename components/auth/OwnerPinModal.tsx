import { useCallback, useEffect, useState, FC } from 'react';
import { Modal, Pressable, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { verifyOwnerPin } from '@/database/auth';
import { useAuthStore } from '@/stores/useAuthStore';
import { StyledText } from '@/components/elements/StyledText';
import { AuthScreenShell } from './AuthScreenShell';
import { PinBoxes, type PinBoxStatus } from './PinBoxes';
import { PinPad } from './PinPad';

interface Props {
  visible: boolean;
  title?: string;
  actionDescription?: string;
  onSuccess: () => void;
  onCancel: () => void;
  onForgotPin?: () => void;
}

const PIN_LENGTH = 6;
const WRONG_PIN_CLEAR_MS = 400;

/** Full-screen owner PIN challenge styled like the app lock screen. */
export const OwnerPinModal: FC<Props> = ({
  visible,
  title,
  actionDescription,
  onSuccess,
  onCancel,
  onForgotPin,
}) => {
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
    if (visible) return;
    setPin('');
    setStatus('idle');
    setErrorMsg('');
  }, [visible]);

  const lockedOut = lockoutUntil !== null && lockoutUntil > now;
  useEffect(() => {
    if (!visible || lockoutUntil === null) return;
    setNow(Date.now());
    const id = setInterval(() => {
      setNow(Date.now());
      clearExpiredLockout();
    }, 1000);
    return () => clearInterval(id);
  }, [visible, lockoutUntil, clearExpiredLockout]);

  const secondsLeft = lockedOut
    ? Math.max(0, Math.ceil(((lockoutUntil ?? 0) - now) / 1000))
    : 0;

  const submitPin = useCallback(
    async (value: string) => {
      setIsVerifying(true);
      try {
        if (await verifyOwnerPin(value)) {
          void Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success,
          );
          resetFailedAttempts();
          setStatus('success');
          setPin('');
          onSuccess();
          return;
        }
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        registerFailedAttempt();
        setNow(Date.now());
        setStatus('error');
        setShakeKey((k) => k + 1);
        setErrorMsg(t('pin.wrong_pin'));
        setTimeout(() => {
          setPin('');
          setStatus('idle');
        }, WRONG_PIN_CLEAR_MS);
      } catch {
        setPin('');
        setErrorMsg(t('pin.verify_failed'));
      } finally {
        setIsVerifying(false);
      }
    },
    [onSuccess, registerFailedAttempt, resetFailedAttempts, t],
  );

  const padBlocked = lockedOut || isVerifying || status !== 'idle';

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

  const showError = lockedOut || status === 'error' || Boolean(errorMsg);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <View className="flex-1 bg-paper-200">
        <AuthScreenShell
          sari={showError ? 'error' : 'default'}
          title={title || t('pin.title')}
          subtitle={actionDescription || t('pin.enter_pin')}
          onBack={onCancel}
          backLabel={t('pin.back_a11y')}
          footer={
            <>
              <PinPad
                disabled={lockedOut || isVerifying}
                onDigit={handleDigit}
                onBackspace={handleBackspace}
              />
              {onForgotPin ? (
                <Pressable
                  testID="owner-pin-forgot"
                  accessibilityRole="button"
                  onPress={onForgotPin}
                  className="min-h-[48px] items-center justify-center mt-2 active:opacity-70"
                >
                  <StyledText
                    variant="semibold"
                    className="text-persimmon-500 text-[15px]"
                  >
                    {t('pin.forgot_pin')}
                  </StyledText>
                </Pressable>
              ) : null}
            </>
          }
        >
          <PinBoxes
            testID="owner-pin-boxes"
            accessibilityLabel={t('pin.enter_pin')}
            value={pin}
            length={PIN_LENGTH}
            status={lockedOut ? 'error' : status}
            shakeKey={shakeKey}
            active={!lockedOut}
          />
          <View className="min-h-[44px] justify-center mt-1 w-full items-center">
            {showError && (lockedOut || errorMsg) ? (
              <StyledText
                variant="semibold"
                accessibilityLiveRegion="polite"
                className="text-semantic-danger text-sm text-center"
              >
                {lockedOut
                  ? t('pin.locked_out', { seconds: secondsLeft })
                  : errorMsg}
              </StyledText>
            ) : null}
          </View>
        </AuthScreenShell>
      </View>
    </Modal>
  );
};
