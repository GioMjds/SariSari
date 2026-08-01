import React, { memo } from 'react';
import { View, Image, Pressable } from 'react-native';
import { StyledText } from '@/components/elements';
import { MoneyText } from '@/components/ui/MoneyText';
import { ProductStatusChip } from '@/components/inventory/ProductStatusChip';
import { getStatus } from '@/types/inventory.types';
import { getProductImageUri } from '@/lib';

interface Props {
  product: {
    id: number;
    name: string;
    category?: string;
    unitSize?: string;
    price: number;
    quantity: number;
    cost_price?: number;
    created_at: number;
    image_uri?: string;
  };
  onPress: (id: number) => void;
  onLongPress?: (id: number) => void;
}

function ProductRowImpl({ product, onPress, onLongPress }: Props) {
  const status = getStatus(product);
  const placeholderText = product.name
    ? product.name.trim().charAt(0).toUpperCase()
    : '?';
  const displayImageUri = getProductImageUri(product.image_uri);

  return (
    <Pressable
      onPress={() => onPress(product.id)}
      onLongPress={() => onLongPress?.(product.id)}
      accessibilityRole="button"
      accessibilityLabel={`${product.name}, ${product.price} pesos`}
      className="bg-paper-50 mx-4 mb-2 p-3 rounded-2xl border border-ink-100 flex-row items-center gap-3 min-h-[44px]"
    >
      {displayImageUri ? (
        <Image
          source={{ uri: displayImageUri }}
          className="w-10 h-10 rounded-xl bg-paper-100"
        />
      ) : (
        <View className="w-10 h-10 rounded-xl bg-persimmon-50 border border-persimmon-100 items-center justify-center">
          <StyledText variant="black" className="text-persimmon-600 text-base">
            {placeholderText}
          </StyledText>
        </View>
      )}
      <View className="flex-1">
        <StyledText
          variant="extrabold"
          numberOfLines={1}
          className="text-sm text-ink-900"
        >
          {product.name}
        </StyledText>
        <StyledText variant="medium" className="text-ink-600 text-[11px]">
          {product.category ?? 'Uncategorized'} · {product.unitSize ?? '1 pc'}
        </StyledText>
      </View>
      <View className="items-end gap-1">
        <MoneyText
          value={product.price ?? 0}
          size="sm"
          className="text-ink-900"
        />
        <ProductStatusChip status={status} />
      </View>
    </Pressable>
  );
}

export const ProductRow = memo(ProductRowImpl);
