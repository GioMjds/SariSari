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
        <StyledText className="text-ink-500 text-[11px]">
          {product.quantity} pcs · retail {''}
          <MoneyText
            value={product.price ?? 0}
            size="sm"
            className="text-ink-700"
          />
        </StyledText>
      </View>
      <ProductStatusChip status={status} />
      {showRestock && onRestock ? (
        <TouchableOpacity
          onPress={() => onRestock(product.id)}
          accessibilityRole="button"
          accessibilityLabel={`Restock ${product.name}`}
          className="px-3 py-2 rounded-xl bg-persimmon-500 min-h-[36px] flex-row items-center gap-1"
        >
          <FontAwesome name="plus" size={11} color="#FFFFFF" />
          <StyledText variant="extrabold" className="text-paper-50 text-[11px]">
            Restock
          </StyledText>
        </TouchableOpacity>
      ) : null}
    </Pressable>
  );
}

export const StockRow = memo(StockRowImpl);
