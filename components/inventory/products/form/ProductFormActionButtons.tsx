import { FontAwesome } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import { StyledText } from '@/components/elements';

interface ProductFormActionButtonsProps {
  submitLabel?: string;
  disabled: boolean;
  isPending: boolean;
  onSubmit: () => void;
  onCancel: () => void;
}

export function ProductFormActionButtons({
  submitLabel = 'Save Product',
  disabled,
  isPending,
  onSubmit,
  onCancel,
}: ProductFormActionButtonsProps) {
  return (
    <View className="mt-5">
      <Pressable
        onPress={onSubmit}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={submitLabel}
        accessibilityState={{ disabled, busy: isPending }}
        className={`rounded-2xl py-4 flex-row items-center justify-center ${
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
          {isPending ? 'Saving Product...' : submitLabel}
        </StyledText>
      </Pressable>

      <Pressable
        onPress={onCancel}
        accessibilityRole="button"
        accessibilityLabel="Cancel and go back"
        className="press-scale mt-3 rounded-2xl py-4 items-center justify-center bg-paper-100 border border-ink-200 active:opacity-70"
      >
        <StyledText variant="semibold" className="text-ink-700 text-base">
          Cancel
        </StyledText>
      </Pressable>
    </View>
  );
}
