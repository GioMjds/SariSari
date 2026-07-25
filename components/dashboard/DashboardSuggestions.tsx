import React, { memo } from 'react';
import { Pressable, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { HomeRecommendation, HomeDestination } from './home-state';

export interface DashboardSuggestionsProps {
  suggestions: HomeRecommendation[];
  onPress: (destination: HomeDestination) => void;
}

export const DashboardSuggestions = memo(function DashboardSuggestions({
  suggestions,
  onPress,
}: DashboardSuggestionsProps) {
  const { t } = useTranslation();

  if (!suggestions || suggestions.length === 0) return null;

  const suggestion = suggestions[0];
  const ctaText = t(`common:goals.${suggestion.kind}.cta`, {
    defaultValue: 'Open',
  });

  return (
    <View testID="suggestion-card" className="px-4 mb-3">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={ctaText}
        onPress={() => onPress(suggestion.destination)}
        className="bg-paper-100 border border-ink-100 rounded-xl p-3.5 flex-row items-center justify-between active:opacity-80"
      >
        <View className="flex-row items-center flex-1 mr-2">
          <View className="w-7 h-7 rounded-full bg-paper-200 items-center justify-center mr-2.5">
            <FontAwesome name="lightbulb-o" size={15} color="#E85A1F" />
          </View>
          <StyledText variant="semibold" className="text-sm text-ink-800 flex-1">
            {ctaText}
          </StyledText>
        </View>
        <View className="flex-row items-center">
          <FontAwesome name="angle-right" size={16} color="#E85A1F" />
        </View>
      </Pressable>
    </View>
  );
});
