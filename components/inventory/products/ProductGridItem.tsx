import React from 'react';
import { View, Pressable } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { StyledText } from '@/components/elements';
import { Product } from '@/types';
import { LOW_STOCK_THRESHOLD } from '@/constants';
import { Image } from 'expo-image';
import { getProductImageUri } from '@/lib';
import { useRouter } from 'expo-router';
import { MoneyText } from '@/components/ui';

interface ProductGridItemProps {
  product: Product;
  index: number;
  onRestock: (product: Product) => void;
  onMore: (product: Product) => void;
}

export const ProductGridItem = React.memo(function ProductGridItem({
  product,
  index,
  onRestock,
  onMore,
  }: ProductGridItemProps) {
  const router = useRouter();

  const isOutOfStock = product.quantity === 0;
  const isLowStock = product.quantity > 0 && product.quantity < LOW_STOCK_THRESHOLD;

  let badgeBg = 'bg-sage-500';
  let badgeText = 'OK';
  if (isOutOfStock) {
    badgeBg = 'bg-semantic-danger';
    badgeText = 'Out';
  } else if (isLowStock) {
    badgeBg = 'bg-semantic-warning';
    badgeText = `${product.quantity} left`;
  }

  const placeholderText = product.name ? product.name.trim().charAt(0).toUpperCase() : '?';
  const displayImageUri = getProductImageUri(product.image_uri);

  const handlePress = () => {
    router.push(`/(edit-forms)/product-details/${product.id}`);
  };

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        type: 'timing',
        duration: 350,
        delay: (index % 6) * 50,
      }}
      className="flex-1 m-2"
    >
      <Pressable
        onPress={handlePress}
        onLongPress={() => onMore(product)}
        delayLongPress={400}
        accessibilityRole="button"
        accessibilityLabel={`${product.name}, price ${product.price}. Tap to view details. Long press for actions.`}
        style={({ pressed }) => ({
          transform: [{ scale: pressed ? 0.96 : 1 }],
          opacity: pressed ? 0.9 : 1,
        })}
        className="bg-white rounded-2xl border border-ink-100 shadow-sm overflow-hidden"
      >
        {/* Image Window */}
        <View className="h-[120px] w-full bg-paper-100 relative items-center justify-center overflow-hidden rounded-t-2xl">
          {displayImageUri ? (
            <Image
              source={{ uri: displayImageUri }}
              style={{ width: '100%', height: '100%', borderRadius: 16 }}
              className="w-full h-full rounded-t-2xl"
              contentFit="cover"
            />
          ) : (
            <View className="w-full h-full bg-persimmon-50 items-center justify-center rounded-t-2xl">
              <StyledText variant="black" className="text-persimmon-600 text-3xl">
                {placeholderText}
              </StyledText>
            </View>
          )}

          {/* 1px overlay outline to prevent image wash-out and add subtle depth */}
          <View className="absolute inset-0 border border-black/10 rounded-t-2xl" pointerEvents="none" />

          {/* Floating Badge */}
          <View className={`absolute top-2 right-2 px-2 py-0.5 rounded-full ${badgeBg}`}>
            <StyledText variant="extrabold" className="text-white text-[10px]">
              {badgeText}
            </StyledText>
          </View>
        </View>

        {/* Details Row & Footer Action Row */}
        <View className="p-3">
          <StyledText
            variant="semibold"
            className="text-ink-900 text-sm mb-0.5"
            numberOfLines={1}
          >
            {product.name}
          </StyledText>
          <StyledText
            variant="regular"
            className="text-ink-500 text-xs mb-2"
            numberOfLines={1}
          >
            {product.category || 'No Category'}
          </StyledText>

          {/* Footer Action Row */}
          <View className="flex-row items-center justify-between mt-1">
            <MoneyText
              value={product.price}
              size="lg"
              className="text-persimmon-500 font-extrabold"
            />

            <Pressable
              onPress={() => onRestock(product)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`Restock ${product.name}`}
              style={({ pressed }) => ({
                shadowColor: '#E85A1F',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.18,
                shadowRadius: 12,
                elevation: 4,
                transform: [{ scale: pressed ? 0.96 : 1 }],
                opacity: pressed ? 0.85 : 1,
              })}
              className="w-8 h-8 rounded-full bg-persimmon-500 items-center justify-center shadow-persimmon-glow"
            >
              <FontAwesome name="plus" size={12} color="#FBF7EE" />
            </Pressable>
          </View>
        </View>
      </Pressable>
    </MotiView>
  );
});

