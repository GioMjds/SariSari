import React from 'react';
import { View } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';

export interface MiniInsightsCardProps {
  topProductName?: string;
  unitsSold?: number;
}

export function MiniInsightsCard({
  topProductName = 'No sales recorded',
  unitsSold = 0,
}: MiniInsightsCardProps) {
  return (
    <View className="px-4 mb-4">
      <View className="bg-cinnamon-50 rounded-2xl p-4 border border-cinnamon-200 flex-row items-center">
        <View className="w-10 h-10 rounded-full bg-cinnamon-500 items-center justify-center mr-3">
          <FontAwesome5 name="fire" size={18} color="#FAF7F2" />
        </View>
        <View className="flex-1">
          <StyledText
            variant="extrabold"
            className="text-cinnamon-800 text-xs uppercase tracking-wider"
          >
            Best Seller Today
          </StyledText>
          <StyledText
            variant="extrabold"
            className="text-ink-900 text-base mt-0.5"
            numberOfLines={1}
          >
            {topProductName}
          </StyledText>
          {unitsSold > 0 && (
            <StyledText variant="regular" className="text-ink-500 text-xs">
              {unitsSold} units sold
            </StyledText>
          )}
        </View>
      </View>
    </View>
  );
}
