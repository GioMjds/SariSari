import React from 'react';
import { View } from 'react-native';
import { StyledText } from '@/components/elements';
import { formatCurrency } from '@/utils';

export interface SalesTargetCardProps {
  currentSales: number;
  targetSales?: number;
}

export function SalesTargetCard({
  currentSales,
  targetSales = 5000,
}: SalesTargetCardProps) {
  const progressPct = Math.min(
    100,
    Math.round((currentSales / targetSales) * 100),
  );

  return (
    <View className="px-4 mb-4">
      <View className="bg-paper-50 rounded-2xl p-4 border border-ink-100 shadow-sm">
        <View className="flex-row items-center justify-between mb-2">
          <StyledText variant="extrabold" className="text-ink-900 text-sm">
            Daily Sales Goal
          </StyledText>
          <StyledText variant="extrabold" className="text-cinnamon-600 text-sm">
            {progressPct}%
          </StyledText>
        </View>

        {/* Progress Bar Container */}
        <View className="h-3 bg-paper-200 rounded-full overflow-hidden mb-2">
          <View
            className="h-full bg-cinnamon-500 rounded-full"
            style={{ width: `${progressPct}%` }}
          />
        </View>

        <StyledText variant="regular" className="text-ink-500 text-xs">
          {formatCurrency(currentSales)} / {formatCurrency(targetSales)}
        </StyledText>
      </View>
    </View>
  );
}
