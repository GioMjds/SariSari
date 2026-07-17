import React from 'react';
import { View, Pressable } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';

interface CashEntryHeaderProps {
  businessDate: string;
  onBack: () => void;
}

export function CashEntryHeader({
  businessDate,
  onBack,
}: CashEntryHeaderProps) {
  return (
    <View className="px-4 pt-3 pb-4 bg-background">
      <View className="bg-paper-50 rounded-2xl shadow-paper border border-ink-100 px-4 py-3 flex-row items-center justify-between">
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="press-scale w-10 h-10 items-center justify-center rounded-full bg-paper-100 border border-ink-100 active:opacity-70"
        >
          <FontAwesome name="arrow-left" size={16} color="#0E0C0A" />
        </Pressable>

        <View className="items-center">
          <StyledText
            variant="extrabold"
            className="text-ink-900 text-h2 font-stack-sans-bold"
          >
            Record Cash Movement
          </StyledText>
          <StyledText
            variant="medium"
            className="label-caps text-ink-400 mt-0.5"
          >
            Session: {businessDate}
          </StyledText>
        </View>

        <View className="w-10 h-10" />
      </View>
    </View>
  );
}
