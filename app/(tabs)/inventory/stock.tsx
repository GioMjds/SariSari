import React, { useCallback, useMemo } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useProducts } from '@/hooks/useProducts';
import {
  StockList,
  StockSkeleton,
  StockFilterChips,
  StockEmptyState,
  type StockFilter,
} from '@/components/inventory/stock';
import { InventoryErrorState } from '@/components/inventory';
import { useRestockSignal } from '@/stores/useInventorySelection';

export default function StockScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ filter?: StockFilter; q?: string }>();
  const searchTerm = (params.q ?? '').trim().toLowerCase();
  const { getAllProductsQuery } = useProducts();
  const restock = useRestockSignal();

  const filter: StockFilter = useMemo(() => {
    const fromParams = params.filter;
    if (
      fromParams &&
      ['all', 'critical', 'low', 'out', 'overstock', 'near_expiry'].includes(
        fromParams,
      )
    ) {
      return fromParams;
    }
    return 'all';
  }, [params.filter]);

  const items = useMemo(
    () => getAllProductsQuery.data ?? [],
    [getAllProductsQuery.data],
  );

  const filtered = useMemo(() => {
    return items.filter((p: any) => {
      switch (filter) {
        case 'critical':
          if (!(p.quantity > 0 && p.quantity <= 3)) return false;
          break;
        case 'low':
          if (!(p.quantity > 0 && p.quantity <= 5)) return false;
          break;
        case 'out':
          if (p.quantity !== 0) return false;
          break;
        case 'overstock':
          if (p.quantity < 100) return false;
          break;
        case 'near_expiry':
          if (!p.expiry_date) return false;
          const days = (p.expiry_date - Date.now()) / 86400_000;
          if (!(days >= 0 && days <= 7)) return false;
          break;
        default:
          break;
      }
      if (searchTerm) {
        const haystack = [p.name, p.sku, p.barcode, p.category]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(searchTerm)) return false;
      }
      return true;
    });
  }, [items, filter, searchTerm]);

  const handlePress = useCallback(
    (id: number) => router.push(`/(edit-forms)/product-details/${id}`),
    [router],
  );
  const handleRestock = useCallback(
    (id: number) => restock.requestRestock(id),
    [restock],
  );

  if (getAllProductsQuery.isLoading) return <StockSkeleton />;
  if (getAllProductsQuery.error)
    return (
      <InventoryErrorState onRetry={() => getAllProductsQuery.refetch?.()} />
    );

  return (
    <View className="flex-1 bg-paper-200">
      <StockFilterChips
        value={filter}
        onChange={(v) => router.setParams({ filter: v })}
      />
      {filtered.length === 0 ? (
        <StockEmptyState filter={filter} />
      ) : (
        <StockList
          products={filtered}
          onPress={handlePress}
          onRestock={handleRestock}
        />
      )}
    </View>
  );
}
