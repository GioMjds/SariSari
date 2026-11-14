import { FC, useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { setupOwnerPin } from '@/database/auth';
import { useAuthStore } from '@/stores/useAuthStore';
import { StyledText } from '@/components/elements/StyledText';
import { AuthButton, AuthScreenShell } from './AuthScreenShell';
import { PinBoxes, type PinBoxStatus } from './PinBoxes';
import { PinPad } from './PinPad';

export const OWNER_PIN_LENGTH = 6;
const ADVANCE_DELAY_MS = 180;
const MISMATCH_CLEAR_MS = 600;
const COPIED_RESET_MS = 2000;

type Step = 'create' | 'confirm' | 'code';

interface Props {
  onDone: () => void;
  onCancel: () => void;
}

export const OwnerPinSetupFlow: FC<Props> = ({ onDone, onCancel }) => {
  const { t } = useTranslation('settings');
  const setIsPinConfigured = useAuthStore((s) => s.setIsPinConfigured);
  const [step, setStep] = useState<Step>('create');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [status, setStatus] = useState<PinBoxStatus>('idle');
  const [shakeKey, setShakeKey] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  useEffect(() => {
    if (step !== 'create' || pin.length !== OWNER_PIN_LENGTH) return;
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
    setupOwnerPin(pin)
      .then((res) => {
        if (cancelled) return;
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
        setIsPinConfigured(true);
        setRecoveryCode(res.recoveryCode);
        setStep('code');
      })
      .catch(() => {
        if (cancelled) return;
        setErrorMsg(t('pin.setup_failed'));
        setConfirmPin('');
      })
      .finally(() => {
        if (!cancelled) setIsSubmitting(false);
      });
    return () => {
      cancelled = true;
    };
  }, [step, confirmPin, pin, setIsPinConfigured, t]);

  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), COPIED_RESET_MS);
    return () => clearTimeout(id);
  }, [copied]);

  const activeValue = step === 'create' ? pin : confirmPin;
  const setActive = step === 'create' ? setPin : setConfirmPin;
  const padLocked =
    isSubmitting ||
    status === 'error' ||
    activeValue.length >= OWNER_PIN_LENGTH;

  const handleDigit = (digit: string) => {
    if (padLocked) return;
    setErrorMsg('');
    setActive((v) => (v + digit).slice(0, OWNER_PIN_LENGTH));
  };

  const handleBackspace = () => {
    if (isSubmitting || status === 'error') return;
    setErrorMsg('');
    setActive((v) => v.slice(0, -1));
  };

  const handleBack = () => {
    if (step === 'confirm') {
      setConfirmPin('');
      setPin('');
      setStatus('idle');
      setErrorMsg('');
      setStep('create');
      return;
    }
    onCancel();
  };

  const handleCopy = async () => {
    await Clipboard.setStringAsync(recoveryCode);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
  };

  if (step === 'code') {
    return (
      <AuthScreenShell
        sari="balance-cleared"
        title={t('pin.recovery_title')}
        subtitle={t('pin.recovery_desc')}
        step={3}
        totalSteps={3}
        stepLabel={t('pin.step_label', { current: 3, total: 3 })}
        footer={
          <AuthButton
            testID="pin-setup-done"
            variant="success"
            label={t('pin.btn_done')}
            disabled={!acknowledged}
            onPress={onDone}
          />
        }
      >
        <View
          className="w-full bg-paper-50 rounded-2xl border border-paper-300 py-5 px-4 items-center"
          testID="pin-setup-code-card"
        >
          <StyledText
            variant="semibold"
            className="text-[13px] text-ink-500 mb-2"
          >
            {t('pin.recovery_code_label')}
          </StyledText>
          <StyledText
            variant="extrabold"
            selectable
            accessibilityLabel={recoveryCode.split('').join(' ')}
            className="text-[34px] tracking-[4px] text-ink-900"
          >
            {recoveryCode}
          </StyledText>
          <Pressable
            testID="pin-setup-copy"
            onPress={() => void handleCopy()}
            accessibilityRole="button"
            className="flex-row items-center gap-x-2 min-h-[44px] px-4 mt-3 active:opacity-70"
          >
            <FontAwesome
              name={copied ? 'check' : 'clone'}
              size={14}
              color="#E85A1F"
            />
            <StyledText
              variant="semibold"
              className="text-persimmon-500 text-[15px]"
            >
              {copied ? t('pin.code_copied') : t('pin.copy_code')}
            </StyledText>
          </Pressable>
        </View>

        <Pressable
          testID="pin-setup-ack"
          onPress={() => setAcknowledged((v) => !v)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: acknowledged }}
          className="flex-row items-center gap-x-3 min-h-[48px] mt-5 w-full active:opacity-70"
        >
          <View
            className={`w-[26px] h-[26px] rounded-lg border-2 items-center justify-center ${acknowledged ? 'bg-sage-500 border-sage-500' : 'bg-paper-50 border-paper-400'}`}
          >
            {acknowledged ? (
              <FontAwesome name="check" size={13} color="#FFFFFF" />
            ) : null}
          </View>
          <StyledText
            variant="medium"
            className="flex-1 text-[15px] text-ink-700"
          >
            {t('pin.recovery_saved_ack')}
          </StyledText>
        </Pressable>
      </AuthScreenShell>
    );
  }

  const isConfirm = step === 'confirm';

  return (
    <AuthScreenShell
      sari="settings"
      title={
        isConfirm ? t('pin.setup_confirm_title') : t('pin.setup_create_title')
      }
      subtitle={
        isConfirm ? t('pin.setup_confirm_sub') : t('pin.setup_create_sub')
      }
      step={isConfirm ? 2 : 1}
      totalSteps={3}
      stepLabel={t('pin.step_label', { current: isConfirm ? 2 : 1, total: 3 })}
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
        testID="pin-setup-boxes"
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
