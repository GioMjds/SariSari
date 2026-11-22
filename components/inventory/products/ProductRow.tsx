import { memo, useCallback } from 'react';
import { View, Pressable, type PressableStateCallbackType } from 'react-native';
import { StyledText } from '@/components/elements';
import { MoneyText } from '@/components/ui/MoneyText';
import { ProductThumb } from '@/components/ui/ProductThumb';
import { StockBadge, getStockLabel } from '@/components/ui/StockBadge';
import { calculateBulkSavings } from '@/lib';
import { FontAwesome } from '@expo/vector-icons';
import type { Product } from '@/types/products.types';

interface Props {
  product: Product;
  onPress: (id: number) => void;
  onLongPress?: (id: number) => void;
  onActionPress?: (product: Product) => void;
}

// Pressed color via style function; NativeWind active: classes add a per-node interaction wrapper.
export const PRESS_CARD = ({ pressed }: PressableStateCallbackType) =>
  pressed ? { backgroundColor: '#F2F0E8' } : null; // paper-100

function ProductRowImpl({
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
      className="bg-paper-50 mx-4 mb-2 p-2.5 rounded-2xl border border-ink-100 flex-row items-center gap-3"
      style={PRESS_CARD}
    >
      <ProductThumb
        name={name}
        imageUri={image_uri}
        className="w-[68px] h-[68px] rounded-xl border border-paper-300"
        initialsClassName="text-xl"
      >
        {quantity <= 0 ? (
          <View className="absolute inset-0 bg-paper-50/60" />
        ) : null}
      </ProductThumb>

      <View className="flex-1 min-w-0 gap-1">
        <StyledText
          variant="extrabold"
          numberOfLines={2}
          ellipsizeMode="tail"
          className="text-[15px] leading-tight text-ink-900"
        >
          {name}
        </StyledText>
        <StyledText
          variant="medium"
          numberOfLines={1}
          ellipsizeMode="tail"
          className="text-ink-500 text-xs"
        >
          {category ?? 'Uncategorized'}
        </StyledText>
        <View className="flex-row items-center flex-wrap gap-1.5">
          <StockBadge quantity={quantity} />
          {hasWholesale ? (
            <View className="flex-row items-center bg-sage-50 border border-sage-200 rounded-full px-2 py-0.5">
              <FontAwesome name="cubes" size={10} color="#4F7A24" />
              <StyledText
                variant="semibold"
                className="text-sage-700 text-[11px] ml-1"
              >
                Bundle
              </StyledText>
            </View>
          ) : null}
        </View>
      </View>

      <View className="items-end self-stretch justify-between shrink-0">
        <View className="items-end">
          <MoneyText value={price ?? 0} size="lg" className="text-ink-900" />
          <StyledText variant="medium" className="text-ink-500 text-[11px]">
            per {retailUnit}
          </StyledText>
        </View>
        {onActionPress ? (
          <Pressable
            onPress={handleActionPress}
            accessibilityLabel={`Actions for ${name}`}
            accessibilityRole="button"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="w-8 h-8 -mr-1 rounded-full items-center justify-center active:bg-paper-200"
          >
            <FontAwesome name="ellipsis-v" size={16} color="#7A7165" />
          </Pressable>
        ) : null}
      </View>
    </Pressable>
  );
}

export const ProductRow = memo(ProductRowImpl);
