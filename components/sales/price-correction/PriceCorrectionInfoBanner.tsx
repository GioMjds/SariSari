import React from 'react';
import { View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';

export const PriceCorrectionInfoBanner: React.FC = () => {
  return (
    <View className="bg-paper-50 rounded-2xl shadow-paper border border-ink-100 p-4 mb-4">
      <View className="flex-row items-center justify-between mb-2">
        <View className="px-2.5 py-1 rounded-full flex-row items-center gap-1.5 border bg-amber-50 border-amber-200">
          <FontAwesome name="info-circle" size={12} color="#92400E" />
          <StyledText variant="extrabold" className="text-xs label-caps text-amber-900">
            Price Correction Impact
          </StyledText>
        </View>
        <StyledText variant="medium" className="text-ink-400 text-xs">
          Audit Trail
        </StyledText>
      </View>

      <StyledText
        variant="regular"
        className="text-ink-700 text-xs leading-5 mt-1"
      >
        • Adjust unit prices for any item without altering quantities{'\n'}
        • Subtotal & grand total recalculate automatically{'\n'}
        • Reverses/updates ledger difference without destroying history
      </StyledText>
    </View>
  );
};
