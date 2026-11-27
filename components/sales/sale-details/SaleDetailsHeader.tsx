import { StyledText } from '@/components/elements';
import { ICON_COLOR } from '@/lib/theme';
import { formatReceiptRef } from '@/utils';
import { FontAwesome } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

interface SaleDetailsHeaderProps {
  /** Numeric sale id, formatted with the same ref as the receipts list. */
  saleId: number;
  onBack: () => void;
  /** Omitted while loading or when the sale is missing, hiding the More button. */
  onMore?: (() => void) | undefined;
}

const ICON_BUTTON =
  'w-11 h-11 rounded-full bg-paper-50 items-center justify-center border border-ink-100 active:bg-paper-100';

// Top bar of the resibo screen: back, centered resibo ref, more actions.
export function SaleDetailsHeader({ saleId, onBack, onMore }: SaleDetailsHeaderProps) {
  const label = Number.isFinite(saleId) ? `Resibo ${formatReceiptRef(saleId)}` : 'Resibo';

  return (
    <View className="flex-row items-center justify-between px-4 pt-2 pb-2">
      <Pressable
        onPress={onBack}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        className={ICON_BUTTON}
      >
        <FontAwesome name="arrow-left" size={16} color={ICON_COLOR.ink} />
      </Pressable>

      <StyledText
        variant="extrabold"
        accessibilityRole="header"
        numberOfLines={1}
        className="text-base text-ink-900 shrink mx-3"
      >
        {label}
      </StyledText>

      {onMore ? (
        <Pressable
          onPress={onMore}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="More actions"
          accessibilityHint="Copy the reference number or delete this sale"
          className={ICON_BUTTON}
        >
          <FontAwesome name="ellipsis-h" size={16} color={ICON_COLOR.ink} />
        </Pressable>
      ) : (
        <View className="w-11 h-11" />
      )}
    </View>
  );
}
