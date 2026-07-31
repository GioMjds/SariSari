import React from 'react';
import { FlatList } from 'react-native';
import { MotiView } from 'moti';
import { ProductRow } from './ProductRow';

interface Props {
  products: any[];
  onPress: (id: number) => void;
  onLongPress?: (id: number) => void;
}

export function ProductsList({ products, onPress, onLongPress }: Props) {
  return (
    <FlatList
      data={products}
      keyExtractor={(item) => String(item.id)}
      contentContainerClassName="pt-3 pb-32"
      renderItem={({ item, index }) => (
        <MotiView
          from={{ opacity: 0, translateY: 6 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{
            type: 'timing',
            duration: 180,
            delay: Math.min(index, 8) * 30,
          }}
        >
          <ProductRow
            product={item}
            onPress={onPress}
            onLongPress={onLongPress}
          />
        </MotiView>
      )}
    />
  );
}
