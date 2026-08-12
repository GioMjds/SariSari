import { memo, useCallback } from 'react';
import { FlatList, ListRenderItemInfo, Platform, View } from 'react-native';
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
    ({ item }: ListRenderItemInfo<Product>) => (
      <ProductRow
        product={item}
        onPress={onPress}
        {...(onLongPress ? { onLongPress } : {})}
        {...(onActionPress ? { onActionPress } : {})}
      />
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
      removeClippedSubviews={Platform.OS === 'android'}
      onEndReached={() => {
        if (!isFetchingNextPage && hasNextPage && onEndReached) {
          onEndReached();
        }
      }}
      onEndReachedThreshold={0.4}
      ListFooterComponent={
        isFetchingNextPage ? (
          <View className="py-4 items-center justify-center flex-row gap-x-2">
            <StyledText variant="medium" className="text-cinnamon-500 text-xs">
              Loading more products...
            </StyledText>
          </View>
        ) : !hasNextPage && products.length > 0 ? (
          <View className="py-4 items-center justify-center">
            <StyledText variant="medium" className="text-ink-400 text-xs">
              End of products
            </StyledText>
          </View>
        ) : null
      }
    />
  );
}

memo(ProductsList);
