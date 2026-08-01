import React, { useCallback, useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';
import { useProducts } from '@/hooks/useProducts';
import {
  ProductsList,
  ProductsSkeleton,
  ProductsFilterChips,
  ProductsEmptyState,
  type ProductsFilter,
} from '@/components/inventory/products';
import { BulkMoveCategoryModal } from '@/components/inventory/modals';
import { InventoryErrorState } from '@/components/inventory/InventoryErrorState';
import { useInventorySelection } from '@/stores/useInventorySelection';
import { BulkActionsToolbar } from '@/components/inventory';
import { useInventoryModalSignal } from '@/stores';

type EmptyVariant = 'no-products' | 'no-search' | 'no-filter';

function getEmptyVariant(
  searchTerm: string,
  filter: ProductsFilter,
): EmptyVariant {
  if (searchTerm) return 'no-search';
  if (filter !== 'all') return 'no-filter';
  return 'no-products';
}

export default function ProductsScreen() {
  const router = useRouter();
  const selection = useInventorySelection();
  const { getAllProductsQuery, deleteProductMutation } = useProducts();
  const [filter, setFilter] = useState<ProductsFilter>('all');
  const [moveModalOpen, setMoveModalOpen] = useState(false);

  const params = useLocalSearchParams<{ q?: string }>();
  const searchTerm = (params.q ?? '').trim().toLowerCase();
  const signal = useInventoryModalSignal();

  const items = useMemo(
    () => getAllProductsQuery.data ?? [],
    [getAllProductsQuery.data],
  );

  const filtered = useMemo(() => {
    return items.filter((p: any) => {
      if (filter === 'in_stock') return p.quantity > 0;
      if (filter === 'low') return p.quantity > 0 && p.quantity <= 5;
      if (filter === 'out') return p.quantity === 0;
      if (filter === 'new') return Date.now() - p.created_at < 7 * 86400_000;

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

  const selectedIds = useMemo(
    () => Array.from(selection.selectedIds),
    [selection.selectedIds],
  );

  const emptyVariant = getEmptyVariant(searchTerm, filter);

  const handlePress = useCallback(
    (id: number) => router.push(`/(edit-forms)/product-details/${id}`),
    [router],
  );
  const handleLongPress = useCallback(
    (id: number) => selection.enterSelectMode(id),
    [selection],
  );
  const handleAdd = useCallback(
    () => router.push('/(edit-forms)/add-product'),
    [router],
  );

  const handleClearSearch = useCallback(() => {
    router.setParams({ q: undefined });
  }, [router]);

  const handleBulkDelete = useCallback(() => {
    if (selectedIds.length === 0) return;
    Promise.all(
      selectedIds.map((id) => deleteProductMutation.mutateAsync(id)),
    ).then(() => selection.clear());
  }, [selectedIds, deleteProductMutation, selection]);

  if (getAllProductsQuery.isLoading) return <ProductsSkeleton />;
  if (getAllProductsQuery.error) {
    return (
      <InventoryErrorState onRetry={() => getAllProductsQuery.refetch?.()} />
    );
  }

  return (
    <View className="flex-1 bg-paper-200">
      <ProductsFilterChips value={filter} onChange={setFilter} />
      {filtered.length === 0 ? (
        <ProductsEmptyState
          variant={emptyVariant}
          searchTerm={searchTerm}
          onAddPress={handleAdd}
          onClearSearch={handleClearSearch}
          onClearFilters={() => setFilter('all')}
        />
      ) : (
        <ProductsList
          products={filtered}
          onPress={handlePress}
          onLongPress={handleLongPress}
        />
      )}
      {selection.selectMode ? (
        <BulkActionsToolbar
          selectedCount={selectedIds.length}
          onClearSelection={selection.clear}
          onBulkDelete={handleBulkDelete}
          onBulkAdjustStock={() => signal.requestAdjust()}
          onBulkMoveCategory={() => setMoveModalOpen(true)}
        />
      ) : null}
      
      <BulkMoveCategoryModal 
        visible={moveModalOpen}
        productIds={selectedIds}
        onClose={() => {
          setMoveModalOpen(false)
          selection.clear();
        }}
      />
    </View>
  );
}
