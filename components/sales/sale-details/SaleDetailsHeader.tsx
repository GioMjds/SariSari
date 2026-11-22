import { StyledText } from '@/components/elements';
import { FontAwesome } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

interface SaleDetailsHeaderProps {
  /** Numeric sale id — used to format the `Sale · 00123` title. */
  saleId: number;
  /** Number of digits the sale-id should be padded to. Defaults to 5. */
  idPadding?: number;
  onBack: () => void;
  /** Omitted while loading or when the sale is missing, hiding the trash button. */
  onDelete?: (() => void) | undefined;
}

const ICON_BUTTON =
  'w-11 h-11 rounded-full bg-paper-50 items-center justify-center border border-ink-100 active:bg-paper-100';

// Top bar of the resibo screen: back, centered sale label, delete.
export function SaleDetailsHeader({
  saleId,
  idPadding = 5,
  onBack,
  onDelete,
}: SaleDetailsHeaderProps) {
  const saleLabel = Number.isFinite(saleId)
    ? `Sale · ${String(saleId).padStart(idPadding, '0')}`
    : 'Sale';

  return (
    <View className="flex-row items-center justify-between px-4 pt-2 pb-2">
      <Pressable
        onPress={onBack}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        className={ICON_BUTTON}
      >
        <FontAwesome name="arrow-left" size={16} color="#0E0C0A" />
      </Pressable>

      <StyledText variant="extrabold" accessibilityRole="header" className="label-caps text-ink-500">
        {saleLabel}
      </StyledText>

      {onDelete ? (
        <Pressable
          onPress={onDelete}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Delete sale"
          accessibilityHint="Asks for confirmation, then restores the inventory"
          className={ICON_BUTTON}
        >
          <FontAwesome name="trash" size={15} color="#C13030" />
        </Pressable>
      ) : (
        <View className="w-11 h-11" />
      )}
    </View>
  );
}
