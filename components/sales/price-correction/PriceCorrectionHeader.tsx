import React from 'react';
import { Pressable, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';

type PriceCorrectionHeaderProps = {
  saleId: number;
  onBack: () => void;
};

export const PriceCorrectionHeader: React.FC<PriceCorrectionHeaderProps> = ({
  saleId,
  onBack,
}) => {
  return (
    <View className="px-5 pt-3 pb-4 bg-background">
      <View className="bg-paper-50 rounded-2xl shadow-paper border border-ink-100 px-4 py-3 flex-row items-center justify-between">
        <Pressable
          onPress={onBack}
          hitSlop={{ top: 16, bottom: 16, left: 20, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="press-scale w-11 h-11 items-center justify-center rounded-full bg-paper-100 border border-ink-100 active:opacity-70"
        >
          <FontAwesome name="arrow-left" size={16} color="#0E0C0A" />
        </Pressable>

        <View className="flex-1 px-3 items-center">
          <StyledText
            variant="extrabold"
            className="label-caps text-ink-400"
            style={{ fontSize: 10 }}
          >
            TRANSACTION CORRECTION
          </StyledText>
          <StyledText variant="black" className="text-ink-900 text-lg mt-0.5">
            Price Correction
          </StyledText>
        </View>

        <View className="bg-paper-100 border border-ink-100 px-2.5 py-1 rounded-full flex-row items-center gap-1">
          <FontAwesome name="pencil" size={11} color="#623418" />
          <StyledText
            variant="extrabold"
            className="text-xs text-amber-900"
          >
            #{saleId}
          </StyledText>
        </View>
      </View>
    </View>
  );
};
