import React from 'react';
import { Pressable, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';

type PriceCorrectionActionBarProps = {
  onSubmit: () => void;
  isSubmitting: boolean;
  isLoading: boolean;
};

export const PriceCorrectionActionBar: React.FC<
  PriceCorrectionActionBarProps
> = ({ onSubmit, isSubmitting, isLoading }) => {
  return (
    <Pressable
      onPress={onSubmit}
      disabled={isSubmitting || isLoading}
      accessibilityRole="button"
      accessibilityLabel="Save Price Correction"
      className={`rounded-2xl py-4 flex-row items-center justify-center ${
        isSubmitting || isLoading
          ? 'bg-ink-100 shadow-none'
          : 'bg-cinnamon-600 shadow-paper'
      }`}
      style={({ pressed }) => ({
        transform: [{ scale: !isSubmitting && pressed ? 0.98 : 1 }],
      })}
    >
      <FontAwesome
        name={isSubmitting ? 'spinner' : 'check-circle'}
        size={16}
        color={isSubmitting ? '#7A7165' : '#FBF7EE'}
      />
      <StyledText
        variant="extrabold"
        className="text-paper-50 text-base ml-2"
      >
        {isSubmitting ? 'Saving Correction...' : 'Save Price Correction'}
      </StyledText>
    </Pressable>
  );
};
