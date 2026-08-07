import { FC } from 'react';
import { Pressable, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { FastLaneProduct } from '@/database/products';
import { useToggleFavorite } from '@/hooks/useProducts';
import { StyledText } from '@/components/elements';
import { formatPesos } from '@/lib';

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
      className={
        'bg-paper-100 border border-paper-300 rounded-2xl p-3 mr-2.5 w-36 shadow-paper active:bg-paper-200/60 ' +
        (isOutOfStock ? 'opacity-60' : '')
      }
    >
      <View className="flex-row items-center justify-between mb-1">
        <StyledText
          variant="extrabold"
          className="text-ink-900 text-xs flex-1 mr-1"
          numberOfLines={1}
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

      {hasWholesale && (
        <View className="bg-sage-50 border border-sage-200 rounded-md px-1.5 py-0.5 self-start mb-1 flex-row items-center">
          <FontAwesome name="cubes" size={9} color="#4F7A24" />
          <StyledText
            variant="extrabold"
            className="text-sage-700 text-[9px] ml-1"
          >
            Bundle
          </StyledText>
        </View>
      )}

      <StyledText variant="extrabold" className="text-sage-700 text-xs mb-2">
        {formatPesos(product.price)}
      </StyledText>

      {isOutOfStock ? (
        <View className="bg-semantic-danger-50 border border-semantic-danger/20 rounded-lg py-1 items-center">
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
