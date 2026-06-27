import { StyledText } from '@/components/elements';
import { FontAwesome } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

interface SaleDetailsHeaderProps {
  /** Numeric sale id — used to format the `Sale · 00123` title. */
  saleId: number;
  /** Number of digits the sale-id should be padded to. Defaults to 5. */
  idPadding?: number;
  /** Tap handlers for back + delete. */
  onBack: () => void;
  onDelete: () => void;
}

/**
 * SaleDetailsHeader — top bar of the Sale Details (receipt) screen.
 *
 * Three equal-weight columns:
 *   • Back button (circular, paper-50).
 *   • Centered `Sale · 00123` label.
 *   • Trash/delete button (circular, paper-50 with semantic-danger icon).
 *
 * Pure presentational — orchestration lives in the screen.
 */
export function SaleDetailsHeader({
  saleId,
  idPadding = 5,
  onBack,
  onDelete,
}: SaleDetailsHeaderProps) {
  const saleLabel = `Sale · ${String(saleId).padStart(idPadding, '0')}`;

  return (
    <View className="flex-row items-center justify-between px-5 pt-3 pb-2">
      <Pressable
        onPress={onBack}
        hitSlop={20}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        className="w-10 h-10 rounded-full bg-paper-50 items-center justify-center shadow-paper border border-ink-100 active:opacity-70"
      >
        <FontAwesome name="arrow-left" size={16} color="#0E0C0A" />
      </Pressable>

      <StyledText variant="extrabold" className="label-caps text-ink-400">
        {saleLabel}
      </StyledText>

      <Pressable
        onPress={onDelete}
        hitSlop={20}
        accessibilityRole="button"
        accessibilityLabel="Delete sale"
        className="w-10 h-10 rounded-full bg-paper-50 items-center justify-center shadow-paper border border-ink-100 active:opacity-70"
      >
        <FontAwesome name="trash" size={14} color="#C13030" />
      </Pressable>
    </View>
  );
}