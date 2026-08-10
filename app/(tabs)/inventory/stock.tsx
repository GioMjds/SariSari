import { useCallback, useMemo } from 'react';
import { View } from 'react-native';
import { Href, useLocalSearchParams, useRouter } from 'expo-router';
import { usePaginatedProducts } from '@/hooks/useProducts';
import {
  StockList,
  StockSkeleton,
  StockFilterChips,
  StockEmptyState,
  type StockFilter,
} from '@/components/inventory/stock';
import { InventoryErrorState } from '@/components/inventory';
import { useStockSheetSignal } from '@/stores';

type SearchParams = {
  filter?: StockFilter;
  q?: string;
};

const STOCK_FILTER = [
  'all',
  'critical',
  'low',
  'out',
  'overstock',
  'near_expiry',
] as const;

export default function StockScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<SearchParams>();
  const searchTerm = (params.q ?? '').trim().toLowerCase();
  const signal = useStockSheetSignal();

  const filter: StockFilter = useMemo(() => {
    const fromParams = params.filter;
    if (fromParams && STOCK_FILTER.includes(fromParams)) {
      return fromParams;
    }
    return 'all';
  }, [params.filter]);

  const productsQuery = usePaginatedProducts(searchTerm, filter);

  const products = useMemo(
    () => productsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [productsQuery.data],
  );

  const handlePress = useCallback(
    (id: number) => router.push(`/(edit-forms)/product-details/${id}` as Href),
    [router],
  );
  const handleRestock = useCallback(
    (id: number) => signal.requestRestock(id),
    [signal],
  );

  if (productsQuery.isLoading) return <StockSkeleton />;
  if (productsQuery.error)
    return <InventoryErrorState onRetry={() => productsQuery.refetch?.()} />;

  return (
    <View className="flex-1 bg-paper-200">
      <StockFilterChips
        value={filter}
        onChange={(v) => router.setParams({ filter: v })}
      />
      {products.length === 0 ? (
        <StockEmptyState filter={filter} />
      ) : (
        <StockList
          products={products}
          onPress={handlePress}
          onRestock={handleRestock}
          isFetchingNextPage={productsQuery.isFetchingNextPage}
          hasNextPage={productsQuery.hasNextPage}
          onEndReached={() => {
            if (
              !productsQuery.isFetchingNextPage &&
              productsQuery.hasNextPage
            ) {
              productsQuery.fetchNextPage();
            }
          }}
        />
      )}
    </View>
  );
}
