import { FC } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FastLaneProduct } from '@/database/products';
import { useToggleFavorite } from '@/hooks/useProducts';
import { StyledText } from '@/components/elements';

interface FastLaneCardProps {
  product: FastLaneProduct;
  onAddToCart: (product: FastLaneProduct, quantity: number) => void;
}

export const FastLaneCard: FC<FastLaneCardProps> = ({
  product,
  onAddToCart,
}) => {
  const toggleFavorite = useToggleFavorite();

  const handleToggleFav = () => {
    toggleFavorite.mutate({
      productId: product.id,
      isFavorite: !product.is_favorite,
    });
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <StyledText variant="extrabold" style={styles.name} numberOfLines={1}>
          {product.name}
        </StyledText>
        <TouchableOpacity
          onPress={handleToggleFav}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialCommunityIcons
            name={product.is_favorite ? 'star' : 'star-outline'}
            size={18}
            color={product.is_favorite ? '#fbc02d' : '#9e9e9e'}
          />
        </TouchableOpacity>
      </View>

      <StyledText variant="extrabold" style={styles.price}>
        ₱{Math.round(product.price)}
      </StyledText>

      <View style={styles.chipsRow}>
        {[1, 2, 5, 12].map((qty) => (
          <TouchableOpacity
            key={qty}
            style={styles.chip}
            onPress={() => onAddToCart(product, qty)}
          >
            <StyledText variant="extrabold" style={styles.chipText}>
              +{qty}
            </StyledText>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 140,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 10,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#212121',
    flex: 1,
    marginRight: 4,
  },
  price: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2e7d32',
    marginBottom: 8,
  },
  chipsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chip: {
    backgroundColor: '#e8f5e9',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#c8e6c9',
  },
  chipText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
});
