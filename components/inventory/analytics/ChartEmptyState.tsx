import { View } from 'react-native';
import { StyledText } from '@/components/elements';

export function ChartEmptyState({ message }: { message: string }) {
  return (
    <View className="py-6 items-center">
      <StyledText variant="regular" className="text-xs text-ink-500 text-center">
        {message}
      </StyledText>
    </View>
  );
}
