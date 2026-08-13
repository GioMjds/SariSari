import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { verifyAndResetOwnerPinWithRecoveryCode } from '@/database/auth';
import { useAuthStore } from '@/stores/useAuthStore';

interface Props {
  visible: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

export const OwnerPinRecoveryModal: React.FC<Props> = ({
  visible,
  onSuccess,
  onCancel,
}) => {
  const { t } = useTranslation('settings');
  const [code, setCode] = useState('');
  const [newPin, setNewPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const resetFailedAttempts = useAuthStore((s) => s.resetFailedAttempts);

  const handleReset = async () => {
    if (!code.trim() || newPin.length < 4) return;
    const success = await verifyAndResetOwnerPinWithRecoveryCode(code, newPin);
    if (success) {
      resetFailedAttempts();
      onSuccess();
    } else {
      setErrorMsg(t('pin.invalid_code'));
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{t('pin.reset_title')}</Text>

          <Text style={styles.label}>{t('pin.enter_recovery_code')}</Text>
          <TextInput
            style={styles.input}
            autoCapitalize="characters"
            maxLength={10}
            value={code}
            onChangeText={(val) => {
              setErrorMsg('');
              setCode(val);
            }}
          />

          <Text style={[styles.label, { marginTop: 12 }]}>
            {t('pin.enter_pin')}
          </Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={6}
            value={newPin}
            onChangeText={(val) => {
              setErrorMsg('');
              setNewPin(val);
            }}
          />

          {Boolean(errorMsg) && (
            <Text style={styles.errorText}>{errorMsg}</Text>
          )}

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitBtn} onPress={handleReset}>
              <Text style={styles.submitText}>Reset</Text>
            </TouchableOpacity>
          </View>
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
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    color: '#4B5563',
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  input: {
    width: '100%',
    height: 44,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
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
});
