import { memo, useCallback, useMemo } from 'react';
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

const keyExtractor = (item: Product) => String(item.id);

export const ProductsList = memo(function ProductsList({
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
        onLongPress={onLongPress}
        onActionPress={onActionPress}
      />
    ),
    [onPress, onLongPress, onActionPress],
  );

  const handleEndReached = useCallback(() => {
    if (!isFetchingNextPage && hasNextPage && onEndReached) {
      onEndReached();
    }
  }, [isFetchingNextPage, hasNextPage, onEndReached]);

  const isShortList = products.length <= 2;

  const contentContainerStyle = useMemo(
    () => (isShortList ? { minHeight: 360 } : undefined),
    [isShortList],
  );

  const listFooter = useMemo(() => {
    if (isFetchingNextPage) {
      return (
        <View className="py-4 items-center justify-center flex-row gap-x-2">
          <StyledText variant="medium" className="text-cinnamon-500 text-xs">
            Loading more products...
          </StyledText>
        </View>
      );
    }
    if (!hasNextPage && products.length > 0) {
      return (
        <View className="py-4 items-center justify-center">
          <StyledText variant="medium" className="text-ink-400 text-xs">
            End of products
          </StyledText>
        </View>
      );
    }
    return null;
  }, [isFetchingNextPage, hasNextPage, products.length]);

  return (
    <FlatList
      testID="product-flat-list"
      data={products}
      keyExtractor={keyExtractor}
      contentContainerClassName="pt-3 pb-32"
      contentContainerStyle={contentContainerStyle}
      renderItem={renderItem}
      initialNumToRender={10}
      maxToRenderPerBatch={10}
      windowSize={5}
      removeClippedSubviews={Platform.OS === 'android'}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.4}
      ListFooterComponent={listFooter}
    />
  );
});
