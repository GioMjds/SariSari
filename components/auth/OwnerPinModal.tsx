import { useState, useEffect, FC } from 'react';
import { Modal, View, TouchableOpacity, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { verifyOwnerPin } from '@/database/auth';
import { useAuthStore } from '@/stores/useAuthStore';
import { StyledText } from '@/components/elements/StyledText';

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
  const [isVerifying, setIsVerifying] = useState(false);
  const {
    registerFailedAttempt,
    resetFailedAttempts,
    clearExpiredLockout,
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
      clearExpiredLockout();
      if (isLockedOut()) {
        setSecondsLeft(getLockoutSecondsRemaining());
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [visible, clearExpiredLockout, isLockedOut, getLockoutSecondsRemaining]);

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
    if (locked || isVerifying || pin.length < 4) return;
    setIsVerifying(true);
    try {
      const isValid = await verifyOwnerPin(pin);
      if (isValid) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        resetFailedAttempts();
        setPin('');
        onSuccess();
        return;
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      registerFailedAttempt();
      setPin('');
      setErrorMsg(t('pin.wrong_pin'));
    } catch {
      setPin('');
      setErrorMsg(t('pin.verify_failed'));
    } finally {
      setIsVerifying(false);
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
          <StyledText variant="semibold" style={styles.title}>
            {title || t('pin.title')}
          </StyledText>
          {Boolean(actionDescription) && (
            <StyledText variant="regular" style={styles.subtext}>
              {actionDescription}
            </StyledText>
          )}

          {locked ? (
            <StyledText variant="semibold" style={styles.errorText}>
              {t('pin.locked_out', { seconds: secondsLeft })}
            </StyledText>
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
                <StyledText variant="semibold" style={styles.errorText}>
                  {errorMsg}
                </StyledText>
              )}

              <View style={styles.keypad}>
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <TouchableOpacity
                    key={digit}
                    style={styles.keyBtn}
                    onPress={() => handleKeyPress(digit)}
                  >
                    <StyledText variant="semibold" style={styles.keyText}>
                      {digit}
                    </StyledText>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={styles.keyBtn}
                  onPress={() => setPin('')}
                >
                  <StyledText variant="semibold" style={styles.keyActionText}>
                    C
                  </StyledText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.keyBtn}
                  onPress={() => handleKeyPress('0')}
                >
                  <StyledText variant="semibold" style={styles.keyText}>
                    0
                  </StyledText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.keyBtn}
                  onPress={handleBackspace}
                >
                  <StyledText variant="semibold" style={styles.keyActionText}>
                    ⌫
                  </StyledText>
                </TouchableOpacity>
              </View>
            </>
          )}

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
              <StyledText variant="semibold" style={styles.cancelText}>
                Cancel
              </StyledText>
            </TouchableOpacity>
            {!locked && (
              <TouchableOpacity
                style={[styles.submitBtn, pin.length < 4 && styles.btnDisabled]}
                disabled={pin.length < 4}
                onPress={handleSubmit}
              >
                <StyledText variant="semibold" style={styles.submitText}>
                  Submit
                </StyledText>
              </TouchableOpacity>
            )}
          </View>

          {Boolean(onForgotPin) && (
            <TouchableOpacity style={styles.forgotBtn} onPress={onForgotPin}>
              <StyledText variant="medium" style={styles.forgotText}>
                {t('pin.forgot_pin')}
              </StyledText>
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
  title: { fontSize: 18, color: '#1F2937', marginBottom: 6 },
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
  keyText: { fontSize: 22, color: '#111827' },
  keyActionText: { fontSize: 18, color: '#4B5563' },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 12, width: '100%' },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
  },
  cancelText: { color: '#374151' },
  submitBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#2563EB',
    alignItems: 'center',
  },
  submitText: { color: '#fff' },
  btnDisabled: { opacity: 0.5 },
  forgotBtn: { marginTop: 14 },
  forgotText: { color: '#2563EB', fontSize: 13 },
});
