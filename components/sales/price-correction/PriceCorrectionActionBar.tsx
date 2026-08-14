import React from 'react';
import { Pressable, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';

type PriceCorrectionActionBarProps = {
  onSubmit: () => void;
  isSubmitting: boolean;
  isLoading: boolean;
  error?: string | undefined;
};

export const PriceCorrectionActionBar: React.FC<
  PriceCorrectionActionBarProps
> = ({ onSubmit, isSubmitting, isLoading, error }) => {
  return (
    <View>
      {error && (
        <View className="mb-3 p-3 rounded-xl bg-semantic-danger/10 border border-semantic-danger/20 flex-row items-center gap-2">
          <FontAwesome name="exclamation-circle" size={14} color="#DC2626" />
          <StyledText
            variant="medium"
            className="text-semantic-danger text-xs flex-1"
            accessibilityRole="alert"
          >
            {error}
          </StyledText>
        </View>
      )}

      <Pressable
        onPress={onSubmit}
        disabled={isSubmitting || isLoading}
        accessibilityRole="button"
        accessibilityLabel="Save Price Correction"
        className={`rounded-2xl py-4 flex-row items-center justify-center press-scale active:opacity-80 ${
          isSubmitting || isLoading
            ? 'bg-ink-100 shadow-none'
            : 'bg-cinnamon-600 shadow-paper'
        }`}
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
    </View>
  );
};
