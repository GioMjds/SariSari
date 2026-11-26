import { memo, useCallback, useMemo } from 'react';
import { FlatList, ListRenderItemInfo, Platform } from 'react-native';
import { useFabClearance } from '@/components/inventory/InventorySpeedDialFab';
import { ListFooterStatus } from '@/components/ui/ListFooterStatus';
import { GRID_COLUMN_STYLE } from '@/components/ui/ViewModeToggle';
import type { ViewMode } from '@/stores/useViewModeStore';
import { ProductRow } from './ProductRow';
import { ProductTile } from './ProductTile';
import type { Product } from '@/types/products.types';

export interface ProductsListProps {
  products: Product[];
  onPress: (id: number) => void;
  onLongPress: (id: number) => void;
  onActionPress: (product: Product) => void;
  isFetchingNextPage?: boolean;
  hasNextPage?: boolean;
  isFetchNextPageError?: boolean;
  onEndReached?: () => void;
  viewMode?: ViewMode;
}

const keyExtractor = (item: Product) => String(item.id);

export const ProductsList = memo(function ProductsList({
  products,
  onPress,
  onLongPress,
  onActionPress,
  isFetchingNextPage,
  hasNextPage,
  isFetchNextPageError,
  onEndReached,
  viewMode = 'list',
}: ProductsListProps) {
  const isGrid = viewMode === 'grid';
  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Product>) => {
      const Item = isGrid ? ProductTile : ProductRow;
      return (
        <Item
          product={item}
          onPress={onPress}
          onLongPress={onLongPress}
          onActionPress={onActionPress}
        />
      );
    },
    [isGrid, onPress, onLongPress, onActionPress],
  );

  const handleEndReached = useCallback(() => {
    if (!isFetchingNextPage && hasNextPage && onEndReached) {
      onEndReached();
    }
  }, [isFetchingNextPage, hasNextPage, onEndReached]);

  const isShortList = products.length <= 2;
  const fabClearance = useFabClearance();

  const contentContainerStyle = useMemo(
    () => ({
      paddingBottom: fabClearance,
      ...(isShortList ? { minHeight: 360 } : {}),
    }),
    [isShortList, fabClearance],
  );

  const listFooter = (
    <ListFooterStatus
      itemCount={products.length}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      isFetchNextPageError={isFetchNextPageError}
      onRetry={onEndReached}
      endLabel="End of products"
    />
  );

  return (
    <FlatList
      // numColumns cannot change on a mounted FlatList, so remount per mode.
      key={viewMode}
      testID="product-flat-list"
      data={products}
      numColumns={isGrid ? 2 : 1}
      {...(isGrid ? { columnWrapperStyle: GRID_COLUMN_STYLE } : {})}
      keyExtractor={keyExtractor}
      contentContainerClassName="pt-3"
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
