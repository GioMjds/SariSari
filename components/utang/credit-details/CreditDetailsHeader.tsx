import { FontAwesome } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import { StyledText } from '@/components/elements';

interface CreditDetailsHeaderProps {
  onBack: () => void;
  onDelete: () => void;
}

/**
 * CreditDetailsHeader — slim top bar for the Suki Ledger screen.
 *
 * Three-slot layout: circular back button on the left, "Suki Ledger"
 * eyebrow label in the center, circular trash button on the right.
 * No state of its own; receives both actions via props so the screen
 * keeps ownership of navigation and the delete-confirmation modal.
 */
export function CreditDetailsHeader({ onBack, onDelete }: CreditDetailsHeaderProps) {
  return (
    <View className="flex-row items-center justify-between px-5 pt-3 pb-2">
      <Pressable
        onPress={onBack}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        className="press-scale w-10 h-10 items-center justify-center rounded-full bg-paper-50 shadow-paper border border-ink-100 active:opacity-70"
      >
        <FontAwesome name="arrow-left" size={16} color="#0E0C0A" />
      </Pressable>

      <StyledText
        variant="extrabold"
        className="label-caps text-ink-400"
      >
        Suki Ledger
      </StyledText>

      <Pressable
        onPress={onDelete}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Delete customer"
        className="press-scale w-10 h-10 items-center justify-center rounded-full bg-paper-50 shadow-paper border border-ink-100 active:opacity-70"
      >
        <FontAwesome name="trash" size={14} color="#C13030" />
      </Pressable>
    </View>
  );
}
