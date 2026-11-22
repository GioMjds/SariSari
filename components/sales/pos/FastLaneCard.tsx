import { FC } from 'react';
import { Pressable, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { FastLaneProduct } from '@/database/products';
import { useToggleFavorite } from '@/hooks/useProducts';
import { StyledText } from '@/components/elements';
import { ProductThumb } from '@/components/ui/ProductThumb';

const CARD_AVAILABLE_CLASS =
  'bg-paper-100 border border-paper-300 rounded-2xl p-2.5 mr-2.5 w-44 h-[100px] justify-between shadow-paper active:bg-paper-200/60';
const CARD_OUT_OF_STOCK_CLASS =
  'bg-paper-100 border border-paper-300 rounded-2xl p-2.5 mr-2.5 w-44 h-[100px] justify-between shadow-paper active:bg-paper-200/60 opacity-60';

interface FastLaneCardProps {
  product: FastLaneProduct;
  onAddToCart: (product: FastLaneProduct, quantity: number) => void;
}

export const FastLaneCard: FC<FastLaneCardProps> = ({
  product,
  onAddToCart,
}) => {
  const toggleFavorite = useToggleFavorite();
  const isOutOfStock = product.quantity <= 0;
  const hasWholesale =
    product.wholesale_price != null &&
    product.wholesale_price > 0 &&
    product.conversion_factor != null &&
    product.conversion_factor >= 2;

  const handleToggleFav = () => {
    toggleFavorite.mutate({
      productId: product.id,
      isFavorite: !product.is_favorite,
    });
  };

  return (
    <View
      className={isOutOfStock ? CARD_OUT_OF_STOCK_CLASS : CARD_AVAILABLE_CLASS}
    >
      <View>
        <View className="flex-row items-start justify-between mb-1">
          <ProductThumb
            name={product.name}
            imageUri={product.image_uri}
            className="w-10 h-10 rounded-lg border border-paper-300 mr-2"
            initialsClassName="text-sm"
          >
            {hasWholesale ? (
              <View className="absolute bottom-0.5 right-0.5 bg-sage-50 rounded px-0.5">
                <FontAwesome name="cubes" size={8} color="#4F7A24" />
              </View>
            ) : null}
          </ProductThumb>
          <StyledText
            variant="extrabold"
            className="text-ink-900 text-xs leading-tight flex-1 mr-1"
            numberOfLines={2}
          >
            {product.name}
          </StyledText>
          <Pressable
            onPress={handleToggleFav}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={
              product.is_favorite
                ? `Remove ${product.name} from favorites`
                : `Add ${product.name} to favorites`
            }
          >
            <FontAwesome
              name={product.is_favorite ? 'star' : 'star-o'}
              size={14}
              color={product.is_favorite ? '#E85A1F' : '#7A7165'}
            />
          </Pressable>
        </View>
      </View>

      {isOutOfStock ? (
        <View className="bg-semantic-danger-50 border border-semantic-danger/20 rounded-lg py-1 items-center justify-center min-h-[32px]">
          <StyledText
            variant="semibold"
            className="text-semantic-danger text-[10px]"
          >
            Out of stock
          </StyledText>
        </View>
      ) : (
        <View className="flex-row items-center justify-between gap-1">
          {[1, 2, 5].map((qty) => (
            <Pressable
              key={qty}
              onPress={() => onAddToCart(product, qty)}
              accessibilityRole="button"
              accessibilityLabel={`Add ${qty} ${product.name} to cart`}
              className="flex-1 bg-cinnamon-500 active:bg-cinnamon-600 py-1.5 rounded-full items-center justify-center min-h-[32px]"
            >
              <StyledText
                variant="extrabold"
                className="text-paper-50 text-[11px]"
              >
                +{qty}
              </StyledText>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
};
