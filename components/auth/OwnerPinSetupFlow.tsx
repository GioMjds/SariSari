import { FC, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
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
  /** Called once the owner confirms they saved the recovery code. */
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

  // Create -> confirm, after a beat so the sixth box is seen filling.
  useEffect(() => {
    if (step !== 'create' || pin.length !== OWNER_PIN_LENGTH) return;
    const id = setTimeout(() => setStep('confirm'), ADVANCE_DELAY_MS);
    return () => clearTimeout(id);
  }, [step, pin]);

  // Confirm: mismatch shakes and clears, match saves the PIN.
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
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
  const padLocked = isSubmitting || status === 'error' || activeValue.length >= OWNER_PIN_LENGTH;

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
        <View style={styles.codeCard} testID="pin-setup-code-card">
          <StyledText variant="semibold" style={styles.codeCaption}>
            {t('pin.recovery_code_label')}
          </StyledText>
          <StyledText
            variant="extrabold"
            selectable
            accessibilityLabel={recoveryCode.split('').join(' ')}
            style={styles.codeText}
          >
            {recoveryCode}
          </StyledText>
          <Pressable
            testID="pin-setup-copy"
            onPress={() => void handleCopy()}
            accessibilityRole="button"
            style={({ pressed }) => [styles.copyBtn, pressed && styles.pressed]}
          >
            <FontAwesome
              name={copied ? 'check' : 'clone'}
              size={14}
              color="#E85A1F"
            />
            <StyledText variant="semibold" style={styles.copyText}>
              {copied ? t('pin.code_copied') : t('pin.copy_code')}
            </StyledText>
          </Pressable>
        </View>

        <Pressable
          testID="pin-setup-ack"
          onPress={() => setAcknowledged((v) => !v)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: acknowledged }}
          style={styles.ackRow}
        >
          <View style={[styles.check, acknowledged && styles.checkOn]}>
            {acknowledged ? (
              <FontAwesome name="check" size={13} color="#FFFFFF" />
            ) : null}
          </View>
          <StyledText variant="medium" style={styles.ackText}>
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
      title={isConfirm ? t('pin.setup_confirm_title') : t('pin.setup_create_title')}
      subtitle={isConfirm ? t('pin.setup_confirm_sub') : t('pin.setup_create_sub')}
      step={isConfirm ? 2 : 1}
      totalSteps={3}
      stepLabel={t('pin.step_label', { current: isConfirm ? 2 : 1, total: 3 })}
      onBack={handleBack}
      backLabel={t('pin.back_a11y')}
    >
      <PinBoxes
        testID="pin-setup-boxes"
        accessibilityLabel={isConfirm ? t('pin.confirm_label') : t('pin.create_label')}
        value={activeValue}
        length={OWNER_PIN_LENGTH}
        status={status}
        shakeKey={shakeKey}
      />
      <View style={styles.errorSlot}>
        {errorMsg ? (
          <StyledText
            variant="semibold"
            accessibilityLiveRegion="polite"
            style={styles.errorText}
          >
            {errorMsg}
          </StyledText>
        ) : null}
      </View>
      <PinPad
        onDigit={handleDigit}
        onBackspace={handleBackspace}
        disabled={isSubmitting}
      />
    </AuthScreenShell>
  );
};

const styles = StyleSheet.create({
  errorSlot: { minHeight: 40, justifyContent: 'center', marginBottom: 12 },
  errorText: { color: '#C22D2D', fontSize: 14, textAlign: 'center' },
  codeCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5DFD7',
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  codeCaption: { fontSize: 13, color: '#6B7280', marginBottom: 8 },
  codeText: { fontSize: 34, letterSpacing: 4, color: '#28231D' },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  copyText: { color: '#E85A1F', fontSize: 15 },
  ackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 48,
    marginTop: 20,
    width: '100%',
  },
  check: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#C3BAB1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: { backgroundColor: '#16A34A', borderColor: '#16A34A' },
  ackText: { flex: 1, fontSize: 15, color: '#3E3831' },
  pressed: { opacity: 0.7 },
});
