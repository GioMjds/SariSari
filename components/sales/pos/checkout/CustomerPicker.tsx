import { Pressable, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';

interface CustomerPickerProps {
  customerName: string | undefined;
  customerInitial: string;
  customerMissing: boolean;
  onPress: () => void;
}

export function CustomerPicker({
  customerName,
  customerInitial,
  customerMissing,
  onPress,
}: CustomerPickerProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={
        customerName ? `Suki: ${customerName}` : 'Select suki'
      }
      accessibilityHint="Opens customer selection dialog"
      className={`min-h-[56px] flex-row items-center rounded-2xl px-3 py-2 border active:bg-paper-100 ${
        customerMissing
          ? 'border-semantic-warning bg-semantic-warning-50'
          : 'border-paper-300 bg-white'
      }`}
    >
      <View
        className={`w-10 h-10 rounded-xl items-center justify-center mr-3 ${
          customerMissing
            ? 'bg-semantic-warning'
            : customerName
              ? 'bg-cinnamon-500'
              : 'bg-paper-200 border border-paper-300'
        }`}
      >
        {customerMissing ? (
          <FontAwesome name="user-plus" size={14} color="#FAFAF7" />
        ) : (
          <StyledText
            variant="black"
            className={`text-base ${customerName ? 'text-white' : 'text-ink-700'}`}
          >
            {customerInitial}
          </StyledText>
        )}
      </View>
      <View className="flex-1 mr-2 min-w-0">
        <StyledText variant="medium" className="text-ink-500 text-xs">
          Suki
        </StyledText>
        <StyledText
          variant="semibold"
          className="text-ink-900 text-[15px]"
          numberOfLines={1}
        >
          {customerName ?? 'Walk-in buyer'}
        </StyledText>
      </View>
      <StyledText variant="extrabold" className="text-persimmon-600 text-[13px] mr-2">
        {customerName ? 'Change' : 'Choose'}
      </StyledText>
      <FontAwesome name="chevron-right" size={11} color="#7A7165" />
    </Pressable>
  );
}
