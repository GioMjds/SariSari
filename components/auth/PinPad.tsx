import { FC, ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements/StyledText';

interface Props {
  onDigit: (digit: string) => void;
  onBackspace: () => void;
  disabled?: boolean;
  /** Bottom-left slot. Used for the biometric button on the lock screen. */
  leftSlot?: ReactNode;
}

const ROWS: readonly (readonly string[])[] = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
];

export const PinPad: FC<Props> = ({
  onDigit,
  onBackspace,
  disabled = false,
  leftSlot,
}) => {
  const { t } = useTranslation('settings');

  const press = (digit: string) => {
    if (disabled) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDigit(digit);
  };

  return (
    <View style={[styles.pad, disabled && styles.padDisabled]}>
      {ROWS.map((row) => (
        <View key={row.join('')} style={styles.row}>
          {row.map((digit) => (
            <Pressable
              key={digit}
              testID={`pin-key-${digit}`}
              accessibilityRole="button"
              accessibilityLabel={digit}
              disabled={disabled}
              onPress={() => press(digit)}
              style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}
            >
              <StyledText variant="semibold" style={styles.keyText}>
                {digit}
              </StyledText>
            </Pressable>
          ))}
        </View>
      ))}
      <View style={styles.row}>
        <View style={styles.slot}>{leftSlot}</View>
        <Pressable
          testID="pin-key-0"
          accessibilityRole="button"
          accessibilityLabel="0"
          disabled={disabled}
          onPress={() => press('0')}
          style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}
        >
          <StyledText variant="semibold" style={styles.keyText}>
            0
          </StyledText>
        </Pressable>
        <Pressable
          testID="pin-key-backspace"
          accessibilityRole="button"
          accessibilityLabel={t('pin.key_backspace')}
          disabled={disabled}
          onPress={() => {
            if (disabled) return;
            onBackspace();
          }}
          style={({ pressed }) => [styles.slot, pressed && styles.keyPressed]}
        >
          <FontAwesome name="long-arrow-left" size={22} color="#564E45" />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  pad: { alignItems: 'center', gap: 12 },
  padDisabled: { opacity: 0.4 },
  row: { flexDirection: 'row', gap: 16 },
  key: {
    width: 76,
    height: 60,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5DFD7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyPressed: { backgroundColor: '#FFE7D8', borderColor: '#E85A1F' },
  keyText: { fontSize: 24, color: '#28231D' },
  slot: {
    width: 76,
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
