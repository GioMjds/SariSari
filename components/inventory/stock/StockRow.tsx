import React, { memo } from 'react';
import { View, Image, Pressable, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';
import { MoneyText } from '@/components/ui/MoneyText';
import { ProductStatusChip } from '@/components/inventory/ProductStatusChip';
import { getStatus } from '@/types/inventory.types';
import { getProductImageUri } from '@/lib';

interface Props {
  product: {
    id: number;
    name: string;
    quantity: number;
    price: number;
    cost_price?: number;
    image_uri?: string;
  };
  onPress: (id: number) => void;
  onLongPress?: (id: number) => void;
  onRestock?: (id: number) => void;
}

function StockRowImpl({ product, onPress, onLongPress, onRestock }: Props) {
  const status = getStatus(product as any);
  const showRestock = status === 'low_stock' || status === 'out_of_stock';
  const placeholderText = product.name
    ? product.name.trim().charAt(0).toUpperCase()
    : '?';
  const displayImageUri = getProductImageUri(product.image_uri);

  return (
    <Pressable
      onPress={() => onPress(product.id)}
      onLongPress={() => onLongPress?.(product.id)}
      accessibilityRole="button"
      accessibilityLabel={`${product.name}, ${product.quantity} units in stock`}
      className="bg-paper-50 mx-4 mb-2 p-3 rounded-2xl border border-ink-100 flex-row items-center gap-3"
      style={{ minHeight: 64 }}
    >
      {displayImageUri ? (
        <Image
          source={{ uri: displayImageUri }}
          className="w-11 h-11 rounded-xl bg-paper-100"
        />
      ) : (
        <View className="w-11 h-11 rounded-xl bg-persimmon-50 border border-persimmon-100 items-center justify-center">
          <StyledText variant="black" className="text-persimmon-600 text-base">
            {placeholderText}
          </StyledText>
        </View>
      )}
      <View className="flex-1 min-w-0">
        <StyledText
          variant="extrabold"
          numberOfLines={1}
          ellipsizeMode="tail"
          className="text-sm text-ink-900"
        >
          {product.name}
        </StyledText>
        <View className="flex-row items-center mt-0.5">
          <StyledText
            variant="medium"
            numberOfLines={1}
            className="text-ink-600 text-[11px]"
          >
            {product.quantity} pcs ·{' '}
            <MoneyText
              value={product.price ?? 0}
              size="sm"
              className="text-ink-700 font-semibold"
            />
          </StyledText>
        </View>
      </View>
      <View className="items-end gap-1 shrink-0">
        <ProductStatusChip status={status} />
        {showRestock && onRestock ? (
          <TouchableOpacity
            onPress={() => onRestock(product.id)}
            accessibilityRole="button"
            accessibilityLabel={`Restock ${product.name}`}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            className="px-2.5 py-1.5 rounded-lg bg-persimmon-500 flex-row items-center gap-1"
            style={{ minHeight: 28 }}
          >
            <FontAwesome name="plus" size={10} color="#FFFFFF" />
            <StyledText variant="extrabold" className="text-paper-50 text-[11px]">
              Restock
            </StyledText>
          </TouchableOpacity>
        ) : null}
      </View>
    </Pressable>
  );
}

export const StockRow = memo(StockRowImpl);
