import { View } from 'react-native';
import { formatPesos, Pesos } from '@/lib/money';
import { StyledText } from '@/components/elements';

interface GrandTotalCardProps {
  qty: number;
  unitPrice: number | Pesos;
  total: number | Pesos;
  itemCount?: number;
}

/**
 * GrandTotalCard — the `bg-cinnamon-500` printed plate at the
 * bottom of the ticket sheet showing the running total. Pure
 * presentation; receives `qty`, `unitPrice`, `total` already
 * computed by the form hook.
 */
export function GrandTotalCard({ qty, unitPrice, total, itemCount }: GrandTotalCardProps) {
  return (
    <View className="bg-cinnamon-500 rounded-2xl shadow-paper-lift px-5 py-4 overflow-hidden">
      <View className="flex-row items-baseline justify-between">
        <StyledText
          variant="medium"
          className="label-caps text-paper-200 opacity-90"
        >
          Grand Total
        </StyledText>
        <StyledText
          variant="medium"
          className="label-caps text-paper-200 opacity-90"
        >
          {itemCount && itemCount > 1
            ? `${itemCount} items`
            : `${qty} × ${formatPesos(unitPrice)}`}
        </StyledText>
      </View>
      <StyledText
        variant="extrabold"
        className="text-paper-50 text-hero mt-1"
        numberOfLines={1}
      >
        ₱
        {(total as number).toLocaleString('en-PH', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </StyledText>
    </View>
  );
}
