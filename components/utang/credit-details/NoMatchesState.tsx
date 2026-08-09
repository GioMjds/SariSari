import { View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';

interface NoMatchesStateProps {
  noun: string;
}

export function NoMatchesState({ noun }: NoMatchesStateProps) {
  return (
    <View className="items-center justify-center py-10 px-6 bg-paper-50 rounded-2xl border border-dashed border-ink-200">
      <FontAwesome name="search" size={26} color="#A89F90" />
      <StyledText
        variant="extrabold"
        className="text-ink-700 text-base mt-3 text-center"
      >
        No {noun}s match your search
      </StyledText>
      <StyledText
        variant="regular"
        className="text-ink-500 text-sm mt-1 text-center"
      >
        Try a different keyword or clear the filter to see everything.
      </StyledText>
    </View>
  );
}
