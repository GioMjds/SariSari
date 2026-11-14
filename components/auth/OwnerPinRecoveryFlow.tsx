import { FC, useEffect, useState } from 'react';
import { View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { verifyAndResetOwnerPinWithRecoveryCode } from '@/database/auth';
import { useAuthStore } from '@/stores/useAuthStore';
import { StyledText } from '@/components/elements/StyledText';
import { AuthButton, AuthScreenShell } from './AuthScreenShell';
import { CodeBoxes } from './CodeBoxes';
import { PinBoxes, type PinBoxStatus } from './PinBoxes';
import { PinPad } from './PinPad';
import { OWNER_PIN_LENGTH } from './OwnerPinSetupFlow';

const RECOVERY_CODE_LENGTH = 8;
const ADVANCE_DELAY_MS = 180;
const MISMATCH_CLEAR_MS = 600;

type Step = 'code' | 'new' | 'confirm' | 'done';

interface Props {
  onDone: () => void;
  onCancel: () => void;
}

export const OwnerPinRecoveryFlow: FC<Props> = ({ onDone, onCancel }) => {
  const { t } = useTranslation('settings');
  const resetFailedAttempts = useAuthStore((s) => s.resetFailedAttempts);
  const [step, setStep] = useState<Step>('code');
  const [code, setCode] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [status, setStatus] = useState<PinBoxStatus>('idle');
  const [shakeKey, setShakeKey] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (step !== 'new' || pin.length !== OWNER_PIN_LENGTH) return;
    const id = setTimeout(() => setStep('confirm'), ADVANCE_DELAY_MS);
    return () => clearTimeout(id);
  }, [step, pin]);

  useEffect(() => {
    if (step !== 'confirm' || confirmPin.length !== OWNER_PIN_LENGTH) return;

    if (confirmPin !== pin) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setStatus('error');
      setShakeKey((k) => k + 1);
      setErrorMsg(t('pin.pin_mismatch'));
      const id = setTimeout(() => {
        setConfirmPin('');
        setStatus('idle');
      }, MISMATCH_CLEAR_MS);
      return () => clearTimeout(id);
    }

    let cancelled = false;
    setIsSubmitting(true);
    verifyAndResetOwnerPinWithRecoveryCode(code, pin)
      .then((ok) => {
        if (cancelled) return;
        if (ok) {
          void Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success,
          );
          resetFailedAttempts();
          setStep('done');
          return;
        }
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setPin('');
        setConfirmPin('');
        setStatus('idle');
        setStep('code');
        setErrorMsg(t('pin.invalid_code'));
      })
      .catch(() => {
        if (cancelled) return;
        setConfirmPin('');
        setErrorMsg(t('pin.reset_failed'));
      })
      .finally(() => {
        if (!cancelled) setIsSubmitting(false);
      });
    return () => {
      cancelled = true;
    };
  }, [step, confirmPin, pin, code, resetFailedAttempts, t]);

  const activeValue = step === 'new' ? pin : confirmPin;
  const setActive = step === 'new' ? setPin : setConfirmPin;

  const handleDigit = (digit: string) => {
    if (isSubmitting || status === 'error') return;
    if (activeValue.length >= OWNER_PIN_LENGTH) return;
    setErrorMsg('');
    setActive((v) => (v + digit).slice(0, OWNER_PIN_LENGTH));
  };

  const handleBackspace = () => {
    if (isSubmitting || status === 'error') return;
    setErrorMsg('');
    setActive((v) => v.slice(0, -1));
  };

  const handleBack = () => {
    setErrorMsg('');
    setStatus('idle');
    if (step === 'confirm') {
      setPin('');
      setConfirmPin('');
      setStep('new');
      return;
    }
    if (step === 'new') {
      setPin('');
      setStep('code');
      return;
    }
    onCancel();
  };

  if (step === 'done') {
    return (
      <AuthScreenShell
        sari="balance-cleared"
        title={t('pin.reset_success_title')}
        subtitle={t('pin.reset_success_sub')}
        footer={
          <AuthButton
            testID="pin-recovery-done"
            variant="success"
            label={t('pin.btn_done')}
            onPress={onDone}
          />
        }
      >
        <View />
      </AuthScreenShell>
    );
  }

  if (step === 'code') {
    const ready = code.length === RECOVERY_CODE_LENGTH;
    return (
      <AuthScreenShell
        sari={errorMsg ? 'error' : 'default'}
        title={t('pin.reset_code_title')}
        subtitle={t('pin.reset_code_sub')}
        step={1}
        totalSteps={3}
        stepLabel={t('pin.step_label', { current: 1, total: 3 })}
        onBack={handleBack}
        backLabel={t('pin.back_a11y')}
        footer={
          <AuthButton
            testID="pin-recovery-next"
            label={t('pin.btn_continue')}
            disabled={!ready}
            onPress={() => {
              setErrorMsg('');
              setStep('new');
            }}
          />
        }
      >
        <CodeBoxes
          testID="pin-recovery-code-input"
          value={code}
          onChange={(next) => {
            setErrorMsg('');
            setCode(next);
          }}
          length={RECOVERY_CODE_LENGTH}
          hasError={Boolean(errorMsg)}
          autoFocus
          accessibilityLabel={t('pin.enter_recovery_code')}
        />
        <View className="min-h-[40px] justify-center mt-3">
          {errorMsg ? (
            <StyledText
              variant="semibold"
              accessibilityLiveRegion="polite"
              className="text-semantic-danger text-sm text-center"
            >
              {errorMsg}
            </StyledText>
          ) : null}
        </View>
      </AuthScreenShell>
    );
  }

  const isConfirm = step === 'confirm';
  return (
    <AuthScreenShell
      sari="settings"
      title={
        isConfirm ? t('pin.setup_confirm_title') : t('pin.reset_new_title')
      }
      subtitle={isConfirm ? t('pin.setup_confirm_sub') : t('pin.reset_new_sub')}
      step={isConfirm ? 3 : 2}
      totalSteps={3}
      stepLabel={t('pin.step_label', { current: isConfirm ? 3 : 2, total: 3 })}
      onBack={handleBack}
      backLabel={t('pin.back_a11y')}
      footer={
        <PinPad
          onDigit={handleDigit}
          onBackspace={handleBackspace}
          disabled={isSubmitting}
        />
      }
    >
      <PinBoxes
        testID="pin-recovery-boxes"
        accessibilityLabel={
          isConfirm ? t('pin.confirm_label') : t('pin.create_label')
        }
        value={activeValue}
        length={OWNER_PIN_LENGTH}
        status={status}
        shakeKey={shakeKey}
      />
      <View className="min-h-[40px] justify-center mt-3">
        {errorMsg ? (
          <StyledText
            variant="semibold"
            accessibilityLiveRegion="polite"
            className="text-semantic-danger text-sm text-center"
          >
            {errorMsg}
          </StyledText>
        ) : null}
      </View>
    </AuthScreenShell>
  );
};
