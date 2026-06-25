import { StyledText } from '@/components/elements';
import { InventoryActionModal } from '@/components/inventory/InventoryActionModal';
import { ProductsTab } from '@/components/inventory/products';
import { CategoriesTab } from '@/components/inventory/category';
import { SearchBar } from '@/components/ui/SearchBar';
import { LOW_STOCK_THRESHOLD, SortOption, sortOption } from '@/constants';
import { useCategories, useProducts } from '@/hooks';
import { Product } from '@/types';
import { InventoryEventType } from '@/types/inventory.types';
import { FontAwesome } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type TabType = 'products' | 'categories';
type SortDirection = 'asc' | 'desc';

type PendingAction = { product: Product; type: InventoryEventType };

export default function Products() {
  const [activeTab, setActiveTab] = useState<TabType>('products');
  const params = useLocalSearchParams<{
    filterCategory?: string;
    restock?: string;
  }>();
  const router = useRouter();

  // Hoisted state for search & sort
  const [search, setSearch] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('stock');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [showSortModal, setShowSortModal] = useState<boolean>(false);

  // Queries for live counts in header subtitle
  const { getAllProductsQuery, deleteProductMutation } = useProducts();
  const { getCategoriesWithCountQuery } = useCategories();

  const products = getAllProductsQuery.data;
  const categories = getCategoriesWithCountQuery.data;

  // Local state for restocking and actions
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(
    null,
  );
  const [initialQuantity, setInitialQuantity] = useState(1);
  const [selectedProductForSheet, setSelectedProductForSheet] =
    useState<Product | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Deep-link restock effect
  useEffect(() => {
    if (params.restock && products && products.length > 0) {
      const productId = parseInt(params.restock, 10);
      const product = products.find((p) => p.id === productId);
      if (product) {
        setPendingAction({ product, type: 'restock' });
        const qtyDiff = LOW_STOCK_THRESHOLD - product.quantity;
        setInitialQuantity(Math.max(1, qtyDiff));
        router.setParams({ restock: undefined });
      }
    }
  }, [params.restock, products, router]);

  // Compute live product stock counts for header
  const productsStats = useMemo(() => {
    const list = products || [];
    const total = list.length;
    const lowStock = list.filter(
      (p) => p.quantity < LOW_STOCK_THRESHOLD && p.quantity > 0,
    ).length;
    const outStock = list.filter((p) => p.quantity === 0).length;
    return { total, lowStock, outStock };
  }, [products]);

  const subtitle =
    activeTab === 'products'
      ? `${productsStats.total} products · ${productsStats.lowStock} low · ${productsStats.outStock} out`
      : `${(categories || []).length} categories total`;

  const title = activeTab === 'products' ? 'Catalog' : 'Your Categories';
  const eyebrow = activeTab === 'products' ? 'MASTER DATA' : 'SECTIONS';

  const handleSort = (option: SortOption) => {
    if (sortBy === option) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(option);
      setSortDirection('asc');
    }
    setShowSortModal(false);
  };

  const confirmDelete = () => {
    if (productToDelete) {
      deleteProductMutation.mutate(productToDelete.id, {
        onSuccess: () => {
          setShowDeleteModal(false);
          setProductToDelete(null);
        },
      });
    }
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

          {activeTab === 'products' && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push('/(edit-forms)/add-product')}
              accessibilityRole="button"
              accessibilityLabel="Add product"
              className="w-11 h-11 rounded-full items-center justify-center bg-paper-50/15 press-scale"
            >
              <FontAwesome name="plus" size={18} color="#FBF7EE" />
            </TouchableOpacity>
          )}
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
          onRestock={(product) =>
            setPendingAction({ product, type: 'restock' })
          }
          onMore={(product) => setSelectedProductForSheet(product)}
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

      {/* Inventory Action Modal */}
      <InventoryActionModal
        pendingAction={pendingAction}
        initialQuantity={initialQuantity}
        onClose={() => setPendingAction(null)}
      />

      {/* Action Sheet Modal (Overflow menu) */}
      <Modal
        visible={!!selectedProductForSheet}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedProductForSheet(null)}
        statusBarTranslucent
      >
        <Pressable
          className="flex-1 justify-end"
          onPress={() => setSelectedProductForSheet(null)}
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
        >
          <Pressable
            className="bg-white rounded-t-3xl p-6 pb-10"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="items-center mb-4">
              <View className="w-12 h-1 bg-ink-200 rounded-full mb-4" />
              <StyledText
                variant="extrabold"
                className="text-ink-900 text-lg text-center"
              >
                {selectedProductForSheet?.name}
              </StyledText>
              <StyledText
                variant="regular"
                className="text-ink-500 text-xs text-center mt-1"
              >
                Select action to perform
              </StyledText>
            </View>

            <View className="gap-2">
              {/* Action: Damage */}
              <TouchableOpacity
                onPress={() => {
                  const product = selectedProductForSheet!;
                  setSelectedProductForSheet(null);
                  setPendingAction({ product, type: 'damaged' });
                }}
                className="flex-row items-center py-4 px-4 bg-paper-100 rounded-xl border border-ink-100"
              >
                <FontAwesome
                  name="ban"
                  size={18}
                  color="#C22D2D"
                  className="mr-3 w-6 text-center"
                />
                <StyledText
                  variant="semibold"
                  className="text-ink-800 text-base"
                >
                  Mark Damaged
                </StyledText>
              </TouchableOpacity>

              {/* Action: Adjust */}
              <TouchableOpacity
                onPress={() => {
                  const product = selectedProductForSheet!;
                  setSelectedProductForSheet(null);
                  setPendingAction({ product, type: 'adjustment' });
                }}
                className="flex-row items-center py-4 px-4 bg-paper-100 rounded-xl border border-ink-100"
              >
                <FontAwesome
                  name="sliders"
                  size={18}
                  color="#4A2610"
                  className="mr-3 w-6 text-center"
                />
                <StyledText
                  variant="semibold"
                  className="text-ink-800 text-base"
                >
                  Adjust Stock
                </StyledText>
              </TouchableOpacity>

              {/* Action: View Ledger */}
              <TouchableOpacity
                onPress={() => {
                  const product = selectedProductForSheet!;
                  setSelectedProductForSheet(null);
                  router.push(
                    `/(edit-forms)/inventory-ledger/${product.id}` as any,
                  );
                }}
                className="flex-row items-center py-4 px-4 bg-paper-100 rounded-xl border border-ink-100"
              >
                <FontAwesome
                  name="list-alt"
                  size={18}
                  color="#E85A1F"
                  className="mr-3 w-6 text-center"
                />
                <StyledText
                  variant="semibold"
                  className="text-ink-800 text-base"
                >
                  View Ledger
                </StyledText>
              </TouchableOpacity>

              {/* Divider */}
              <View className="h-[1px] bg-ink-100 my-2" />

              {/* Action: Delete */}
              <TouchableOpacity
                onPress={() => {
                  const product = selectedProductForSheet!;
                  setSelectedProductForSheet(null);
                  setProductToDelete(product);
                  setShowDeleteModal(true);
                }}
                className="flex-row items-center py-4 px-4 bg-red-50 rounded-xl border border-red-200"
              >
                <FontAwesome
                  name="trash"
                  size={18}
                  color="#C22D2D"
                  className="mr-3 w-6 text-center"
                />
                <StyledText
                  variant="extrabold"
                  className="text-semantic-danger text-base"
                >
                  Delete Product
                </StyledText>
              </TouchableOpacity>
            </View>
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
                  color="#C22D2D"
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
                {`Are you sure you want to delete "${productToDelete?.name || ''}"?`}
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
    </SafeAreaView>
  );
}
