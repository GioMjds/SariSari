import React, { useCallback } from 'react';
import { FlatList, ListRenderItemInfo } from 'react-native';
import { MotiView } from 'moti';
import { ProductRow } from './ProductRow';
import type { Product } from '@/types/products.types';

interface Props {
  products: Product[];
  onPress: (id: number) => void;
  onLongPress?: (id: number) => void;
  onActionPress?: (product: Product) => void;
}

export function ProductsList({
  products,
  onPress,
  onLongPress,
  onActionPress,
}: Props) {
  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<Product>) => (
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
          {...(onLongPress ? { onLongPress } : {})}
          {...(onActionPress ? { onActionPress } : {})}
        />
      </MotiView>
    ),
    [onPress, onLongPress, onActionPress],
  );

  return (
    <FlatList
      testID="product-flat-list"
      data={products}
      keyExtractor={(item) => String(item.id)}
      contentContainerClassName="pt-3 pb-32"
      contentContainerStyle={
        products.length <= 2 ? { minHeight: 360 } : undefined
      }
      renderItem={renderItem}
      initialNumToRender={10}
      maxToRenderPerBatch={10}
      windowSize={5}
    />
  );
}
