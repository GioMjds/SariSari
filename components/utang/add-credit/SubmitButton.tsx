import { FontAwesome } from '@expo/vector-icons';
import { Pressable } from 'react-native';
import { formatPesos } from '@/lib/money';
import { StyledText } from '@/components/elements';

interface SubmitButtonProps {
  disabled: boolean;
  isPending: boolean;
  total: number;
  /** Whether the product name field has content, for the dynamic label. */
  hasProductName: boolean;
  onPress: () => void;
}

/**
 * SubmitButton — the persimmon primary action. Disabled state uses
 * the brand fill at 40% opacity to keep the call-to-action read as
 * persimmon rather than fading to a neutral grey.
 */
export function SubmitButton({
  disabled,
  isPending,
  total,
  hasProductName,
  onPress,
}: SubmitButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel="Record utang slip"
      accessibilityState={{ disabled, busy: isPending }}
      className={`mt-5 rounded-2xl py-4 flex-row items-center justify-center ${
        disabled
          ? 'bg-ink-100 shadow-none'
          : 'bg-persimmon-500 shadow-persimmon-glow'
      }`}
      style={({ pressed }) => ({
        transform: [{ scale: !disabled && pressed ? 0.98 : 1 }],
      })}
    >
      <FontAwesome
        name={isPending ? 'spinner' : 'check'}
        size={16}
        color={disabled ? '#7A7165' : '#FBF7EE'}
      />
      <StyledText
        variant="extrabold"
        className={`text-base ml-2 ${
          disabled ? 'text-ink-400' : 'text-paper-50'
        }`}
      >
        {isPending
          ? 'Saving Slip…'
          : hasProductName
            ? `Record Utang · ${formatPesos(total)}`
            : 'Record Utang'}
      </StyledText>
    </Pressable>
  );
}
