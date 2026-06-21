import { StyledText } from '@/components/elements';
import { Modal as CustomModal, Pagination, SearchBar } from '@/components/ui';
import { useProducts, useInventory } from '@/hooks';
import { useDialogStore, useToastStore } from '@/stores';
import { Product } from '@/types';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, FlatList, RefreshControl, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LOW_STOCK_THRESHOLD, ITEMS_PER_PAGE } from '@/constants';
import { InventoryHeader, InventoryHero, FilterChips, InventoryRow, InventorySkeleton, InventoryEmptyState, InventoryActionModal, GuideModal } from '@/components/inventory';

interface PendingAction {
  product: Product;
  type: 'restock';
}

export default function InventoryScreen() {
  const [search, setSearch] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [showLowOnly, setShowLowOnly] = useState<boolean>(false);
  const [showFilter, setShowFilter] = useState<boolean>(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(
    null,
  );
  const [quantityInput, setQuantityInput] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [showGuide, setShowGuide] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const router = useRouter();
  const addToast = useToastStore((state) => state.addToast);
  const { visible: dialogVisible, showDialog, hideDialog } = useDialogStore();
  const debounceRef = useRef<number | null>(null);

  const { getAllProductsQuery } = useProducts();
  const { insertInventoryMutation } = useInventory();

  // Debounce search input
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);
  }, [search]);

  // Reset to first page when search or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, showLowOnly]);

  // Query products
  const { data: products, isLoading, refetch } = getAllProductsQuery();

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  useFocusEffect(
    useCallback(() => {
      const backAction = () => {
        showDialog({
          title: 'Exit App',
          message: 'Are you sure you want to exit the app?',
          showCloseButton: false,
        });
        return true;
      };

      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        backAction,
      );

      return () => backHandler.remove();
    }, [showDialog]),
  );

  const handleExitApp = () => {
    hideDialog();
    BackHandler.exitApp();
  };

  const handleCancelExit = () => {
    hideDialog();
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  // Mutation for inventory transaction
  const transactionMutation = insertInventoryMutation();

  const filtered = useMemo(() => {
    if (!products) return [];
    let list = products;
    if (debouncedSearch) {
      const term = debouncedSearch.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.sku.toLowerCase().includes(term),
      );
    }
    if (showLowOnly)
      list = list.filter((p) => p.quantity < LOW_STOCK_THRESHOLD);
    return list;
  }, [products, debouncedSearch, showLowOnly]);

  // Paginated products
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filtered.slice(startIndex, endIndex);
  }, [filtered, currentPage]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

  const openAction = useCallback((product: Product) => {
    setPendingAction({ product, type: 'restock' });
    setQuantityInput('');
  }, []);

  const closeAction = useCallback(() => {
    setPendingAction(null);
    setQuantityInput('');
  }, []);

  const submitAction = useCallback(() => {
    if (!pendingAction) return;
    const qty = parseInt(quantityInput, 10);
    if (isNaN(qty) || qty <= 0) {
      addToast({
        message: 'Please enter a valid quantity',
        variant: 'error',
        duration: 1800,
        position: 'top-center',
      });
      return;
    }

    transactionMutation.mutate({
      product_id: pendingAction.product.id,
      type: 'restock',
      quantity: qty,
    });

    closeAction();
  }, [
    pendingAction,
    quantityInput,
    transactionMutation,
    closeAction,
    addToast,
  ]);

  // Summary stats
  const summary = useMemo(() => {
    if (!products) {
      return {
        totalProducts: 0,
        totalItems: 0,
        lowStockCount: 0,
        outOfStockCount: 0,
        totalValueCentavos: 0,
      };
    }
    const lowStockCount = products.filter(
      (p) => p.quantity < LOW_STOCK_THRESHOLD,
    ).length;
    const outOfStockCount = products.filter((p) => p.quantity === 0).length;
    const totalItems = products.reduce((acc, p) => acc + p.quantity, 0);
    const totalValueCentavos = products.reduce(
      (acc, p) => acc + p.price * p.quantity,
      0,
    );

    return {
      totalProducts: products.length,
      totalItems,
      lowStockCount,
      outOfStockCount,
      totalValueCentavos,
    };
  }, [products]);

  const subtitle = useMemo(() => {
    if (!products || products.length === 0) return 'Track your stock';
    return `${products.length} ${products.length === 1 ? 'product' : 'products'} • ${summary.lowStockCount} low stock`;
  }, [products, summary.lowStockCount]);

  const handleOpenGuide = useCallback(() => {
    setShowGuide(true);
  }, []);

  const handleOpenFilter = useCallback(() => {
    setShowFilter((prev) => !prev);
  }, []);

  const handleAddProduct = useCallback(() => {
    router.push('/(edit-forms)/add-product' as any);
  }, [router]);

  const handleFilterChange = useCallback(
    (nextFilters: { lowStock: boolean; outOfStock: boolean }) => {
      setShowLowOnly(nextFilters.lowStock);
    },
    [],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: Product; index: number }) => (
      <InventoryRow item={item} index={index} onRestock={openAction} />
    ),
    [openAction],
  );

  return (
    <SafeAreaView className="flex-1 bg-paper-200">
      {/* Sticky cinnamon header band */}
      <InventoryHeader
        subtitle={subtitle}
        onOpenGuide={handleOpenGuide}
        onOpenFilter={handleOpenFilter}
        onAddProduct={handleAddProduct}
        activeFilterCount={showLowOnly ? 1 : 0}
      />

      {/* SearchBar wrapper in cinnamon */}
      <View className="bg-cinnamon-500 px-5 pb-5">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search products or SKU..."
        />
      </View>

      {/* Main product list */}
      <FlatList
        data={isLoading ? [] : paginatedProducts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={{
          paddingBottom: 100,
          paddingTop: 8,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#E85A1F"
            colors={['#E85A1F']}
          />
        }
        ListHeaderComponent={
          <>
            {products && products.length > 0 && (
              <InventoryHero stats={summary} />
            )}

            {showFilter && (
              <FilterChips
                filters={{ lowStock: showLowOnly, outOfStock: false }}
                onChange={handleFilterChange}
                onOpenMore={() => {}}
              />
            )}

            {products && products.length > 0 && (
              <View className="px-4 pb-2 flex-row justify-between items-center">
                <StyledText
                  variant="semibold"
                  className="text-label text-ink-400"
                >
                  {filtered.length}{' '}
                  {filtered.length === 1 ? 'PRODUCT' : 'PRODUCTS'}
                </StyledText>
              </View>
            )}
          </>
        }
        ListEmptyComponent={
          isLoading ? (
            <InventorySkeleton />
          ) : products && products.length === 0 ? (
            <InventoryEmptyState onAddProduct={handleAddProduct} />
          ) : null
        }
      />

      {/* Pagination */}
      {filtered.length > 0 && !isLoading && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filtered.length}
          itemsPerPage={ITEMS_PER_PAGE}
        />
      )}

      {/* Action modal for restock */}
      <InventoryActionModal
        pendingAction={pendingAction}
        quantityInput={quantityInput}
        onChangeQuantity={setQuantityInput}
        onSubmit={submitAction}
        onClose={closeAction}
        isSubmitting={transactionMutation.isPending}
      />

      {/* Guide modal */}
      <GuideModal visible={showGuide} onClose={() => setShowGuide(false)} />

      {/* Exit confirmation dialog */}
      <CustomModal
        visible={dialogVisible}
        onClose={handleCancelExit}
        title="Exit App"
        description="Are you sure you want to exit the app?"
        variant="warning"
        buttons={[
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: handleCancelExit,
          },
          {
            text: 'Exit',
            style: 'destructive',
            onPress: handleExitApp,
          },
        ]}
      />
    </SafeAreaView>
  );
}
