import React from 'react';
import { View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { StyledText } from '@/components/elements';
import { MoneyText } from '@/components/ui/MoneyText';

export interface InventoryHeroCardProps {
  totalValue: number;
  productCount: number;
  unitCount: number;
}

export function InventoryHeroCard({
  totalValue,
  productCount,
  unitCount,
}: InventoryHeroCardProps) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 8 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 240 }}
      className="bg-cinnamon-500 rounded-3xl p-5 mb-1 shadow-md relative overflow-hidden border border-cinnamon-600"
    >
      <View className="absolute -right-4 -top-4 opacity-10" pointerEvents="none">
        <FontAwesome name="cube" size={120} color="#FAFAF7" />
      </View>

      <StyledText
        variant="extrabold"
        className="text-paper-200 text-[10px] uppercase tracking-widest"
      >
        Total Inventory Value
      </StyledText>

      <MoneyText
        value={totalValue}
        size="hero"
        className="text-white mt-1"
        currency="₱"
      />

      <View className="flex-row items-center gap-2.5 mt-2.5 pt-2.5 border-t border-cinnamon-400/30">
        <View className="bg-cinnamon-700/40 px-2.5 py-1 rounded-full border border-cinnamon-400/20">
          <StyledText variant="semibold" className="text-paper-100 text-[11px]">
            {productCount} {productCount === 1 ? 'product' : 'products'}
          </StyledText>
        </View>
        <View className="bg-cinnamon-700/40 px-2.5 py-1 rounded-full border border-cinnamon-400/20">
          <StyledText variant="semibold" className="text-paper-100 text-[11px]">
            {unitCount.toLocaleString()} {unitCount === 1 ? 'unit' : 'units'}
          </StyledText>
        </View>
      </View>
    </MotiView>
  );
}

