import { Pressable, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';

interface SubmitErrorBannerProps {
  message: string;
  onDismiss: () => void;
  onRetry: () => void;
}

export function SubmitErrorBanner({
  message,
  onDismiss,
  onRetry,
}: SubmitErrorBannerProps) {
  return (
    <View
      accessibilityLiveRegion="assertive"
      accessibilityRole="alert"
      className="mb-3 px-3 py-3 rounded-2xl bg-semantic-danger-50 border border-semantic-danger/30 flex-row items-center"
    >
      <View className="w-9 h-9 rounded-xl bg-semantic-danger items-center justify-center mr-3">
        <FontAwesome name="exclamation-circle" size={16} color="#FFFFFF" />
      </View>
      <View className="flex-1 mr-2 min-w-0">
        <StyledText variant="extrabold" className="text-semantic-danger text-[13px]">
          Sale not recorded
        </StyledText>
        <StyledText
          variant="medium"
          className="text-ink-700 text-[12px] mt-0.5"
          numberOfLines={2}
        >
          {message}
        </StyledText>
      </View>
      <Pressable
        onPress={onRetry}
        accessibilityRole="button"
        accessibilityLabel="Retry recording sale"
        className="px-4 min-h-[44px] rounded-xl bg-semantic-danger items-center justify-center active:opacity-80"
      >
        <StyledText variant="extrabold" className="text-white text-[13px]">
          Retry
        </StyledText>
      </Pressable>
      <Pressable
        onPress={onDismiss}
        accessibilityRole="button"
        accessibilityLabel="Dismiss error"
        className="w-11 h-11 ml-1 rounded-full items-center justify-center active:bg-semantic-danger-100"
      >
        <FontAwesome name="times" size={14} color="#C13030" />
      </Pressable>
    </View>
  );
}
