import { memo, useCallback } from 'react';
import { Pressable, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';
import { MoneyText } from '@/components/ui/MoneyText';
import { ProductThumb } from '@/components/ui/ProductThumb';
import { StockBadge, getStockLabel } from '@/components/ui/StockBadge';
import { calculateBulkSavings } from '@/lib';
import type { Product } from '@/types/products.types';
import { PRESS_CARD } from './ProductRow';

interface Props {
  product: Product;
  onPress: (id: number) => void;
  onLongPress?: (id: number) => void;
  onActionPress?: (product: Product) => void;
}

/** Grid view card for Inventory: photo first, then name, category and price. */
function ProductTileImpl({
  product,
  onPress,
  onLongPress,
  onActionPress,
}: Props) {
  const { id, name, category, retail_unit_name, price, image_uri, quantity } =
    product;

  const handlePress = useCallback(() => onPress(id), [onPress, id]);
  const handleLongPress = useCallback(
    () => onLongPress?.(id),
    [onLongPress, id],
  );
  const handleActionPress = useCallback(
    () => onActionPress?.(product),
    [onActionPress, product],
  );

  const retailUnit = retail_unit_name ?? 'Pc';
  const { hasWholesale } = calculateBulkSavings(product);

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={handleLongPress}
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${price} pesos per ${retailUnit}, ${getStockLabel(quantity)}`}
      className="w-[48.5%] mb-3 rounded-2xl bg-paper-50 border border-ink-100 overflow-hidden"
      style={PRESS_CARD}
    >
      <ProductThumb
        name={name}
        imageUri={image_uri}
        className="w-full h-28"
        initialsClassName="text-3xl"
      >
        {quantity <= 0 ? (
          <View className="absolute inset-0 bg-paper-50/50" />
        ) : null}
        <StockBadge quantity={quantity} className="absolute bottom-2 left-2" />
        {hasWholesale ? (
          <View className="absolute bottom-2 right-2 bg-sage-50 border border-sage-200 rounded-full w-6 h-6 items-center justify-center">
            <FontAwesome name="cubes" size={10} color="#4F7A24" />
          </View>
        ) : null}
      </ProductThumb>

      {onActionPress ? (
        <Pressable
          onPress={handleActionPress}
          hitSlop={6}
          accessibilityLabel={`Actions for ${name}`}
          accessibilityRole="button"
          className="absolute top-1.5 right-1.5 w-9 h-9 rounded-full bg-paper-50/90 border border-paper-300 items-center justify-center"
        >
          <FontAwesome name="ellipsis-v" size={15} color="#3D372F" />
        </Pressable>
      ) : null}

      <View className="p-2.5 gap-0.5">
        <StyledText
          variant="extrabold"
          numberOfLines={2}
          className="text-sm leading-tight text-ink-900 min-h-[36px]"
        >
          {name}
        </StyledText>
        <StyledText
          variant="medium"
          numberOfLines={1}
          className="text-ink-500 text-xs"
        >
          {category ?? 'Uncategorized'}
        </StyledText>
        <View className="flex-row items-baseline mt-1">
          <MoneyText value={price ?? 0} size="md" className="text-ink-900" />
          <StyledText
            variant="medium"
            className="text-ink-500 text-[11px] ml-1"
          >
            / {retailUnit}
          </StyledText>
        </View>
      </View>
    </Pressable>
  );
}

export const ProductTile = memo(ProductTileImpl);
