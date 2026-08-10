import { View } from 'react-native';
import { formatPesos, Pesos } from '@/lib/money';
import { StyledText } from '@/components/elements';
import { MoneyText } from '@/components/ui';

interface GrandTotalCardProps {
  qty: number;
  unitPrice: number | Pesos;
  total: number | Pesos;
  itemCount?: number;
}

export function GrandTotalCard({
  qty,
  unitPrice,
  total,
  itemCount,
}: GrandTotalCardProps) {
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
      <MoneyText value={total} size="hero" variant="default" className="mt-1" />
    </View>
  );
}
