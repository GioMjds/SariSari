import { StyledText } from '@/components/elements';
import { Pagination } from '@/components/ui';
import { SortOption, sortOption, ITEMS_PER_PAGE, LOW_STOCK_THRESHOLD } from '@/constants';
import { useProducts, useCategories } from '@/hooks';
import { Product } from '@/types';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  TouchableOpacity,
  View,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { MotiView } from 'moti';

import { ProductsHeader } from './ProductsHeader';
import { ProductsHero } from './ProductsHero';
import { ProductCard } from './ProductCard';
import { ProductsEmptyState } from './ProductsEmptyState';
import { ProductsSkeleton } from './ProductsSkeleton';
import { FilterChips } from '../inventory/FilterChips';
import { SearchBar } from '../ui/SearchBar';

type SortDirection = 'asc' | 'desc';

interface ProductsTabProps {
  filterCategory?: string;
  showSortModal?: boolean;
  setShowSortModal?: (show: boolean) => void;
}

export function ProductsTab({
  filterCategory,
  showSortModal: externalShowSortModal,
  setShowSortModal: externalSetShowSortModal,
}: ProductsTabProps) {
  const [search, setSearch] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('stock'); // default stock sort
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  const [internalShowSortModal, setInternalShowSortModal] = useState<boolean>(false);
  const showSortModal = externalShowSortModal ?? internalShowSortModal;
  const setShowSortModal = externalSetShowSortModal ?? setInternalShowSortModal;

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

  const debounceRef = useRef<number | null>(null);

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

  // Debounce search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(
      () => setDebouncedSearch(search.trim()),
      300,
    ) as unknown as number;
  }, [search]);

  // Reset to first page when search, sort, or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, sortBy, sortDirection, filters]);

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
    if (debouncedSearch) {
      const term = debouncedSearch.toLowerCase();
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
  }, [products, debouncedSearch, sortBy, sortDirection, filters]);

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

    const totalValueCentavos = relevantProducts.reduce(
      (sum, p) => sum + p.price * p.quantity,
      0,
    );

    const lowStock = relevantProducts.filter(
      (p) => p.quantity < LOW_STOCK_THRESHOLD && p.quantity > 0
    ).length;

    const outStock = relevantProducts.filter(
      (p) => p.quantity === 0
    ).length;

    return {
      total: relevantProducts.length,
      lowStock,
      outStock,
      totalValueCentavos,
    };
  }, [products, filters.category, filters.uncategorized]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleSort = (option: SortOption) => {
    if (sortBy === option) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(option);
      setSortDirection('asc');
    }
    setShowSortModal(false);
  };

  const handleProductPress = useCallback((product: Product) => {
    router.push(`/(edit-forms)/edit-product/${product.id}` as any);
  }, [router]);

  const handleProductLongPress = useCallback((product: Product) => {
    setSelectedProduct(product);
    setShowDeleteModal(true);
  }, []);

  const confirmDelete = () => {
    if (selectedProduct) {
      deleteProductMutation.mutate(selectedProduct.id);
      setShowDeleteModal(false);
      setSelectedProduct(null);
    }
  };

  const handleChipsChange = useCallback((next: { lowStock: boolean; outOfStock: boolean }) => {
    setFilters((prev) => ({
      ...prev,
      lowStock: next.lowStock,
      outOfStock: next.outOfStock,
    }));
  }, []);

  // Map state to FilterChips expectations.
  // We want to show a dot on the "More" chip if any category filter is active.
  const mappedFiltersForChips = useMemo(() => ({
    lowStock: filters.lowStock,
    outOfStock: filters.outOfStock || filters.uncategorized || filters.category !== null,
  }), [filters]);

  const handleClearFilters = useCallback(() => {
    setFilters({
      lowStock: false,
      outOfStock: false,
      uncategorized: false,
      category: null,
    });
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearch('');
  }, []);

  if (isLoading) {
    return <ProductsSkeleton />;
  }

  // Determine empty state variant
  const hasProductsInDb = products.length > 0;
  const showEmptyState = filteredProducts.length === 0;
  const emptyVariant = !hasProductsInDb
    ? 'no-products'
    : debouncedSearch
      ? 'no-search'
      : 'no-filter';

  return (
    <View className="flex-1">
      {/* Products Header (Z1) */}
      <ProductsHeader
        productCount={stats.total}
        lowCount={stats.lowStock}
        outCount={stats.outStock}
      />

      {/* Products Hero (Z2) */}
      {hasProductsInDb && (
        <ProductsHero
          total={stats.total}
          lowStock={stats.lowStock + stats.outStock}
          totalValueCentavos={stats.totalValueCentavos}
        />
      )}

      {/* Search & Sort Row (Z3a) */}
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: 'timing', duration: 320, delay: 80 }}
      >
        <View className="px-5 pb-4 bg-cinnamon-500 flex-row items-center gap-3">
          <View className="flex-1">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search products or SKU..."
            />
          </View>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setShowSortModal(true)}
            className="w-[46px] h-[46px] rounded-xl justify-center items-center bg-paper-50/15 relative"
          >
            <FontAwesome name="sort" size={18} color="#FBF7EE" />
            {(sortBy !== 'stock' || sortDirection !== 'asc') && (
              <View className="absolute top-2 right-2 w-2 h-2 rounded-full bg-persimmon-500 animate-pulse" />
            )}
          </TouchableOpacity>
        </View>
      </MotiView>

      {/* Filter Chips Strip (Z3b) */}
      <View className="mt-3">
        <FilterChips
          filters={mappedFiltersForChips}
          onChange={handleChipsChange}
          onOpenMore={() => setShowCategorySheet(true)}
        />
      </View>

      {/* Main Content Area */}
      {showEmptyState ? (
        <ProductsEmptyState
          variant={emptyVariant}
          searchTerm={debouncedSearch}
          onAddPress={() => router.push('/(edit-forms)/add-product')}
          onClearSearch={handleClearSearch}
          onClearFilters={handleClearFilters}
        />
      ) : (
        <FlatList
          data={paginatedProducts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item, index }) => (
            <MotiView
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{
                type: 'timing',
                duration: 320,
                delay: 200 + (index % 5) * 50,
              }}
            >
              <ProductCard
                product={item}
                index={index}
                onPress={handleProductPress}
                onLongPress={handleProductLongPress}
              />
            </MotiView>
          )}
          contentContainerStyle={{
            paddingTop: 8,
            paddingBottom: 120,
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
        />
      )}

      {/* Floating Add Product FAB (Z5) */}
      <MotiView
        from={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 15, delay: 240 }}
        className="absolute bottom-6 right-6 z-[1000]"
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push('/(edit-forms)/add-product')}
          className="w-[60px] h-[60px] rounded-full bg-persimmon-500 justify-center items-center shadow-persimmon-glow"
          style={{
            shadowColor: '#E85A1F',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 6,
          }}
        >
          <FontAwesome name="plus" size={24} color="#FBF7EE" />
        </TouchableOpacity>
      </MotiView>

      {/* Sort Modal */}
      <Modal
        visible={showSortModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSortModal(false)}
      >
        <Pressable
          className="flex-1 justify-end"
          onPress={() => setShowSortModal(false)}
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
        >
          <Pressable
            className="bg-white rounded-t-3xl p-6"
            onPress={(e) => e.stopPropagation()}
          >
            <StyledText
              variant="extrabold"
              className="text-ink-900 text-xl mb-4"
            >
              Sort By
            </StyledText>
            {sortOption.map((option) => (
              <TouchableOpacity
                key={option.key}
                hitSlop={20}
                onPress={() => handleSort(option.key)}
                activeOpacity={0.2}
                className="flex-row items-center justify-between py-4 border-b border-ink-100"
              >
                <View className="flex-row items-center">
                  <FontAwesome
                    name={option.icon as any}
                    size={18}
                    color="#E85A1F"
                  />
                  <StyledText
                    variant="medium"
                    className="text-ink-800 ml-3 text-base"
                  >
                    {option.label}
                  </StyledText>
                </View>
                {sortBy === option.key && (
                  <FontAwesome
                    name={sortDirection === 'asc' ? 'sort-asc' : 'sort-desc'}
                    size={18}
                    color="#E85A1F"
                  />
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              onPress={() => setShowSortModal(false)}
              className="bg-ink-100 rounded-xl py-3 mt-4 active:opacity-70"
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
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
        >
          <Pressable
            className="bg-white rounded-t-3xl p-6 max-h-[80%]"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="flex-row justify-between items-center mb-4">
              <StyledText
                variant="extrabold"
                className="text-ink-900 text-xl"
              >
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
                  <StyledText variant="semibold" className="text-persimmon-500 text-sm">
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
                  variant={filters.uncategorized ? 'bold' : 'medium'}
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
                        variant={isSelected ? 'bold' : 'medium'}
                        className="text-ink-700 text-base"
                      >
                        {cat.name}
                      </StyledText>
                      <View className="bg-ink-100 rounded-full px-2 py-0.5 ml-2">
                        <StyledText variant="regular" className="text-ink-500 text-[10px]">
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
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
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
}
