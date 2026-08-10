import React, { useCallback } from 'react';
import { FlatList, ListRenderItemInfo, View } from 'react-native';
import { StyledText } from '@/components/elements';
import { StockRow } from './StockRow';
import type { Product } from '@/types/products.types';

export interface StockListProps {
  products: Product[];
  onPress: (id: number) => void;
  onLongPress?: (id: number) => void;
  onRestock?: (id: number) => void;
  isFetchingNextPage?: boolean;
  hasNextPage?: boolean;
  onEndReached?: () => void;
}

export function StockList({
  products,
  onPress,
  onLongPress,
  onRestock,
  isFetchingNextPage,
  hasNextPage,
  onEndReached,
}: StockListProps) {
  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Product>) => (
      <StockRow
        product={item}
        onPress={onPress}
        {...(onLongPress ? { onLongPress } : {})}
        {...(onRestock ? { onRestock } : {})}
      />
    ),
    [onPress, onLongPress, onRestock],
  );

  const getItemLayout = useCallback(
    (_data: readonly Product[] | null | undefined, index: number) => ({
      length: 72,
      offset: 72 * index,
      index,
    }),
    [],
  );

  return (
    <FlatList
      testID="stock-flat-list"
      data={products}
      keyExtractor={(item) => String(item.id)}
      contentContainerClassName="pt-3 pb-32"
      contentContainerStyle={
        products.length <= 2 ? { minHeight: 360 } : undefined
      }
      renderItem={renderItem}
      getItemLayout={getItemLayout}
      initialNumToRender={10}
      maxToRenderPerBatch={10}
      windowSize={5}
      removeClippedSubviews={true}
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
              Loading more stock items...
            </StyledText>
          </View>
        ) : !hasNextPage && products.length > 0 ? (
          <View className="py-4 items-center justify-center">
            <StyledText variant="medium" className="text-ink-400 text-xs">
              End of stock items
            </StyledText>
          </View>
        ) : null
      }
    />
  );
}
