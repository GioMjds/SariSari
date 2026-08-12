import { FontAwesome } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyledText } from '@/components/elements';

interface ActionButtonsProps {
  disabled: boolean;
  isPending: boolean;
  onSubmit: () => void;
  onCancel: () => void;
}

export function ActionButtons({
  disabled,
  isPending,
  onSubmit,
  onCancel,
}: ActionButtonsProps) {
  const insets = useSafeAreaInsets();
  const bottomInsetBuffer = Math.max(insets.bottom + 8, 16);

  return (
    <View
      style={{ paddingBottom: bottomInsetBuffer }}
      className="px-4 pt-3 bg-paper-50 border-t border-ink-100 shadow-paper flex-row items-center gap-3 z-10"
    >
      <Pressable
        onPress={onCancel}
        disabled={isPending}
        accessibilityRole="button"
        accessibilityLabel="Cancel and go back"
        className="flex-1 py-3.5 rounded-xl items-center justify-center bg-paper-100 border border-ink-200 active:opacity-70 disabled:opacity-50"
      >
        <StyledText variant="semibold" className="text-ink-700 text-sm font-stack-sans-semibold">
          Cancel
        </StyledText>
      </Pressable>

      <Pressable
        onPress={onSubmit}
        disabled={disabled || isPending}
        accessibilityRole="button"
        accessibilityLabel="Add product"
        accessibilityState={{ disabled: disabled || isPending, busy: isPending }}
        className={`flex-[2] py-3.5 rounded-xl flex-row items-center justify-center ${
          disabled || isPending
            ? 'bg-ink-100 opacity-60 shadow-none'
            : 'bg-persimmon-500 shadow-persimmon-glow'
        }`}
        style={({ pressed }) => ({
          transform: [{ scale: !disabled && !isPending && pressed ? 0.98 : 1 }],
        })}
      >
        <FontAwesome
          name={isPending ? 'spinner' : 'plus'}
          size={14}
          color={disabled || isPending ? '#7A7165' : '#FBF7EE'}
        />
        <StyledText
          variant="extrabold"
          className={`text-sm font-stack-sans-bold ml-2 ${
            disabled || isPending ? 'text-ink-400' : 'text-paper-50'
          }`}
        >
          {isPending ? 'Saving Product…' : 'Add Product'}
        </StyledText>
      </Pressable>
    </View>
  );
}

