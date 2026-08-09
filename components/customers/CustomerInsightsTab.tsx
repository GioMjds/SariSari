import { FC } from 'react';
import { View, ScrollView } from 'react-native';
import { StyledText } from '@/components/elements';
import { CustomerInsights } from '@/types/credits.types';
import { formatPesos } from '@/lib';

interface CustomerInsightsTabProps {
  insights?: CustomerInsights;
}

export const CustomerInsightsTab: FC<CustomerInsightsTabProps> = ({
  insights,
}) => {
  if (!insights) return null;

  return (
    <ScrollView
      className="flex-1 p-4 bg-paper-200"
      contentContainerStyle={{ paddingBottom: 80 }}
      showsVerticalScrollIndicator={false}
    >
      <View className="bg-paper-100 p-4 rounded-2xl border border-paper-200 mb-4 shadow-sm">
        <StyledText variant="extrabold" className="text-ink-900 text-base mb-2">
          Top Spenders
        </StyledText>
        {insights.topSpenders.map((c, i) => (
          <View
            key={c.id}
            className="flex-row justify-between items-center py-2.5 border-b border-paper-200 last:border-b-0"
          >
            <StyledText variant="semibold" className="text-ink-800 text-sm">
              {i + 1}. {c.name}
            </StyledText>
            <StyledText
              variant="extrabold"
              className="text-cinnamon-600 text-sm"
            >
              {formatPesos(c.total_spent)}
            </StyledText>
          </View>
        ))}
      </View>

      <View className="bg-paper-100 p-4 rounded-2xl border border-paper-200 mb-4 shadow-sm">
        <StyledText variant="extrabold" className="text-ink-900 text-base mb-1">
          Credit Recovery Rate
        </StyledText>
        <StyledText variant="extrabold" className="text-sage-700 text-3xl my-1">
          {insights.creditRecoveryRate}%
        </StyledText>
        <StyledText variant="medium" className="text-ink-400 text-xs">
          Percentage of store credit collected back from customers.
        </StyledText>
      </View>

      <View className="bg-paper-100 p-4 rounded-2xl border border-paper-200 shadow-sm">
        <StyledText variant="extrabold" className="text-ink-900 text-base mb-1">
          Average Order Value
        </StyledText>
        <StyledText
          variant="extrabold"
          className="text-cinnamon-600 text-3xl my-1"
        >
          {formatPesos(insights.averageOrderValue)}
        </StyledText>
      </View>
    </ScrollView>
  );
};
