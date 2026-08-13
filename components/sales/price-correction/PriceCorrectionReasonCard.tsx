import React from 'react';
import { Pressable, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';
import type { PriceCorrectionReasonCode } from '@/types/corrections.types';

type ReasonOption = {
  value: PriceCorrectionReasonCode;
  label: string;
  icon: keyof typeof FontAwesome.glyphMap;
};

const REASON_OPTIONS: ReasonOption[] = [
  { value: 'misprinted_price', label: 'Misprinted Price', icon: 'tag' },
  {
    value: 'shelf_price_changed',
    label: 'Shelf Price Changed',
    icon: 'shopping-basket',
  },
];

type PriceCorrectionReasonCardProps = {
  selectedReason: PriceCorrectionReasonCode;
  onSelectReason: (reason: PriceCorrectionReasonCode) => void;
};

export const PriceCorrectionReasonCard: React.FC<
  PriceCorrectionReasonCardProps
> = ({ selectedReason, onSelectReason }) => {
  return (
    <View className="bg-paper-50 rounded-2xl shadow-paper border border-ink-100 p-4 mb-4">
      <StyledText
        variant="black"
        className="label-caps text-cinnamon-500 mb-1"
      >
        Reason Code *
      </StyledText>
      <StyledText variant="regular" className="text-ink-400 text-xs mb-3">
        Specify why prices are being modified
      </StyledText>

      <View className="gap-2">
        {REASON_OPTIONS.map((opt) => {
          const isSelected = selectedReason === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => onSelectReason(opt.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={opt.label}
              className={`press-scale p-3.5 rounded-xl border flex-row items-center justify-between ${
                isSelected
                  ? 'bg-cinnamon-50 border-cinnamon-500'
                  : 'bg-paper-100 border-ink-100 active:bg-paper-200'
              }`}
            >
              <View className="flex-row items-center gap-3">
                <View
                  className={`w-8 h-8 rounded-lg items-center justify-center ${
                    isSelected
                      ? 'bg-cinnamon-500'
                      : 'bg-paper-200 border border-ink-100'
                  }`}
                >
                  <FontAwesome
                    name={opt.icon}
                    size={13}
                    color={isSelected ? '#FBF7EE' : '#564E45'}
                  />
                </View>
                <StyledText
                  variant={isSelected ? 'extrabold' : 'medium'}
                  className={`text-sm ${
                    isSelected ? 'text-cinnamon-950' : 'text-ink-800'
                  }`}
                >
                  {opt.label}
                </StyledText>
              </View>

              <View
                className={`w-5 h-5 rounded-full border items-center justify-center ${
                  isSelected
                    ? 'border-cinnamon-500 bg-cinnamon-500'
                    : 'border-ink-200 bg-paper-50'
                }`}
              >
                {isSelected && (
                  <FontAwesome name="check" size={10} color="#FBF7EE" />
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};
