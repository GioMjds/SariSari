import React from 'react';
import { View } from 'react-native';
import { StyledText } from '@/components/elements';
import { formatPesos } from '@/lib/money';

type PriceCorrectionSummaryCardProps = {
  originalTotal: number;
  updatedTotal: number;
  totalDelta: number;
};

export const PriceCorrectionSummaryCard: React.FC<
  PriceCorrectionSummaryCardProps
> = ({ originalTotal, updatedTotal, totalDelta }) => {
  return (
    <View className="bg-paper-50 rounded-2xl shadow-paper border border-ink-100 p-4 mb-4">
      <StyledText variant="black" className="label-caps text-cinnamon-500 mb-3">
        Recalculation Summary
      </StyledText>

      <View className="gap-2.5">
        <View className="flex-row justify-between items-center">
          <StyledText variant="regular" className="text-ink-500 text-xs">
            Original Sale Total
          </StyledText>
          <StyledText variant="semibold" className="text-ink-700 text-xs">
            {formatPesos(originalTotal)}
          </StyledText>
        </View>

        <View className="flex-row justify-between items-center">
          <StyledText variant="regular" className="text-ink-500 text-xs">
            Net Price Difference
          </StyledText>
          <StyledText
            variant="extrabold"
            className={`text-xs ${
              totalDelta < 0
                ? 'text-emerald-700'
                : totalDelta > 0
                  ? 'text-amber-700'
                  : 'text-ink-500'
            }`}
          >
            {totalDelta > 0 ? '+' : ''}
            {formatPesos(totalDelta)}
          </StyledText>
        </View>

        <View className="flex-row justify-between items-center pt-3 border-t border-ink-200 mt-1">
          <StyledText
            variant="extrabold"
            className="text-ink-900 text-sm uppercase tracking-wider"
          >
            Updated Sale Total
          </StyledText>
          <StyledText
            variant="black"
            className="text-cinnamon-600 text-xl"
          >
            {formatPesos(updatedTotal)}
          </StyledText>
        </View>
      </View>
    </View>
  );
};
