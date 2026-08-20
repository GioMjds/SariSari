import { FC, useEffect, useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useTranslation } from 'react-i18next';
import { setupOwnerPin } from '@/database/auth';
import { useAuthStore } from '@/stores/useAuthStore';
import { StyledText } from '@/components/elements/StyledText';

interface Props {
  visible: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

export const OwnerPinSetupModal: FC<Props> = ({
  visible,
  onSuccess,
  onCancel,
}) => {
  const { t } = useTranslation('settings');
  const [step, setStep] = useState<'create' | 'confirm' | 'code'>('create');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const setIsPinConfigured = useAuthStore((s) => s.setIsPinConfigured);

  useEffect(() => {
    if (visible) return;
    setStep('create');
    setPin('');
    setConfirmPin('');
    setErrorMsg('');
    setRecoveryCode('');
    setCopied(false);
  }, [visible]);

  if (!visible) return null;

  const handleNext = async () => {
    if (isSubmitting) return;
    if (step === 'create') {
      if (pin.length < 4 || pin.length > 6) {
        setErrorMsg(t('pin.pin_length_invalid'));
        return;
      }
      setStep('confirm');
    } else if (step === 'confirm') {
      if (pin !== confirmPin) {
        setErrorMsg(t('pin.pin_mismatch'));
        return;
      }
      setIsSubmitting(true);
      try {
        const res = await setupOwnerPin(pin);
        setIsPinConfigured(true);
        setRecoveryCode(res.recoveryCode);
        setStep('code');
      } catch {
        setErrorMsg(t('pin.setup_failed'));
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleCopyCode = async () => {
    await Clipboard.setStringAsync(recoveryCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View style={styles.backdrop}>
      <View style={styles.card}>
        {step !== 'code' ? (
          <>
            <StyledText variant="semibold" style={styles.title}>
              {t('pin.setup_title')}
            </StyledText>
            <StyledText variant="regular" style={styles.label}>
              {step === 'create' ? t('pin.enter_pin') : t('pin.confirm_pin')}
            </StyledText>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={6}
              value={step === 'create' ? pin : confirmPin}
              onChangeText={(val: string) => {
                setErrorMsg('');
                if (step === 'create') {
                  setPin(val);
                } else {
                  setConfirmPin(val);
                }
              }}
            />
            {Boolean(errorMsg) && (
              <StyledText variant="semibold" style={styles.errorText}>
                {errorMsg}
              </StyledText>
            )}
            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
                <StyledText variant="semibold" style={styles.cancelText}>
                  Cancel
                </StyledText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleNext}>
                <StyledText variant="semibold" style={styles.submitText}>
                  Next
                </StyledText>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <StyledText variant="semibold" style={styles.title}>
              {t('pin.recovery_title')}
            </StyledText>
            <StyledText variant="regular" style={styles.subtext}>
              {t('pin.recovery_desc')}
            </StyledText>
            <View style={styles.codeCard}>
              <StyledText variant="extrabold" style={styles.codeText}>
                {recoveryCode}
              </StyledText>
            </View>
            <TouchableOpacity style={styles.copyBtn} onPress={handleCopyCode}>
              <StyledText variant="semibold" style={styles.copyText}>
                {copied ? t('pin.code_copied') : t('pin.copy_code')}
              </StyledText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.doneBtn} onPress={onSuccess}>
              <StyledText variant="semibold" style={styles.doneText}>
                Done
              </StyledText>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(23, 20, 15, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 99999,
    elevation: 99999,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FAF9F5',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  title: { fontSize: 18, color: '#28231D', marginBottom: 8 },
  label: { fontSize: 14, color: '#564E45', marginBottom: 12 },
  subtext: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  input: {
    width: '100%',
    height: 48,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    textAlign: 'center',
    fontSize: 20,
    letterSpacing: 6,
  },
  errorText: { color: '#C22D2D', fontSize: 13, marginTop: 8 },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 16, width: '100%' },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#E5DFD7',
    alignItems: 'center',
  },
  cancelText: { color: '#3E3831' },
  submitBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#E85A1F',
    alignItems: 'center',
  },
  submitText: { color: '#fff' },
  codeCard: {
    backgroundColor: '#F0EBE6',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 12,
  },
  codeText: {
    fontSize: 24,
    letterSpacing: 3,
    color: '#1E40AF',
  },
  copyBtn: { paddingVertical: 8, paddingHorizontal: 16, marginBottom: 16 },
  copyText: { color: '#E85A1F' },
  doneBtn: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#16A34A',
    alignItems: 'center',
  },
  doneText: { color: '#fff' },
});
