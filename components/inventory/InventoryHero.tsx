import { memo } from 'react';
import { View } from 'react-native';
import {
  MoneyText,
  ReceiptHero,
  ReceiptHeroDivider,
  ReceiptHeroMeta,
} from '@/components/ui';
import { MotiView } from 'moti';

interface InventoryHeroProps {
  stats: {
    totalProducts: number;
    totalItems: number;
    lowStockCount: number;
    outOfStockCount: number;
    totalValuePesos: number;
  };
}

export const InventoryHero = memo(function InventoryHero({
  stats,
}: InventoryHeroProps) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 18 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 480, delay: 80 }}
    >
      <View className="px-4 -mt-2 mb-4">
        <ReceiptHero tone="persimmon" headerLabel="OFFICIAL LEDGER">
          <ReceiptHeroDivider label="Stock Overview" tone="persimmon" />

          {/* Hero stock value */}
          <View className="px-5 py-4 bg-paper-100 border-y border-dashed border-ink-200">
            <View className="flex-row items-baseline justify-between mb-2">
              <MoneyText
                value={stats.totalValuePesos / 100}
                fromPesos
                size="display"
                className="text-ink-900 font-extrabold"
                style={{ fontSize: 40, letterSpacing: -0.8 }}
              />
            </View>
          </View>

          {/* Meta rows */}
          <ReceiptHeroMeta
            rows={[
              {
                label: 'TOTAL PRODUCTS',
                value: String(stats.totalProducts),
              },
              {
                label: 'ITEMS IN STOCK',
                value: String(stats.totalItems),
              },
              {
                label: 'LOW / OUT OF STOCK',
                value: `${stats.lowStockCount} / ${stats.outOfStockCount}`,
              },
            ]}
          />
        </ReceiptHero>
      </View>
    </MotiView>
  );
});
