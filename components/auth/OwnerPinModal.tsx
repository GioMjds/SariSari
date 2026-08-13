import { useState, useEffect, FC } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { verifyOwnerPin } from '@/database/auth';
import { useAuthStore } from '@/stores/useAuthStore';

interface Props {
  visible: boolean;
  title?: string;
  actionDescription?: string;
  onSuccess: () => void;
  onCancel: () => void;
  onForgotPin?: () => void;
}

export const OwnerPinModal: FC<Props> = ({
  visible,
  title,
  actionDescription,
  onSuccess,
  onCancel,
  onForgotPin,
}) => {
  const { t } = useTranslation('settings');
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const {
    registerFailedAttempt,
    resetFailedAttempts,
    isLockedOut,
    getLockoutSecondsRemaining,
  } = useAuthStore();
  const [secondsLeft, setSecondsLeft] = useState(getLockoutSecondsRemaining());

  useEffect(() => {
    if (!visible) {
      setPin('');
      setErrorMsg('');
      return;
    }

    const interval = setInterval(() => {
      if (isLockedOut()) {
        setSecondsLeft(getLockoutSecondsRemaining());
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [visible, isLockedOut, getLockoutSecondsRemaining]);

  const locked = isLockedOut();

  const handleKeyPress = (num: string) => {
    if (locked || pin.length >= 6) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setErrorMsg('');
    const newPin = pin + num;
    setPin(newPin);
  };

  const handleBackspace = () => {
    if (locked || pin.length === 0) return;
    setPin(pin.slice(0, -1));
  };

  const handleSubmit = async () => {
    if (locked || pin.length < 4) return;
    const isValid = await verifyOwnerPin(pin);
    if (isValid) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      resetFailedAttempts();
      setPin('');
      onSuccess();
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      registerFailedAttempt();
      setPin('');
      setErrorMsg(t('pin.wrong_pin'));
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{title || t('pin.title')}</Text>
          {Boolean(actionDescription) && (
            <Text style={styles.subtext}>{actionDescription}</Text>
          )}

          {locked ? (
            <Text style={styles.errorText}>
              {t('pin.locked_out', { seconds: secondsLeft })}
            </Text>
          ) : (
            <>
              <View style={styles.dotsContainer}>
                {[0, 1, 2, 3, 4, 5].map((idx) => (
                  <View
                    key={idx}
                    style={[styles.dot, pin.length > idx && styles.dotFilled]}
                  />
                ))}
              </View>

              {Boolean(errorMsg) && (
                <Text style={styles.errorText}>{errorMsg}</Text>
              )}

              <View style={styles.keypad}>
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <TouchableOpacity
                    key={digit}
                    style={styles.keyBtn}
                    onPress={() => handleKeyPress(digit)}
                  >
                    <Text style={styles.keyText}>{digit}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={styles.keyBtn}
                  onPress={() => setPin('')}
                >
                  <Text style={styles.keyActionText}>C</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.keyBtn}
                  onPress={() => handleKeyPress('0')}
                >
                  <Text style={styles.keyText}>0</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.keyBtn}
                  onPress={handleBackspace}
                >
                  <Text style={styles.keyActionText}>⌫</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            {!locked && (
              <TouchableOpacity
                style={[styles.submitBtn, pin.length < 4 && styles.btnDisabled]}
                disabled={pin.length < 4}
                onPress={handleSubmit}
              >
                <Text style={styles.submitText}>Submit</Text>
              </TouchableOpacity>
            )}
          </View>

          {Boolean(onForgotPin) && (
            <TouchableOpacity style={styles.forgotBtn} onPress={onForgotPin}>
              <Text style={styles.forgotText}>{t('pin.forgot_pin')}</Text>
            </TouchableOpacity>
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
  title: { fontSize: 18, fontWeight: '700', color: '#1F2937', marginBottom: 6 },
  subtext: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 12,
    textAlign: 'center',
  },
  dotsContainer: { flexDirection: 'row', marginVertical: 16, gap: 12 },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: '#9CA3AF',
  },
  dotFilled: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    marginVertical: 8,
    fontWeight: '600',
    textAlign: 'center',
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 240,
    justifyContent: 'center',
    gap: 12,
    marginVertical: 12,
  },
  keyBtn: {
    width: 64,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyText: { fontSize: 22, fontWeight: '600', color: '#111827' },
  keyActionText: { fontSize: 18, fontWeight: '600', color: '#4B5563' },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 12, width: '100%' },
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
  btnDisabled: { opacity: 0.5 },
  forgotBtn: { marginTop: 14 },
  forgotText: { color: '#2563EB', fontSize: 13, fontWeight: '500' },
});
