import { StyledText } from '@/components/elements';
import { type AlertKind } from '@/components/inventory';
import { InventoryErrorState } from '@/components/inventory/InventoryErrorState';
import { LogTransactionForm } from '@/components/inventory/ledger';
import { BulkMoveCategoryModal } from '@/components/inventory/modals';
import {
  ProductActionMenuModal,
  ProductFilterModal,
  ProductsEmptyState,
  ProductsList,
  ProductsSkeleton,
  type ProductsFilter,
} from '@/components/inventory/products';
import { SearchBar, ViewModeToggle } from '@/components/ui';
import { usePaginatedProducts, useProducts } from '@/hooks/useProducts';
import {
  useAddCategorySheet,
  useInventorySelection,
  useToastStore,
  useViewModeStore,
  type ViewMode,
} from '@/stores';
import { type InventoryEventType } from '@/types/inventory.types';
import type { Product } from '@/types/products.types';
import { withProf } from '@/utils/perf';
import {
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
  type Href,
} from 'expo-router';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ComponentProps,
} from 'react';
import { View } from 'react-native';

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

function ProductsScreen() {
  const router = useRouter();
  const addToast = useToastStore((s) => s.addToast);
  const { bulkDeleteProductsMutation } = useProducts();

  const selection = useInventorySelection();
  const clearSelection = selection.clear;
  const selectMode = selection.selectMode;
  const selectedIdsSet = selection.selectedIds;

  const viewMode = useViewModeStore((s) => s.modes.inventory);
  const setViewMode = useViewModeStore((s) => s.setMode);
  const handleViewModeChange = useCallback(
    (mode: ViewMode) => setViewMode('inventory', mode),
    [setViewMode],
  );

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

  const {
    refetch: refetchProducts,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    isLoading,
    error,
  } = productsQuery;

  useFocusEffect(
    useCallback(() => {
      refetchProducts();
    }, [refetchProducts]),
  );

  const products = useMemo(
    () => productsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [productsQuery.data],
  );

  const selectedIds = useMemo(
    () => Array.from(selectedIdsSet),
    [selectedIdsSet],
  );

  const emptyVariant = getEmptyVariant(
    searchTerm,
    filter,
    category,
    supplier,
    alert,
  );

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

  const handleClearSearch = useCallback(() => {
    router.setParams({ q: undefined });
  }, [router]);

  const handleFilterPress = useCallback(() => {
    setFilterModalOpen(true);
  }, []);

  const handlePress = useCallback(
    (id: number) => router.push(`/(edit-forms)/product-details/${id}` as Href),
    [router],
  );

  const handleLongPress = useCallback(
    (id: number) => {
      const product = products.find((p) => p.id === id);
      if (product) setMenuProduct(product);
    },
    [products],
  );

  const handleAdd = useCallback(
    () => router.push('/(edit-forms)/add-product' as Href),
    [router],
  );

  const handleEndReached = useCallback(() => {
    fetchNextPage();
  }, [fetchNextPage]);

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
      if (!menuProduct || menuProduct.id !== id) return;
      setFormProduct(menuProduct);
      setFormType('adjustment');
      setMenuProduct(null);
    },
    [menuProduct],
  );

  const handleMenuMarkDamaged = useCallback(
    (id: number) => {
      if (!menuProduct || menuProduct.id !== id) return;
      setFormProduct(menuProduct);
      setFormType('damaged');
      setMenuProduct(null);
    },
    [menuProduct],
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
      await bulkDeleteProductsMutation.mutateAsync(id);
      addToast({
        message: 'Product deleted',
        variant: 'success',
        duration: 3000,
      });

      setMenuProduct(null);
    },
    [bulkDeleteProductsMutation, addToast],
  );

  const handleMoveModalClose = useCallback(() => {
    setMoveModalOpen(false);
    clearSelection();
  }, [clearSelection]);

  const handleLogFormDone = useCallback(() => {
    setFormProduct(null);
    setFormType(null);
    if (selectMode) clearSelection();
  }, [selectMode, clearSelection]);

  const handleFilterModalClose = useCallback(() => {
    setFilterModalOpen(false);
    router.setParams({ openFilterModal: undefined });
  }, [router]);

  const handleApplyFilters = useCallback(
    (
      newFilters: Parameters<
        NonNullable<ComponentProps<typeof ProductFilterModal>['onApplyFilters']>
      >[0],
    ) => {
      setFilter(newFilters.status);
      router.setParams({
        category: newFilters.category ?? '',
        alert: newFilters.alert ?? '',
        openFilterModal: undefined,
      });
    },
    [router],
  );

  const handleOpenAddCategory = useAddCategorySheet((s) => s.show);

  const handleClearFilters = useCallback(() => {
    setFilter('all');
    router.setParams({ category: '', supplier: '', alert: '' });
  }, [router]);

  if (isLoading) return <ProductsSkeleton />;
  if (error) return <InventoryErrorState onRetry={refetchProducts} />;

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

      <View className="flex-row items-center">
        <View className="flex-1">
          <StyledText
            variant="semibold"
            className="text-ink-700 text-sm px-4 pb-1"
          >
            Products
          </StyledText>
        </View>
        <View className="pl-1 pr-4">
          <ViewModeToggle mode={viewMode} onChange={handleViewModeChange} />
        </View>
      </View>

      {products.length === 0 ? (
        <ProductsEmptyState
          variant={emptyVariant}
          searchTerm={searchTerm}
          onAddPress={handleAdd}
          onClearSearch={handleClearSearch}
          onClearFilters={handleClearFilters}
        />
      ) : (
        <ProductsList
          products={products}
          onPress={handlePress}
          onLongPress={handleLongPress}
          onActionPress={handleActionPress}
          isFetchingNextPage={isFetchingNextPage}
          hasNextPage={hasNextPage}
          isFetchNextPageError={isFetchNextPageError}
          onEndReached={handleEndReached}
          viewMode={viewMode}
        />
      )}

      <BulkMoveCategoryModal
        visible={moveModalOpen}
        productIds={selectedIds}
        onClose={handleMoveModalClose}
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
        onClose={handleLogFormDone}
        onSuccess={handleLogFormDone}
      />

      <ProductFilterModal
        visible={filterModalOpen}
        onClose={handleFilterModalClose}
        currentFilters={{
          status: filter,
          alert,
          category,
        }}
        onApplyFilters={handleApplyFilters}
        onOpenAddCategory={handleOpenAddCategory}
      />
    </View>
  );
}

export default withProf(ProductsScreen, 'inventory/products');
