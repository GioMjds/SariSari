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
      <StyledText variant="extrabold" className="text-sm text-ink-900">
        Valuation Summary
      </StyledText>

      <View className="flex-row justify-between">
        <View>
          <StyledText
            variant="medium"
            className="text-[11px] uppercase tracking-wider text-ink-500 mb-1"
          >
            Total Cost Value
          </StyledText>
          <StyledText variant="extrabold" className="text-lg text-ink-900">
            {formatPesos(totalCostValue)}
          </StyledText>
        </View>
        <View className="items-end">
          <StyledText
            variant="medium"
            className="text-[11px] uppercase tracking-wider text-ink-500 mb-1"
          >
            Total Retail Value
          </StyledText>
          <StyledText variant="extrabold" className="text-lg text-sage-700">
            {formatPesos(totalRetailValue)}
          </StyledText>
        </View>
      </View>

      <View className="pt-3 border-t border-paper-200 flex-row justify-between items-center">
        <StyledText
          variant="semibold"
          className="text-xs uppercase tracking-wider text-ink-700"
        >
          Potential Profit
        </StyledText>
        <StyledText variant="extrabold" className="text-base text-sage-700">
          {formatPesos(potentialProfit)}
        </StyledText>
      </View>
    </View>
  );
}
