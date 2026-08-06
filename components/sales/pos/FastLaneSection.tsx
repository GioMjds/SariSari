import { FC } from 'react';
import { ScrollView, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { FastLaneProduct } from '@/database/products';
import { useFastLaneProducts } from '@/hooks/useProducts';
import { FastLaneCard } from './FastLaneCard';
import { StyledText } from '@/components/elements';

interface FastLaneSectionProps {
  onAddToCart: (product: FastLaneProduct, quantity: number) => void;
}

export const FastLaneSection: FC<FastLaneSectionProps> = ({ onAddToCart }) => {
  const { data: fastLaneProducts = [], isLoading } = useFastLaneProducts();

  if (isLoading) return null;

  if (fastLaneProducts.length === 0) {
    return (
      <View className="mx-4 mb-3 bg-paper-100 border border-paper-300/70 rounded-xl p-3 flex-row items-center">
        <FontAwesome
          name="bolt"
          size={14}
          color="#E85A1F"
          style={{ marginRight: 8 }}
        />
        <StyledText variant="medium" className="text-ink-600 text-xs flex-1">
          Star products in the catalog below to pin them to Fast Lane for 1-tap
          checkout.
        </StyledText>
      </View>
    );
  }

  return (
    <View className="mb-3 px-4">
      <View className="flex-row items-center mb-2">
        <FontAwesome name="bolt" size={12} color="#E85A1F" />
        <StyledText
          variant="extrabold"
          className="text-persimmon-600 text-xs tracking-wider uppercase ml-1.5"
        >
          Fast Lane
        </StyledText>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 16 }}
      >
        {fastLaneProducts.map((product) => (
          <FastLaneCard
            key={product.id}
            product={product}
            onAddToCart={onAddToCart}
          />
        ))}
      </ScrollView>
    </View>
  );
};
