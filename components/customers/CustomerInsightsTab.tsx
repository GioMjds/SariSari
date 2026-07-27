import React from 'react';
import { View, ScrollView } from 'react-native';
import { StyledText } from '@/components/elements';
import { CustomerInsights } from '@/types/credits.types';
import { formatPesos } from '@/lib';

interface CustomerInsightsTabProps {
  insights?: CustomerInsights;
}

export const CustomerInsightsTab: React.FC<CustomerInsightsTabProps> = ({
  insights,
}) => {
  if (!insights) return null;

  return (
    <ScrollView
      className="flex-1 p-4"
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <View className="bg-paper-100 p-4 rounded-xl border border-paper-200 mb-4">
        <StyledText variant="extrabold" className="text-ink-800 text-base mb-2">
          Top Spenders
        </StyledText>
        {insights.topSpenders.map((c, i) => (
          <View
            key={c.id}
            className="flex-row justify-between items-center py-2 border-b border-paper-200 last:border-b-0"
          >
            <StyledText variant="semibold" className="text-ink-700 text-sm">
              {i + 1}. {c.name}
            </StyledText>
            <StyledText variant="extrabold" className="text-cinnamon-600 text-sm">
              {formatPesos(c.total_spent)}
            </StyledText>
          </View>
        ))}
      </View>

      <View className="bg-paper-100 p-4 rounded-xl border border-paper-200 mb-4">
        <StyledText variant="extrabold" className="text-ink-800 text-base mb-2">
          Credit Recovery Rate
        </StyledText>
        <StyledText variant="extrabold" className="text-sage-700 text-2xl">
          {insights.creditRecoveryRate}%
        </StyledText>
        <StyledText variant="regular" className="text-ink-500 text-xs mt-1">
          Percentage of store credit collected back from customers.
        </StyledText>
      </View>

      <View className="bg-paper-100 p-4 rounded-xl border border-paper-200">
        <StyledText variant="extrabold" className="text-ink-800 text-base mb-2">
          Average Order Value
        </StyledText>
        <StyledText variant="extrabold" className="text-cinnamon-700 text-2xl">
          {formatPesos(insights.averageOrderValue)}
        </StyledText>
      </View>
    </ScrollView>
  );
};
