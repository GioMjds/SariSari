import React from 'react';
import { View } from 'react-native';
import { StyledText } from '@/components/elements';
import { formatPesos } from '@/lib/money';

export interface ValuationSummaryProps {
  totalCostValue: number;
  totalRetailValue: number;
  potentialProfit: number;
}

export function ValuationSummaryCard({
  totalCostValue,
  totalRetailValue,
  potentialProfit,
}: ValuationSummaryProps) {
  return (
    <View className="p-5 rounded-2xl bg-paper-100 border border-paper-200 gap-y-4">
      <StyledText className="text-sm font-bold text-ink-900">
        Valuation Summary
      </StyledText>

      <View className="flex-row justify-between">
        <View>
          <StyledText className="text-xs text-ink-500 mb-1">
            Total Cost Value
          </StyledText>
          <StyledText className="text-lg font-bold text-ink-900">
            {formatPesos(totalCostValue)}
          </StyledText>
        </View>
        <View className="items-end">
          <StyledText className="text-xs text-ink-500 mb-1">
            Total Retail Value
          </StyledText>
          <StyledText className="text-lg font-bold text-sage-700">
            {formatPesos(totalRetailValue)}
          </StyledText>
        </View>
      </View>

      <View className="pt-3 border-t border-paper-200 flex-row justify-between items-center">
        <StyledText className="text-xs font-semibold text-ink-700">
          Potential Profit
        </StyledText>
        <StyledText className="text-base font-extrabold text-sage-700">
          {formatPesos(potentialProfit)}
        </StyledText>
      </View>
    </View>
  );
}
