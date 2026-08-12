import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { View } from 'react-native';
import { useProducts, usePaginatedProducts } from '@/hooks/useProducts';
import {
  ProductsList,
  ProductsSkeleton,
  ProductsEmptyState,
  ProductActionMenuModal,
  ProductFilterModal,
  type ProductsFilter,
} from '@/components/inventory/products';
import { BulkMoveCategoryModal } from '@/components/inventory/modals';
import { InventoryErrorState } from '@/components/inventory/InventoryErrorState';
import { useInventorySelection, useToastStore } from '@/stores';
import { BulkActionsToolbar, type AlertKind } from '@/components/inventory';
import { SearchBar } from '@/components/ui';
import type { Product } from '@/types/products.types';
import { getStatus, type InventoryEventType } from '@/types/inventory.types';
import { MAX_STOCK_THRESHOLD } from '@/constants/stocks';
import { LogTransactionForm } from '@/components/inventory/ledger';

type EmptyVariant = 'no-products' | 'no-search' | 'no-filter';

type SearchParams = {
  q?: string;
  category?: string;
  supplier?: string;
  filter?: ProductsFilter;
  alert?: AlertKind;
  openFilterModal?: string;
};

function getEmptyVariant(
  searchTerm: string,
  filter: ProductsFilter,
  category?: string,
  supplier?: string,
  alert?: string,
): EmptyVariant {
  if (searchTerm) return 'no-search';
  if (filter !== 'all' || category || supplier || alert) return 'no-filter';
  return 'no-products';
}

export default function ProductsScreen() {
  const router = useRouter();
  const selection = useInventorySelection();
  const { bulkDeleteProductsMutation } = useProducts();
  const addToast = useToastStore((s) => s.addToast);
  const [filter, setFilter] = useState<ProductsFilter>('all');
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [menuProduct, setMenuProduct] = useState<Product | null>(null);

  const [formProduct, setFormProduct] = useState<Product | null>(null);
  const [formType, setFormType] = useState<InventoryEventType | null>(null);

  const {
    q,
    category,
    supplier,
    filter: paramFilter,
    alert,
    openFilterModal,
  } = useLocalSearchParams<SearchParams>();

  useEffect(() => {
    if (openFilterModal === 'true') {
      setFilterModalOpen(true);
    }
  }, [openFilterModal]);

  useEffect(() => {
    if (paramFilter) {
      setFilter(paramFilter);
    }
  }, [paramFilter]);

  const searchTerm = (q ?? '').trim().toLowerCase();

  const filterOptions = useMemo(() => {
    const opts: { category?: string; supplier?: string; alert?: string } = {};
    if (category) opts.category = category;
    if (supplier) opts.supplier = supplier;
    if (alert) opts.alert = alert;
    return opts;
  }, [category, supplier, alert]);

  const productsQuery = usePaginatedProducts(searchTerm, filter, filterOptions);

  const products = useMemo(
    () => productsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [productsQuery.data],
  );

  const selectedIds = useMemo(
    () => Array.from(selection.selectedIds),
    [selection.selectedIds],
  );

  const emptyVariant = getEmptyVariant(
    searchTerm,
    filter,
    category,
    supplier,
    alert,
  );

  // Search and filter live on this screen, not the inventory layout —
  // they only apply to products.
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filter !== 'all') count++;
    if (category) count++;
    if (alert) count++;
    if (supplier) count++;
    return count;
  }, [filter, category, alert, supplier]);

  const handleSearchChange = useCallback(
    (next: string) => {
      router.setParams({ q: next });
    },
    [router],
  );

  const handleFilterPress = useCallback(() => {
    setFilterModalOpen(true);
  }, []);

  const handlePress = useCallback(
    (id: number) => router.push(`/(edit-forms)/product-details/${id}` as Href),
    [router],
  );
  const handleLongPress = useCallback(
    (id: number) => selection.enterSelectMode(id),
    [selection],
  );
  const handleAdd = useCallback(
    () => router.push('/(edit-forms)/add-product' as Href),
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
    } catch {
      // Mutations handle individual error toasts
    } finally {
      selection.clear();
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
      router.push(`/(edit-forms)/edit-product/${id}` as Href);
    },
    [router],
  );

  const handleMenuAdjustStock = useCallback(
    (id: number) => {
      const p = products.find((x) => x.id === id) ?? null;
      setMenuProduct(null);
      setFormProduct(p);
      setFormType('adjustment');
    },
    [products],
  );

  const handleMenuMarkDamaged = useCallback(
    (id: number) => {
      const p = products.find((x) => x.id === id) ?? null;
      setMenuProduct(null);
      setFormProduct(p);
      setFormType('damaged');
    },
    [products],
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

  if (productsQuery.isLoading) return <ProductsSkeleton />;
  if (productsQuery.error) {
    return <InventoryErrorState onRetry={() => productsQuery.refetch?.()} />;
  }

  return (
    <View className="flex-1 bg-paper-200">
      <View className="px-4 pb-2">
        <SearchBar
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Search products..."
          onFilterPress={handleFilterPress}
          activeFilterCount={activeFilterCount}
        />
      </View>
      {products.length === 0 ? (
        <ProductsEmptyState
          variant={emptyVariant}
          searchTerm={searchTerm}
          onAddPress={handleAdd}
          onClearSearch={handleClearSearch}
          onClearFilters={() => {
            setFilter('all');
            router.setParams({ category: '', supplier: '', alert: '' });
          }}
        />
      ) : (
        <ProductsList
          products={products}
          onPress={handlePress}
          onLongPress={handleLongPress}
          onActionPress={handleActionPress}
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
          if (selection.selectMode) selection.clear();
        }}
        onSuccess={() => {
          setFormProduct(null);
          setFormType(null);
          if (selection.selectMode) selection.clear();
        }}
      />

      <ProductFilterModal
        visible={filterModalOpen}
        onClose={() => {
          setFilterModalOpen(false);
          router.setParams({ openFilterModal: undefined });
        }}
        currentFilters={{
          status: filter,
          alert,
          category,
        }}
        onApplyFilters={(newFilters) => {
          setFilter(newFilters.status);
          router.setParams({
            category: newFilters.category ?? '',
            alert: newFilters.alert ?? '',
            openFilterModal: undefined,
          });
        }}
        onOpenAddCategory={() =>
          router.push('/(edit-forms)/add-category' as Href)
        }
      />
    </View>
  );
}
