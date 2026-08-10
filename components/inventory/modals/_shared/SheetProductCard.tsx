import React from 'react';
import { View } from 'react-native';
import { StyledText } from '@/components/elements';
import { MoneyText } from '@/components/ui/MoneyText';

export interface SheetProductCardProduct {
  name: string;
  sku?: string | null;
  quantity: number;
  price: number;
}

interface Props {
  product: SheetProductCardProduct;
}

export function SheetProductCard({ product }: Props) {
  return (
    <View className="bg-paper-50 border border-paper-200 rounded-2xl p-4 gap-y-2">
      <StyledText
        variant="black"
        className="text-ink-900 text-base"
        numberOfLines={1}
      >
        {product.name}
      </StyledText>
      <StyledText variant="medium" className="text-ink-500 text-xs">
        SKU: {product.sku ?? '-'}
      </StyledText>
      <View className="flex-row mt-2 gap-x-8">
        <View>
          <StyledText variant="regular" className="text-ink-500 text-[11px]">
            Current Stock
          </StyledText>
          <StyledText variant="black" className="text-ink-900 text-base">
            {product.quantity}
          </StyledText>
        </View>
        <View>
          <StyledText variant="regular" className="text-ink-500 text-[11px]">Price</StyledText>
          <MoneyText value={product.price} size="sm" className="text-ink-900" />
        </View>
      </View>
    </View>
  );
}
