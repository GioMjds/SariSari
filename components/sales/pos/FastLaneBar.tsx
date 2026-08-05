import { FC } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { StyledText } from '@/components/elements';
import { FastLaneProduct } from '@/database/products';
import { useFastLaneProducts } from '@/hooks/useProducts';
import { FastLaneCard } from './FastLaneCard';

interface FastLaneBarProps {
  onAddToCart: (product: FastLaneProduct, quantity: number) => void;
}

export const FastLaneBar: FC<FastLaneBarProps> = ({ onAddToCart }) => {
  const { data: fastLaneProducts = [], isLoading } = useFastLaneProducts();

  if (isLoading || fastLaneProducts.length === 0) {
    return (
      <View style={styles.hintContainer}>
        <Text style={styles.hintText}>
          ⚡ ⭐ Star products in catalog to populate Fast Lane for 1-tap
          checkout.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StyledText variant="extrabold" style={styles.sectionTitle}>
        ⚡ FAST LANE
      </StyledText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
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

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1565c0',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingRight: 10,
  },
  hintContainer: {
    backgroundColor: '#e3f2fd',
    padding: 10,
    borderRadius: 8,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#bbdefb',
  },
  hintText: {
    fontSize: 12,
    color: '#1565c0',
    textAlign: 'center',
  },
});
