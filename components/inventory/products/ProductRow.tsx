import React, { memo } from 'react';
import { View, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { StyledText } from '@/components/elements';
import { MoneyText } from '@/components/ui/MoneyText';
import { ProductStatusChip } from '@/components/inventory/ProductStatusChip';
import { getStatus } from '@/types/inventory.types';
import { getProductImageUri } from '@/lib';
import { FontAwesome } from '@expo/vector-icons';
import type { Product } from '@/types/products.types';

interface Props {
  product: Product;
  onPress: (id: number) => void;
  onLongPress?: (id: number) => void;
  onActionPress?: (product: Product) => void;
}

function ProductRowImpl({
  product,
  onPress,
  onLongPress,
  onActionPress,
}: Props) {
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
      className="bg-paper-50 mx-4 mb-2 p-3 rounded-2xl border border-ink-100 flex-row items-center gap-3"
      style={{ minHeight: 64 }}
    >
      {displayImageUri ? (
        <Image
          source={{ uri: displayImageUri }}
          contentFit="cover"
          transition={150}
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
        <StyledText
          variant="medium"
          numberOfLines={1}
          ellipsizeMode="tail"
          className="text-ink-600 text-xs mt-0.5"
        >
          {product.category ?? 'Uncategorized'} · {product.retail_unit_name ?? 'Pc'}
        </StyledText>
      </View>
      <View className="flex-row items-center gap-2">
        <View className="items-end gap-1 shrink-0" style={{ fontVariant: ['tabular-nums'] }}>
          <MoneyText
            value={product.price ?? 0}
            size="sm"
            className="text-ink-900"
          />
          <ProductStatusChip status={status} />
        </View>
        {onActionPress ? (
          <Pressable
            onPress={() => onActionPress(product)}
            accessibilityLabel={`Actions for ${product.name}`}
            accessibilityRole="button"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="w-8 h-8 rounded-full items-center justify-center active:bg-paper-200"
          >
            <FontAwesome name="ellipsis-v" size={16} color="#7A7165" />
          </Pressable>
        ) : null}
      </View>
    </Pressable>
  );
}

export const ProductRow = memo(ProductRowImpl);
