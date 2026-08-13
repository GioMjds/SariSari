import { FC, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useTranslation } from 'react-i18next';
import { setupOwnerPin } from '@/database/auth';
import { useAuthStore } from '@/stores/useAuthStore';

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
  const setIsPinConfigured = useAuthStore((s) => s.setIsPinConfigured);

  const handleNext = async () => {
    if (step === 'create') {
      if (pin.length < 4 || pin.length > 6) return;
      setStep('confirm');
    } else if (step === 'confirm') {
      if (pin !== confirmPin) {
        setErrorMsg(t('pin.pin_mismatch'));
        return;
      }
      const res = await setupOwnerPin(pin);
      setIsPinConfigured(true);
      setRecoveryCode(res.recoveryCode);
      setStep('code');
    }
  };

  const handleCopyCode = async () => {
    await Clipboard.setStringAsync(recoveryCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {step !== 'code' ? (
            <>
              <Text style={styles.title}>{t('pin.setup_title')}</Text>
              <Text style={styles.label}>
                {step === 'create' ? t('pin.enter_pin') : t('pin.confirm_pin')}
              </Text>
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
                <Text style={styles.errorText}>{errorMsg}</Text>
              )}
              <View style={styles.btnRow}>
                <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.submitBtn} onPress={handleNext}>
                  <Text style={styles.submitText}>Next</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.title}>{t('pin.recovery_title')}</Text>
              <Text style={styles.subtext}>{t('pin.recovery_desc')}</Text>
              <View style={styles.codeCard}>
                <Text style={styles.codeText}>{recoveryCode}</Text>
              </View>
              <TouchableOpacity style={styles.copyBtn} onPress={handleCopyCode}>
                <Text style={styles.copyText}>
                  {copied ? t('pin.code_copied') : t('pin.copy_code')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.doneBtn} onPress={onSuccess}>
                <Text style={styles.doneText}>Done</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  title: { fontSize: 18, fontWeight: '700', color: '#1F2937', marginBottom: 8 },
  label: { fontSize: 14, color: '#4B5563', marginBottom: 12 },
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
  errorText: { color: '#DC2626', fontSize: 13, marginTop: 8 },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 16, width: '100%' },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
  },
  cancelText: { color: '#374151', fontWeight: '600' },
  submitBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#2563EB',
    alignItems: 'center',
  },
  submitText: { color: '#fff', fontWeight: '600' },
  codeCard: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 12,
  },
  codeText: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 3,
    color: '#1E40AF',
  },
  copyBtn: { paddingVertical: 8, paddingHorizontal: 16, marginBottom: 16 },
  copyText: { color: '#2563EB', fontWeight: '600' },
  doneBtn: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#16A34A',
    alignItems: 'center',
  },
  doneText: { color: '#fff', fontWeight: '700' },
});
