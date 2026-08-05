import React, { useCallback, useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { View } from 'react-native';
import { useProducts } from '@/hooks/useProducts';
import {
  ProductsList,
  ProductsSkeleton,
  ProductsFilterChips,
  ProductsEmptyState,
  ProductActionMenuModal,
  type ProductsFilter,
} from '@/components/inventory/products';
import { BulkMoveCategoryModal } from '@/components/inventory/modals';
import { InventoryErrorState } from '@/components/inventory/InventoryErrorState';
import {
  useInventorySelection,
  useToastStore,
} from '@/stores';
import { BulkActionsToolbar } from '@/components/inventory';
import type { Product } from '@/types/products.types';
import type { InventoryEventType } from '@/types/inventory.types';
import { LogTransactionForm } from '@/components/inventory/ledger';

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
  const { getAllProductsQuery, bulkDeleteProductsMutation } = useProducts();
  const addToast = useToastStore((s) => s.addToast);
  const [filter, setFilter] = useState<ProductsFilter>('all');
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [menuProduct, setMenuProduct] = useState<Product | null>(null);

  const [formProduct, setFormProduct] = useState<Product | null>(null);
  const [formType, setFormType] = useState<InventoryEventType | null>(null);

  const params = useLocalSearchParams<{ q?: string }>();
  const searchTerm = (params.q ?? '').trim().toLowerCase();

  const items = useMemo(
    () => getAllProductsQuery.data ?? [],
    [getAllProductsQuery.data],
  );

  const filtered = useMemo(() => {
    return items.filter((p) => {
      if (filter === 'in_stock') return p.quantity > 0;
      if (filter === 'low') return p.quantity > 0 && p.quantity <= 5;
      if (filter === 'out') return p.quantity === 0;
      if (filter === 'new')
        return Date.now() - new Date(p.created_at).getTime() < 7 * 86400_000;

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

  const handleBulkDelete = useCallback(async () => {
    if (selectedIds.length === 0) return;
    try {
      await Promise.all(
        selectedIds.map((id) => bulkDeleteProductsMutation.mutateAsync(id)),
      );
      addToast({
        message: `Deleted ${selectedIds.length} ${
          selectedIds.length === 1 ? 'product' : 'products'
        }`,
        variant: 'success',
        duration: 4000,
      });
      selection.clear();
    } catch {
    }
  }, [selectedIds, bulkDeleteProductsMutation, selection, addToast]);

  const handleActionPress = useCallback((product: Product) => {
    setMenuProduct(product);
  }, []);

  const handleMenuClose = useCallback(() => {
    setMenuProduct(null);
  }, []);

  const handleMenuEdit = useCallback(
    (id: number) => {
      setMenuProduct(null);
      router.push(`/(edit-forms)/edit-product/${id}`);
    },
    [router],
  );

  const handleMenuAdjustStock = useCallback(
    (id: number) => {
      const p = items.find((x) => x.id === id) ?? null;
      setMenuProduct(null);
      setFormProduct(p);
      setFormType('adjustment');
    },
    [items],
  );

  const handleMenuMarkDamaged = useCallback(
    (id: number) => {
      const p = items.find((x) => x.id === id) ?? null;
      setMenuProduct(null);
      setFormProduct(p);
      setFormType('damaged');
    },
    [items],
  );

  const handleMenuViewLedger = useCallback(
    (id: number) => {
      setMenuProduct(null);
      router.push(`/(edit-forms)/inventory-ledger/${id}` as Href);
    },
    [router],
  );

  const handleMenuDelete = useCallback(
    async (id: number) => {
      try {
        await bulkDeleteProductsMutation.mutateAsync(id);
        addToast({
          message: 'Product deleted',
          variant: 'success',
          duration: 3000,
        });
      } catch {
        // Mutation onError already posts a toast; keep the row closed.
      }
      setMenuProduct(null);
    },
    [bulkDeleteProductsMutation, addToast],
  );

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
          onActionPress={handleActionPress}
        />
      )}
      {selection.selectMode ? (
        <BulkActionsToolbar
          selectedCount={selectedIds.length}
          onClearSelection={selection.clear}
          onBulkDelete={handleBulkDelete}
          onBulkAdjustStock={() => {
            setFormProduct(null);
            setFormType('adjustment');
          }}
          onBulkMoveCategory={() => setMoveModalOpen(true)}
        />
      ) : null}

      <BulkMoveCategoryModal
        visible={moveModalOpen}
        productIds={selectedIds}
        onClose={() => {
          setMoveModalOpen(false);
          selection.clear();
        }}
      />

      <ProductActionMenuModal
        visible={Boolean(menuProduct)}
        product={menuProduct}
        onClose={handleMenuClose}
        onEdit={handleMenuEdit}
        onAdjustStock={handleMenuAdjustStock}
        onMarkDamaged={handleMenuMarkDamaged}
        onViewLedger={handleMenuViewLedger}
        onDelete={handleMenuDelete}
      />

      <LogTransactionForm
        product={formProduct}
        initialType={formType ?? 'restock'}
        visible={formType !== null}
        onClose={() => {
          setFormProduct(null);
          setFormType(null);
        }}
      />
    </View>
  );
}
