import React from 'react';
import { View } from 'react-native';
import { MotiView } from 'moti';
import { ReceiptHero, MoneyText } from '@/components/ui';
import { StyledText } from '@/components/elements';

interface ProductsHeroProps {
  total: number;
  lowStock: number;
  totalValueCentavos: number;
}

export const ProductsHero = React.memo(function ProductsHero({
  total,
  lowStock,
  totalValueCentavos,
}: ProductsHeroProps) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 18 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 480, delay: 80 }}
    >
      <View className="px-4 -mt-2 mb-4">
        <ReceiptHero tone="persimmon" headerLabel="STOCK OVERVIEW">
          <View className="px-5 py-4 flex-row justify-between items-center gap-3">
            {/* Total Tile */}
            <View className="flex-1 items-center bg-paper-100/50 rounded-xl p-3 border border-ink-100">
              <StyledText
                variant="semibold"
                className="text-ink-400 text-[10px] uppercase tracking-wider mb-1"
              >
                Total
              </StyledText>
              <StyledText variant="extrabold" className="text-ink-900 text-lg">
                {total}
              </StyledText>
            </View>

            {/* Low Stock Tile */}
            <View className="flex-1 items-center bg-paper-100/50 rounded-xl p-3 border border-ink-100">
              <StyledText
                variant="semibold"
                className="text-ink-400 text-[10px] uppercase tracking-wider mb-1"
              >
                Low
              </StyledText>
              <StyledText
                variant="extrabold"
                className={`text-lg ${lowStock > 0 ? 'text-persimmon-600' : 'text-ink-900'}`}
              >
                {lowStock}
              </StyledText>
            </View>

            {/* Value Tile */}
            <View className="flex-1 items-center bg-paper-100/50 rounded-xl p-3 border border-ink-100">
              <StyledText
                variant="semibold"
                className="text-ink-400 text-[10px] uppercase tracking-wider mb-1"
              >
                Value
              </StyledText>
              <MoneyText
                value={totalValueCentavos / 100}
                fromPesos
                size="xl"
                className="text-ink-900"
              />
            </View>
          </View>
        </ReceiptHero>
      </View>
    </MotiView>
  );
});
