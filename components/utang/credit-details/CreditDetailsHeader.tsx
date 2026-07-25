import { memo } from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import { StyledText } from '@/components/elements';

interface CreditDetailsHeaderProps {
  onBack: () => void;
  onDelete: () => void;
}

export const CreditDetailsHeader = memo(function CreditDetailsHeader({
  onBack,
  onDelete,
}: CreditDetailsHeaderProps) {
  return (
    <View className="flex-row items-center justify-between px-5 pt-3 pb-2">
      <Pressable
        onPress={onBack}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        className="press-scale w-11 h-11 items-center justify-center rounded-full bg-paper-50 shadow-paper border border-ink-100 active:opacity-70"
      >
        <FontAwesome name="arrow-left" size={16} color="#0E0C0A" />
      </Pressable>

      <StyledText variant="extrabold" className="label-caps text-ink-600">
        Suki Ledger
      </StyledText>

      <Pressable
        onPress={onDelete}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="Delete customer"
        className="press-scale w-11 h-11 items-center justify-center rounded-full bg-paper-50 shadow-paper border border-ink-100 active:opacity-70"
      >
        <FontAwesome name="trash" size={14} color="#C13030" />
      </Pressable>
    </View>
  );
});
