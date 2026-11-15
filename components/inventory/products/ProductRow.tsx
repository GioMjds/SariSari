import { memo, useCallback } from 'react';
import { View, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { StyledText } from '@/components/elements';
import { MoneyText } from '@/components/ui/MoneyText';
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
  const { id, name, category, retail_unit_name, price, image_uri } = product;

  const handlePress = useCallback(() => onPress(id), [onPress, id]);
  const handleLongPress = useCallback(
    () => onLongPress?.(id),
    [onLongPress, id],
  );
  const handleActionPress = useCallback(
    () => onActionPress?.(product),
    [onActionPress, product],
  );

  const placeholderText = name ? name.trim().charAt(0).toUpperCase() : '?';
  const displayImageUri = getProductImageUri(image_uri);

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={handleLongPress}
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${price} pesos`}
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
          {name}
        </StyledText>
        <StyledText
          variant="medium"
          numberOfLines={1}
          ellipsizeMode="tail"
          className="text-ink-600 text-xs mt-0.5"
        >
          {category ?? 'Uncategorized'} · {retail_unit_name ?? 'Pc'}
        </StyledText>
      </View>
      <View className="flex-row items-center gap-2">
        <View className="items-end gap-1 shrink-0">
          <MoneyText value={price ?? 0} size="lg" className="text-ink-900" />
        </View>
        {onActionPress ? (
          <Pressable
            onPress={handleActionPress}
            accessibilityLabel={`Actions for ${name}`}
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
