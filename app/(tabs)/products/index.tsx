import { useLocalSearchParams } from 'expo-router';
import { useState, useMemo } from 'react';
import { Pressable, View, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyledText } from '@/components/elements';
import { CategoriesTab, ProductsTab } from '@/components/products';
import { FontAwesome } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { SearchBar } from '@/components/ui/SearchBar';
import { useProducts, useCategories } from '@/hooks';
import { LOW_STOCK_THRESHOLD, SortOption, sortOption } from '@/constants';

type TabType = 'products' | 'categories';
type SortDirection = 'asc' | 'desc';

export default function Products() {
  const [activeTab, setActiveTab] = useState<TabType>('products');
  const params = useLocalSearchParams<{ filterCategory?: string }>();

  // Hoisted state for search & sort
  const [search, setSearch] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('stock');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [showSortModal, setShowSortModal] = useState<boolean>(false);

  // Queries for live counts in header subtitle
  const { getAllProductsQuery } = useProducts();
  const { getCategoriesWithCountQuery } = useCategories();

  const products = getAllProductsQuery.data;
  const categories = getCategoriesWithCountQuery.data;

  // Compute live product stock counts for header
  const productsStats = useMemo(() => {
    const list = products || [];
    const total = list.length;
    const lowStock = list.filter(
      (p) => p.quantity < LOW_STOCK_THRESHOLD && p.quantity > 0
    ).length;
    const outStock = list.filter((p) => p.quantity === 0).length;
    return { total, lowStock, outStock };
  }, [products]);

  const subtitle =
    activeTab === 'products'
      ? `${productsStats.total} products · ${productsStats.lowStock} low · ${productsStats.outStock} out`
      : `${(categories || []).length} categories total`;

  const title = activeTab === 'products' ? 'Your Products' : 'Your Categories';
  const eyebrow = activeTab === 'products' ? 'CATALOG' : 'SECTIONS';

  const handleSort = (option: SortOption) => {
    if (sortBy === option) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(option);
      setSortDirection('asc');
    }
    setShowSortModal(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Dynamic Redesigned Header Block (Cinnamon bg) */}
      <View className="bg-cinnamon-500 pt-3">
        {/* Cinnamon-styled Tab Switcher */}
        <View className="px-5 pb-4">
          <View className="flex-row bg-cinnamon-700/50 rounded-xl p-1 border border-cinnamon-600">
            <Pressable
              onPress={() => setActiveTab('products')}
              className={`flex-1 py-2 rounded-lg items-center ${
                activeTab === 'products' ? 'bg-persimmon-500' : ''
              }`}
            >
              <StyledText
                variant="semibold"
                className={`text-sm ${
                  activeTab === 'products' ? 'text-white' : 'text-paper-300'
                }`}
              >
                Products
              </StyledText>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab('categories')}
              className={`flex-1 py-2 rounded-lg items-center ${
                activeTab === 'categories' ? 'bg-persimmon-500' : ''
              }`}
            >
              <StyledText
                variant="semibold"
                className={`text-sm ${
                  activeTab === 'categories' ? 'text-white' : 'text-paper-300'
                }`}
              >
                Categories
              </StyledText>
            </Pressable>
          </View>
        </View>

        {/* Monogram dot and Eyebrow */}
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 320 }}
          className="px-5 mb-2 flex-row items-center"
        >
          <View
            className="w-8 h-8 rounded-full bg-persimmon-500 items-center justify-center mr-2"
            style={{
              shadowColor: '#564E45',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 6,
              elevation: 2,
            }}
          >
            <StyledText
              variant="black"
              className="text-paper-50 text-xl font-extrabold"
            >
              ₱
            </StyledText>
          </View>
          <StyledText
            variant="extrabold"
            className="text-label text-paper-200 opacity-80 text-md"
            style={{ letterSpacing: 1.4 }}
          >
            {eyebrow}
          </StyledText>
        </MotiView>

        {/* Title and Subtitle */}
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 320 }}
          className="px-5 pb-5 flex-row justify-between items-start"
        >
          <View className="flex-1 mr-3">
            <StyledText
              variant="extrabold"
              className="text-h1 text-paper-50 text-3xl"
              style={{ letterSpacing: -0.28 }}
            >
              {title}
            </StyledText>
            <StyledText
              variant="regular"
              className="text-sm text-paper-200 opacity-90 mt-1"
            >
              {subtitle}
            </StyledText>
          </View>
        </MotiView>

        {/* Search & Sort Row (Z3a) — ONLY for products tab */}
        {activeTab === 'products' && (
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: 'timing', duration: 320, delay: 80 }}
          >
            <View className="px-5 pb-4 flex-row items-center gap-3">
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
                  <View className="absolute top-2 right-2 w-2 h-2 rounded-full bg-persimmon-500" />
                )}
              </TouchableOpacity>
            </View>
          </MotiView>
        )}
      </View>

      {/* Tab Content */}
      {activeTab === 'products' ? (
        <ProductsTab
          filterCategory={params.filterCategory}
          search={search}
          sortBy={sortBy}
          sortDirection={sortDirection}
          onClearSearch={() => setSearch('')}
        />
      ) : (
        <CategoriesTab />
      )}

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
            <StyledText variant="extrabold" className="text-ink-900 text-xl mb-4">
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
                  <FontAwesome name={option.icon as any} size={18} color="#E85A1F" />
                  <StyledText variant="medium" className="text-ink-800 ml-3 text-base">
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
              <StyledText variant="semibold" className="text-ink-700 text-center text-base">
                Close
              </StyledText>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
