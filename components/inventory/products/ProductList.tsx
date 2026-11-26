import { memo, useCallback, useMemo } from 'react';
import { FlatList, ListRenderItemInfo, Platform, View } from 'react-native';
import { StyledText } from '@/components/elements';
import { useFabClearance } from '@/components/inventory/InventorySpeedDialFab';
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
  onEndReached?: () => void;
  viewMode?: ViewMode;
}

const keyExtractor = (item: Product) => String(item.id);

// Matches the 16px gutter both row and grid layouts use.
const FOOTER_STYLE = { width: '100%', paddingHorizontal: 16 } as const;

export const ProductsList = memo(function ProductsList({
  products,
  onPress,
  onLongPress,
  onActionPress,
  isFetchingNextPage,
  hasNextPage,
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

  // Footer spans the full row and sits below the grid gutter so a lone last tile does not crowd it.
  const listFooter = useMemo(() => {
    if (isFetchingNextPage) {
      return (
        <View className="mt-1 h-12 items-center justify-center flex-row gap-x-2 border-t border-ink-100">
          <StyledText variant="medium" className="text-cinnamon-500 text-xs">
            Loading more products...
          </StyledText>
        </View>
      );
    }
    if (!hasNextPage && products.length > 0) {
      return (
        <View className="mt-1 h-12 items-center justify-center border-t border-ink-100">
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
      // Clipping detaches multi-column rows near the end and re-fires onEndReached.
      removeClippedSubviews={Platform.OS === 'android' && !isGrid}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.4}
      ListFooterComponent={listFooter}
      ListFooterComponentStyle={FOOTER_STYLE}
    />
  );
});
