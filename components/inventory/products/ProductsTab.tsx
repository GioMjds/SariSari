import { StyledText } from '@/components/elements';
import { TAB_BAR_TOTAL_OFFSET } from '@/components/layout';
import { Pagination } from '@/components/ui';
import { ITEMS_PER_PAGE, LOW_STOCK_THRESHOLD, SortOption } from '@/constants';
import { useCategories, useProducts } from '@/hooks';
import { Product } from '@/types';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useInventoryViewStore } from '@/stores';

import { useCallback, useEffect, useMemo, useState, memo } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Modal,
    Pressable,
    RefreshControl,
    ScrollView,
    TouchableOpacity,
    View,
} from 'react-native';

import { FilterChips } from '../FilterChips';
import { InventoryRow } from '../InventoryRow';
import { ProductGridItem } from './ProductGridItem';
import { ProductsEmptyState } from './ProductsEmptyState';
import { ProductsHero } from './ProductsHero';
import { ProductsSkeleton } from './ProductsSkeleton';

type SortDirection = 'asc' | 'desc';

interface ProductsTabProps {
  filterCategory?: string;
  search: string;
  sortBy: SortOption;
  sortDirection: SortDirection;
  onClearSearch?: () => void;
  onRestock: (product: Product) => void;
  onMore: (product: Product) => void;
}

