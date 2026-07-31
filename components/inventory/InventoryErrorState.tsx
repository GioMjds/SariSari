import { View, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';

interface Props {
  title?: string;
  message?: string;
  onRetry: () => void;
}

export function InventoryErrorState({
  title = 'Something went sideways',
  message = "Couldn't load inventory right now.",
  onRetry,
}: Props) {
  return (
    <View className="mx-4 mt-6 p-5 rounded-3xl bg-rose-50 border border-rose-200 items-center gap-y-3">
      <FontAwesome name="exclamation-circle" size={28} color="#9F1239" />
      <StyledText variant="extrabold" className="text-base text-rose-900">
        {title}
      </StyledText>
      <StyledText className="text-xs text-rose-800 text-center px-4">
        {message}
      </StyledText>
      <TouchableOpacity
        onPress={onRetry}
        accessibilityRole="button"
        accessibilityLabel="Retry"
        className="px-4 py-2.5 rounded-xl bg-rose-600 min-h-[44px] items-center justify-center"
      >
        <StyledText variant="extrabold" className="text-paper-50 text-sm">
          Try again
        </StyledText>
      </TouchableOpacity>
    </View>
  );
}
