import { ActivityIndicator, Pressable, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyledText } from '@/components/elements';

interface ProductFormFooterProps {
  submitLabel: string;
  pendingLabel: string;
  /** Why saving is blocked; null when the form is ready. */
  blocker: string | null;
  isPending: boolean;
  onSubmit: () => void;
  onCancel: () => void;
}

/** Sticky save bar that says what is still missing instead of a silent disabled button. */
export function ProductFormFooter({
  submitLabel,
  pendingLabel,
  blocker,
  isPending,
  onSubmit,
  onCancel,
}: ProductFormFooterProps) {
  const insets = useSafeAreaInsets();
  const disabled = !!blocker || isPending;

  return (
    <View
      style={{ paddingBottom: Math.max(insets.bottom, 12) }}
      className="px-4 pt-2 bg-paper-50 border-t border-paper-300"
    >
      {blocker ? (
        <View accessibilityLiveRegion="polite" className="flex-row items-center justify-center mb-2">
          <FontAwesome name="info-circle" size={12} color="#564E45" />
          <StyledText variant="medium" className="text-ink-500 text-xs ml-1.5">
            {blocker}
          </StyledText>
        </View>
      ) : null}
      <View className="flex-row gap-x-3">
        <Pressable
          onPress={onCancel}
          disabled={isPending}
          accessibilityRole="button"
          accessibilityLabel="Cancel"
          className="flex-1 min-h-[52px] rounded-xl items-center justify-center bg-paper-100 border border-paper-300 active:bg-paper-200"
        >
          <StyledText variant="semibold" className="text-ink-700 text-base">
            Cancel
          </StyledText>
        </Pressable>
        <Pressable
          onPress={onSubmit}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={submitLabel}
          accessibilityHint={blocker ?? undefined}
          accessibilityState={{ disabled, busy: isPending }}
          className={`flex-[2] min-h-[52px] rounded-xl flex-row items-center justify-center ${
            disabled && !isPending ? 'bg-paper-300' : 'bg-persimmon-500 active:bg-persimmon-700'
          }`}
        >
          {isPending ? (
            <ActivityIndicator size="small" color="#FAFAF7" />
          ) : (
            <FontAwesome name="check" size={16} color={disabled ? '#564E45' : '#FAFAF7'} />
          )}
          <StyledText
            variant="extrabold"
            className={`text-base ml-2 ${disabled && !isPending ? 'text-ink-500' : 'text-paper-50'}`}
          >
            {isPending ? pendingLabel : submitLabel}
          </StyledText>
        </Pressable>
      </View>
    </View>
  );
}