export const ProductsTab = memo(function ProductsTab({
  filterCategory,
  search,
  sortBy,
  sortDirection,
  onClearSearch,
  onRestock,
  onMore,
}: ProductsTabProps) {
  const { viewMode } = useInventoryViewStore();

  const [showCategorySheet, setShowCategorySheet] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Filters state
  const [filters, setFilters] = useState<{
    lowStock: boolean;
    outOfStock: boolean;
    uncategorized: boolean;
    category: string | null;
  }>({
    lowStock: false,
    outOfStock: false,
    uncategorized: false,
    category: filterCategory || null,
  });

  const router = useRouter();
  const { getAllProductsQuery, deleteProductMutation } = useProducts();
  const { getCategoriesWithCountQuery } = useCategories();



  // Synchronize filterCategory prop (from deep links) with state
  useEffect(() => {
    if (filterCategory) {
      setFilters((prev) => ({
        ...prev,
        category: filterCategory,
        uncategorized: false,
      }));
    }
  }, [filterCategory]);

  // Reset to first page when search, sort, or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, sortBy, sortDirection, filters]);

  // Fetch products & categories
  const { data: products = [], isLoading, refetch } = getAllProductsQuery;
  const categories = getCategoriesWithCountQuery.data || [];

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Filter by category name
    if (filters.category) {
      result = result.filter((p) => p.category === filters.category);
    }

    // Filter by uncategorized
    if (filters.uncategorized) {
      result = result.filter((p) => !p.category);
    }

    // Filter by low stock (includes out of stock)
    if (filters.lowStock) {
      result = result.filter((p) => p.quantity < LOW_STOCK_THRESHOLD);
    }

    // Filter by out of stock specifically
    if (filters.outOfStock) {
      result = result.filter((p) => p.quantity === 0);
    }

    // Filter by search term
    if (search.trim()) {
      const term = search.trim().toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.sku.toLowerCase().includes(term),
      );
    }

    // Sort products
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'stock':
          comparison = a.quantity - b.quantity;
          break;
        case 'sku':
          comparison = a.sku.localeCompare(b.sku);
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [products, search, sortBy, sortDirection, filters]);

  // Paginated products
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, currentPage]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);

  // Compute stats over the relevant products (category-filtered if category active)
  const stats = useMemo(() => {
    const relevantProducts = filters.category
      ? products.filter((p) => p.category === filters.category)
      : filters.uncategorized
        ? products.filter((p) => !p.category)
        : products;

    const totalValuepesos = relevantProducts.reduce(
      (sum, p) => sum + p.price * p.quantity,
      0,
    );

    const lowStock = relevantProducts.filter(
      (p) => p.quantity < LOW_STOCK_THRESHOLD && p.quantity > 0,
    ).length;

    const outStock = relevantProducts.filter((p) => p.quantity === 0).length;

    return {
      total: relevantProducts.length,
      lowStock,
      outStock,
      totalValuepesos,
    };
  }, [products, filters.category, filters.uncategorized]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };


  const confirmDelete = () => {
    if (selectedProduct) {
      deleteProductMutation.mutate(selectedProduct.id);
      setShowDeleteModal(false);
      setSelectedProduct(null);
    }
  };

  const handleChipsChange = useCallback(
    (next: { lowStock: boolean; outOfStock: boolean }) => {
      setFilters((prev) => ({
        ...prev,
        lowStock: next.lowStock,
        outOfStock: next.outOfStock,
      }));
    },
    [],
  );

  // Map state to FilterChips expectations.
  // We want to show a dot on the "More" chip if any category filter is active.
  const mappedFiltersForChips = useMemo(
    () => ({
      lowStock: filters.lowStock,
      outOfStock:
        filters.outOfStock ||
        filters.uncategorized ||
        filters.category !== null,
    }),
    [filters],
  );

  const handleClearFilters = useCallback(() => {
    setFilters({
      lowStock: false,
      outOfStock: false,
      uncategorized: false,
      category: null,
    });
  }, []);

  const handleClearSearch = useCallback(() => {
    if (onClearSearch) {
      onClearSearch();
    }
  }, [onClearSearch]);

  const renderProductItem = useCallback(
    ({ item, index }: { item: Product; index: number }) =>
      viewMode === 'grid' ? (
        <ProductGridItem
          product={item}
          index={index}
          onRestock={onRestock}
          onMore={onMore}
        />
      ) : (
        <InventoryRow
          item={item}
          index={index}
          onRestock={onRestock}
          onMore={onMore}
        />
      ),
    [viewMode, onRestock, onMore],
  );

  if (isLoading) {
    return <ProductsSkeleton />;
  }

  // Determine empty state variant
  const hasProductsInDb = products.length > 0;
  const showEmptyState = filteredProducts.length === 0;
  const emptyVariant = !hasProductsInDb
    ? 'no-products'
    : search.trim()
      ? 'no-search'
      : 'no-filter';

  return (
    <View className="flex-1 relative">
      {/* Products Hero (Z2) - now a slim receipt summary bar */}
      {hasProductsInDb && (
        <ProductsHero
          total={stats.total}
          lowStock={stats.lowStock + stats.outStock}
          totalValuePesos={stats.totalValuepesos}
        />
      )}

      {/* Filter Chips Strip (Z3b) */}
      <FilterChips
        filters={mappedFiltersForChips}
        onChange={handleChipsChange}
        onOpenMore={() => setShowCategorySheet(true)}
      />

      {/* Main Content Area */}
      {showEmptyState ? (
        <ProductsEmptyState
          variant={emptyVariant}
          searchTerm={search}
          onAddPress={() => router.push('/(edit-forms)/add-product')}
          onClearSearch={handleClearSearch}
          onClearFilters={handleClearFilters}
        />
      ) : (
         <FlatList
          key={viewMode}
          numColumns={viewMode === 'grid' ? 2 : 1}
          data={paginatedProducts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderProductItem}
          contentContainerStyle={{
            paddingTop: 4,
            // Reserve room for the floating pagination pill (paper
            // surface, ~52px tall) plus the safe-area inset baked
            // into the pill itself.
            paddingBottom: 96,
            paddingHorizontal: viewMode === 'grid' ? 8 : 0,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#E85A1F"
              colors={['#E85A1F']}
            />
          }
        />
      )}

      {/* Pagination Footer */}
      {!showEmptyState && filteredProducts.length > ITEMS_PER_PAGE && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filteredProducts.length}
          itemsPerPage={ITEMS_PER_PAGE}
          bottomOffset={TAB_BAR_TOTAL_OFFSET}
        />
      )}


      {/* Category Bottom Sheet / Filter Picker */}
      <Modal
        visible={showCategorySheet}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCategorySheet(false)}
      >
        <Pressable
          className="flex-1 justify-end"
          onPress={() => setShowCategorySheet(false)}
          style={{ backgroundColor: 'rgba(14, 12, 10, 0.6)' }}
        >
          <Pressable
            className="bg-white rounded-t-3xl p-6 max-h-[80%]"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="flex-row justify-between items-center mb-4">
              <StyledText variant="extrabold" className="text-ink-900 text-xl">
                Filter by Category
              </StyledText>
              {(filters.category !== null || filters.uncategorized) && (
                <TouchableOpacity
                  onPress={() => {
                    setFilters((prev) => ({
                      ...prev,
                      category: null,
                      uncategorized: false,
                    }));
                    setShowCategorySheet(false);
                  }}
                >
                  <StyledText
                    variant="semibold"
                    className="text-persimmon-500 text-sm"
                  >
                    Clear Category
                  </StyledText>
                </TouchableOpacity>
              )}
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="mb-4">
              {/* Option: Uncategorized */}
              <TouchableOpacity
                onPress={() => {
                  setFilters((prev) => ({
                    ...prev,
                    category: null,
                    uncategorized: true,
                  }));
                  setShowCategorySheet(false);
                }}
                className="flex-row items-center justify-between py-4 border-b border-ink-100"
              >
                <StyledText
                  variant={filters.uncategorized ? 'extrabold' : 'medium'}
                  className="text-ink-700 text-base"
                >
                  No Category (Uncategorized)
                </StyledText>
                {filters.uncategorized && (
                  <FontAwesome name="check" size={16} color="#E85A1F" />
                )}
              </TouchableOpacity>

              {/* Real Categories */}
              {categories.map((cat) => {
                const isSelected = filters.category === cat.name;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => {
                      setFilters((prev) => ({
                        ...prev,
                        category: cat.name,
                        uncategorized: false,
                      }));
                      setShowCategorySheet(false);
                    }}
                    className="flex-row items-center justify-between py-4 border-b border-ink-100"
                  >
                    <View className="flex-row items-center">
                      <StyledText
                        variant={isSelected ? 'extrabold' : 'medium'}
                        className="text-ink-700 text-base"
                      >
                        {cat.name}
                      </StyledText>
                      <View className="bg-ink-100 rounded-full px-2 py-0.5 ml-2">
                        <StyledText
                          variant="regular"
                          className="text-ink-500 text-[10px]"
                        >
                          {cat.product_count}
                        </StyledText>
                      </View>
                    </View>
                    {isSelected && (
                      <FontAwesome name="check" size={16} color="#E85A1F" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              onPress={() => setShowCategorySheet(false)}
              className="bg-ink-100 rounded-xl py-3 mt-2"
            >
              <StyledText
                variant="semibold"
                className="text-ink-700 text-center text-base"
              >
                Close
              </StyledText>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View
          className="flex-1 justify-center items-center px-6"
          style={{ backgroundColor: 'rgba(14, 12, 10, 0.6)' }}
        >
          <View className="bg-white rounded-2xl p-6 w-full max-w-sm border border-ink-100">
            <View className="items-center mb-4">
              <View className="bg-red-50 rounded-full p-4 mb-3">
                <FontAwesome
                  name="exclamation-triangle"
                  size={32}
                  color="#C13030"
                />
              </View>
              <StyledText
                variant="extrabold"
                className="text-ink-900 text-xl mb-2 text-center"
              >
                Delete Product?
              </StyledText>
              <StyledText
                variant="regular"
                className="text-ink-500 text-sm text-center"
              >
                {`Are you sure you want to delete "${selectedProduct?.name || ''}"?`}
              </StyledText>
              <StyledText
                variant="semibold"
                className="text-semantic-danger text-sm mt-2 text-center"
              >
                This action cannot be undone.
              </StyledText>
            </View>
            <View className="gap-3">
              <TouchableOpacity
                onPress={confirmDelete}
                disabled={deleteProductMutation.isPending}
                className="bg-semantic-danger rounded-xl py-3 active:opacity-70"
              >
                {deleteProductMutation.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <StyledText
                    variant="extrabold"
                    className="text-white text-center text-base"
                  >
                    Yes, Delete Product
                  </StyledText>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowDeleteModal(false)}
                className="bg-ink-100 rounded-xl py-3 active:opacity-70"
              >
                <StyledText
                  variant="semibold"
                  className="text-ink-700 text-center text-base"
                >
                  Cancel
                </StyledText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
});
