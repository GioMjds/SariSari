import { memo } from 'react';
import {
  MoneyText,
  ReceiptHero,
  ReceiptHeroDivider,
  ReceiptHeroMeta,
} from '@/components/ui';
import { MotiView } from 'moti';
import { View } from 'react-native';

interface ProductsHeroProps {
  total: number;
  lowStock: number;
  totalValuePesos: number;
}

export const ProductsHero = memo(function ProductsHero({
  total,
  lowStock,
  totalValuePesos,
}: ProductsHeroProps) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 18 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 480, delay: 80 }}
    >
      <View className="px-4 -mt-2 mb-4">
        <ReceiptHero tone="persimmon" headerLabel="OFFICIAL LEDGER">
          <ReceiptHeroDivider label="Stock Overview" tone="persimmon" />

          {/* Hero stock value — full width so big pesos never wrap */}
          <View className="px-5 py-4 bg-paper-100 border-y border-dashed border-ink-200">
            <View className="flex-row items-baseline justify-between">
              <MoneyText
                value={totalValuePesos}
                size="display"
                className="text-ink-900"
                style={{ fontSize: 36, letterSpacing: -0.8 }}
                numberOfLines={1}
              />
            </View>
          </View>

          {/* Meta rows mirror the resibo/ledger UI */}
          <ReceiptHeroMeta
            rows={[
              { label: 'TOTAL PRODUCTS', value: String(total) },
              { label: 'LOW / OUT OF STOCK', value: String(lowStock) },
            ]}
          />
        </ReceiptHero>
      </View>
    </MotiView>
  );
});
