import React, { useCallback } from 'react';
import { ActivityIndicator, FlatList, ListRenderItemInfo, View } from 'react-native';
import { MotiView } from 'moti';
import { StyledText } from '@/components/elements';
import { ProductRow } from './ProductRow';
import type { Product } from '@/types/products.types';

export interface ProductsListProps {
  products: Product[];
  onPress: (id: number) => void;
  onLongPress?: (id: number) => void;
  onActionPress?: (product: Product) => void;
  isFetchingNextPage?: boolean;
  hasNextPage?: boolean;
  onEndReached?: () => void;
}

export function ProductsList({
  products,
  onPress,
  onLongPress,
  onActionPress,
  isFetchingNextPage,
  hasNextPage,
  onEndReached,
}: ProductsListProps) {
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
      onEndReached={() => {
        if (!isFetchingNextPage && hasNextPage && onEndReached) {
          onEndReached();
        }
      }}
      onEndReachedThreshold={0.4}
      ListFooterComponent={
        isFetchingNextPage ? (
          <View className="py-4 items-center justify-center">
            <ActivityIndicator size="small" color="#623418" />
            <StyledText variant="medium" className="text-ink-500 text-xs mt-2">
              Loading more...
            </StyledText>
          </View>
        ) : !hasNextPage && products.length > 0 ? (
          <View className="py-4 items-center justify-center">
            <StyledText variant="medium" className="text-ink-500 text-xs">
              End of list
            </StyledText>
          </View>
        ) : null
      }
    />
  );
}

