import { FC, ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements/StyledText';

interface Props {
  onDigit: (digit: string) => void;
  onBackspace: () => void;
  disabled?: boolean;
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
    <View
      className={`w-full items-center pb-2 ${disabled ? 'opacity-40' : ''}`}
    >
      <View className="w-full max-w-md px-2">
        {ROWS.map((row) => (
          <View key={row.join('')} className="flex-row w-full mb-3">
            {row.map((digit) => (
              <Pressable
                key={digit}
                testID={`pin-key-${digit}`}
                accessibilityRole="button"
                accessibilityLabel={digit}
                disabled={disabled}
                onPress={() => press(digit)}
                className="flex-1 mx-1.5 h-20 rounded-2xl bg-paper-50 border border-paper-300 items-center justify-center shadow-sm active:bg-paper-100 active:scale-95"
              >
                <StyledText
                  variant="semibold"
                  className="text-2xl text-ink-900"
                >
                  {digit}
                </StyledText>
              </Pressable>
            ))}
          </View>
        ))}
        <View className="flex-row w-full">
          {/* Left Slot (Biometrics or Empty) */}
          <View className="flex-1 mx-1.5 h-20 items-center justify-center">
            {leftSlot}
          </View>

          {/* Zero Key */}
          <Pressable
            testID="pin-key-0"
            accessibilityRole="button"
            accessibilityLabel="0"
            disabled={disabled}
            onPress={() => press('0')}
            className="flex-1 mx-1.5 h-20 rounded-2xl bg-paper-50 border border-paper-300 items-center justify-center shadow-sm active:bg-paper-100 active:scale-95"
          >
            <StyledText variant="semibold" className="text-2xl text-ink-900">
              0
            </StyledText>
          </Pressable>

          {/* Backspace Key */}
          <Pressable
            testID="pin-key-backspace"
            accessibilityRole="button"
            accessibilityLabel={t('pin.key_backspace')}
            disabled={disabled}
            onPress={() => {
              if (disabled) return;
              onBackspace();
            }}
            className="flex-1 mx-1.5 h-20 rounded-2xl items-center justify-center active:bg-paper-100 active:scale-95"
          >
            <FontAwesome name="angle-left" size={36} color="#564E45" />
          </Pressable>
        </View>
      </View>
    </View>
  );
};
