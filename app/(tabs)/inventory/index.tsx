import { StyledText } from '@/components/elements';
import {
  InventoryActionModal,
  ProductActionSheet,
  ProductDeleteModal,
  SortBottomSheet,
  SupplierActionSheet,
  SupplierDeleteModal,
} from '@/components/inventory';
import { ProductsTab } from '@/components/inventory/products';
import { CategoriesTab } from '@/components/inventory/category';
import { SuppliersTab } from '@/components/inventory/suppliers/SuppliersTab';
import { BarcodeScannerModal, SearchBar } from '@/components/ui';
import { LOW_STOCK_THRESHOLD, SortOption } from '@/constants';
import { useCategories, useProducts, useSuppliers, useStockRecommendations } from '@/hooks';
import { Product, Supplier } from '@/types';
import { InventoryEventType } from '@/types/inventory.types';
import { useInventoryViewStore } from '@/stores';
import { FontAwesome } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, Href } from 'expo-router';
import { MotiView } from 'moti';
import { useTranslation } from 'react-i18next';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type TabType = 'products' | 'categories' | 'suppliers';
type SortDirection = 'asc' | 'desc';

type PendingAction = { product: Product; type: InventoryEventType };

// Reusable small circular button used in the header (barcode, add).
// Centralized so the surface (paper-50/15), sizing, and active
// feedback are identical across the products and suppliers tabs.
function HeaderCircleButton({
  icon,
  onPress,
  accessibilityLabel,
}: {
  icon: 'barcode' | 'plus';
  onPress: () => void;
  accessibilityLabel: string;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      className="w-11 h-11 rounded-full items-center justify-center bg-paper-50/15 active:scale-[0.94] active:opacity-80"
    >
      <FontAwesome name={icon} size={18} color="#FBF7EE" />
    </TouchableOpacity>
  );
}


export default function Products() {
  const { t } = useTranslation('inventory');
  const [activeTab, setActiveTab] = useState<TabType>('products');
  const params = useLocalSearchParams<{
    filterCategory?: string;
    restock?: string;
    tab?: string;
  }>();
  const router = useRouter();
  const { viewMode, setViewMode } = useInventoryViewStore();

  // Hoisted state for search & sort
  const [search, setSearch] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('stock');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [showSortModal, setShowSortModal] = useState<boolean>(false);

  // Queries for live counts in header subtitle
  const { getAllProductsQuery, deleteProductMutation } = useProducts();
  const { getCategoriesWithCountQuery } = useCategories();
  const { getAllSuppliersQuery, deleteSupplierMutation } = useSuppliers();
  const { data: recommendations } = useStockRecommendations();

  const activeRecommendationsCount = useMemo(() => {
    if (!recommendations) return 0;
    return recommendations.filter((rec) => {
      const isDeferred =
        rec.savedPlan?.status === 'deferred' &&
        rec.savedPlan.deferredUntil &&
        new Date(rec.savedPlan.deferredUntil).getTime() > Date.now();
      const isDismissed = rec.savedPlan?.status === 'dismissed';
      return !isDeferred && !isDismissed;
    }).length;
  }, [recommendations]);

  const products = getAllProductsQuery.data;
  const categories = getCategoriesWithCountQuery.data;
  const suppliers = getAllSuppliersQuery.data;

  // Local state for restocking and actions
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(
    null,
  );
  const [initialQuantity, setInitialQuantity] = useState(1);
  const [selectedProductForSheet, setSelectedProductForSheet] =
    useState<Product | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Local state for suppliers
  const [selectedSupplierForSheet, setSelectedSupplierForSheet] =
    useState<Supplier | null>(null);
  const [showSupplierDeleteModal, setShowSupplierDeleteModal] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(
    null,
  );

  // Barcode scanner state — opens the camera from the inventory header
  // so the user can register a new product without first entering the
  // Add Product form. On a successful scan we push the Add Product
  // route with the scanned barcode as a prefill param (`prefillBarcode`
  // — the v5 spec renamed the param from the old `prefillSku`); the
  // form hook consumes the param and runs the same scanner handler
  // that the in-form scan button uses.
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const openScanner = useCallback(() => setIsScannerOpen(true), []);
  const closeScanner = useCallback(() => setIsScannerOpen(false), []);
  const handleScannedBarcode = useCallback(
    (barcode: string) => {
      setIsScannerOpen(false);
      router.push(
        `/(edit-forms)/add-product?prefillBarcode=${encodeURIComponent(barcode)}` as any,
      );
    },
    [router],
  );

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

  // Synchronize tab state with search params (including deep links)
  useEffect(() => {
    if (params.filterCategory || params.restock) {
      setActiveTab('products');
      if (params.filterCategory) {
        router.setParams({ filterCategory: undefined });
      }
    } else if (
      params.tab &&
      ['products', 'categories', 'suppliers'].includes(params.tab)
    ) {
      setActiveTab(params.tab as TabType);
      router.setParams({ tab: undefined });
    }
  }, [params.filterCategory, params.restock, params.tab, router]);

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
      ? t('subtitleProducts', {
          total: productsStats.total,
          low: productsStats.lowStock,
          out: productsStats.outStock,
        })
      : activeTab === 'categories'
        ? t('subtitleCategories', { count: (categories || []).length })
        : t('subtitleSuppliers', { count: (suppliers || []).length });

  const title =
    activeTab === 'products'
      ? t('titleCatalog')
      : activeTab === 'categories'
        ? t('titleCategories')
        : t('titleSuppliers');

  const eyebrow =
    activeTab === 'products'
      ? t('eyebrowMaster')
      : activeTab === 'categories'
        ? t('eyebrowSections')
        : t('eyebrowMaster');

  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
    setSearch('');
  }, []);

  const handleSort = useCallback(
    (option: SortOption) => {
      if (sortBy === option) {
        setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortBy(option);
        setSortDirection('asc');
      }
      setShowSortModal(false);
    },
    [sortBy],
  );

  const confirmDelete = useCallback(() => {
    if (productToDelete) {
      deleteProductMutation.mutate(productToDelete.id, {
        onSuccess: () => {
          setShowDeleteModal(false);
          setProductToDelete(null);
        },
      });
    }
  }, [productToDelete, deleteProductMutation]);

  const handleClearSearch = useCallback(() => {
    setSearch('');
  }, []);

  const handleRestock = useCallback((product: Product) => {
    const qtyDiff = LOW_STOCK_THRESHOLD - product.quantity;
    setInitialQuantity(Math.max(1, qtyDiff));
    setPendingAction({ product, type: 'restock' });
  }, []);

  const handleMore = useCallback((product: Product) => {
    setSelectedProductForSheet(product);
  }, []);

  const handleSupplierMore = useCallback((supplier: Supplier) => {
    setSelectedSupplierForSheet(supplier);
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-cinnamon-500" edges={['top']}>
      <View className="flex-1 bg-background">
        {/* Dynamic Redesigned Header Block (Cinnamon bg) */}
        <View className="bg-cinnamon-500 pt-3">
          {/* Cinnamon-styled Tab Switcher */}
          <View className="px-5 pb-4">
            <View className="flex-row bg-cinnamon-700/50 rounded-xl p-1 border border-cinnamon-600">
              {(['products', 'categories', 'suppliers'] as TabType[]).map(
                (tab) => {
                  const isActive = activeTab === tab;
                  const label =
                    tab === 'products'
                      ? t('tabProducts')
                      : tab === 'categories'
                        ? t('tabCategories')
                        : t('tabSuppliers');

                  return (
                    <Pressable
                      key={tab}
                      onPress={() => handleTabChange(tab)}
                      className="flex-1 py-2 rounded-lg items-center active:scale-[0.96] transition-transform"
                      style={{
                        backgroundColor: isActive ? '#E85A1F' : 'transparent',
                      }}
                    >
                      <StyledText
                        variant="semibold"
                        className="text-sm"
                        style={{ color: isActive ? '#FFFFFF' : '#E5D8BC' }}
                      >
                        {label}
                      </StyledText>
                    </Pressable>
                  );
                },
              )}
            </View>
          </View>

          {/* Eyebrow — receipt label, no opacity (tokens guarantee contrast) */}
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: 'timing', duration: 220 }}
            className="px-5 mb-2"
          >
            <StyledText
              variant="extrabold"
              className="label-caps text-paper-300"
            >
              {eyebrow}
            </StyledText>
          </MotiView>

          {/* Title and Subtitle */}
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: 'timing', duration: 220, delay: 40 }}
            className="px-5 pb-5 flex-row justify-between items-start"
          >
            <View className="flex-1 mr-3">
              <StyledText
                variant="extrabold"
                className="text-h1 text-paper-50"
                style={{ letterSpacing: -0.28 }}
              >
                {title}
              </StyledText>
              <StyledText
                variant="regular"
                className="text-sm text-paper-200 mt-1"
              >
                {subtitle}
              </StyledText>
            </View>

            {activeTab === 'products' && (
              <View className="flex-row gap-2">
                <HeaderCircleButton
                  icon="barcode"
                  onPress={openScanner}
                  accessibilityLabel="Scan barcode to add a product"
                />
                <HeaderCircleButton
                  icon="plus"
                  onPress={() => router.push('/(edit-forms)/add-product')}
                  accessibilityLabel={t('addProductA11y')}
                />
              </View>
            )}

            {activeTab === 'suppliers' && (
              <View className="flex-row gap-2">
                <HeaderCircleButton
                  icon="plus"
                  onPress={() => router.push('/(edit-forms)/add-supplier')}
                  accessibilityLabel={t('addSupplierA11y')}
                />
              </View>
            )}
          </MotiView>

          {/* Search & Sort Row — ONLY for products and suppliers tab */}
          {(activeTab === 'products' || activeTab === 'suppliers') && (
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ type: 'timing', duration: 220, delay: 80 }}
            >
              <View className="px-5 pb-4 flex-row items-center gap-3">
                <View className="flex-1">
                  <SearchBar
                    value={search}
                    onChange={setSearch}
                    debounceMs={300}
                    placeholder={
                      activeTab === 'products'
                        ? t('searchPlaceholder')
                        : t('searchSuppliersPlaceholder')
                    }
                  />
                </View>
                {activeTab === 'products' && (
                  <>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => setShowSortModal(true)}
                      className="w-[46px] h-[46px] rounded-xl justify-center items-center bg-paper-50/15 relative active:scale-[0.94] active:opacity-80"
                      accessibilityRole="button"
                      accessibilityLabel={t('sortBy')}
                    >
                      <FontAwesome name="sort" size={18} color="#FBF7EE" />
                      {(sortBy !== 'stock' || sortDirection !== 'asc') && (
                        <View className="absolute top-2 right-2 w-2 h-2 rounded-full bg-persimmon-500" />
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() =>
                        setViewMode(viewMode === 'list' ? 'grid' : 'list')
                      }
                      className="w-[46px] h-[46px] rounded-xl justify-center items-center bg-paper-50/15 active:scale-[0.94] active:opacity-80"
                      accessibilityRole="button"
                      accessibilityLabel={
                        viewMode === 'list'
                          ? 'Switch to grid view'
                          : 'Switch to list view'
                      }
                    >
                      <FontAwesome
                        name={viewMode === 'list' ? 'th-large' : 'list'}
                        size={18}
                        color="#FBF7EE"
                      />
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </MotiView>
          )}
        </View>

        {/* Warning banner right below header */}
        {activeRecommendationsCount > 0 && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/inventory/recommendations' as Href)}
            className="mx-5 mt-4 p-3 bg-semantic-warning-50 border border-semantic-warning-100 rounded-xl flex-row items-center justify-between"
          >
            <View className="flex-row items-center gap-2">
              <FontAwesome name="exclamation-triangle" size={16} color="#C77B0E" />
              <StyledText variant="semibold" className="text-sm text-semantic-warning">
                Stock Advice ({activeRecommendationsCount})
              </StyledText>
            </View>
            <FontAwesome name="chevron-right" size={12} color="#C77B0E" />
          </TouchableOpacity>
        )}

        {/* Tab Content */}
        {activeTab === 'products' ? (
          <ProductsTab
            filterCategory={params.filterCategory}
            search={search}
            sortBy={sortBy}
            sortDirection={sortDirection}
            onClearSearch={handleClearSearch}
            onRestock={handleRestock}
            onMore={handleMore}
          />
        ) : activeTab === 'categories' ? (
          <CategoriesTab />
        ) : (
          <SuppliersTab search={search} onMore={handleSupplierMore} />
        )}

        {/* Sort Modal */}
        <SortBottomSheet
          visible={showSortModal}
          onRequestClose={() => setShowSortModal(false)}
          sortBy={sortBy}
          sortDirection={sortDirection}
          onSort={handleSort}
        />

        {/* Inventory Action Modal */}
        <InventoryActionModal
          pendingAction={pendingAction}
          initialQuantity={initialQuantity}
          onClose={() => setPendingAction(null)}
        />

        {/* Action Sheet Modal (Overflow menu) — product */}
        <ProductActionSheet
          product={selectedProductForSheet}
          onClose={() => setSelectedProductForSheet(null)}
          onSelectAction={(type) => setPendingAction({ product: selectedProductForSheet!, type })}
          onSelectDelete={() => {
            setProductToDelete(selectedProductForSheet);
            setShowDeleteModal(true);
          }}
        />

        {/* Delete Confirmation Modal */}
        <ProductDeleteModal
          product={productToDelete}
          visible={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={confirmDelete}
          isPending={deleteProductMutation.isPending}
        />

        {/* Supplier Action Sheet Modal (Overflow menu) */}
        <SupplierActionSheet
          supplier={selectedSupplierForSheet}
          onClose={() => setSelectedSupplierForSheet(null)}
          onSelectDelete={() => {
            setSupplierToDelete(selectedSupplierForSheet);
            setShowSupplierDeleteModal(true);
          }}
        />

        {/* Supplier Delete Confirmation Modal */}
        <SupplierDeleteModal
          supplier={supplierToDelete}
          visible={showSupplierDeleteModal}
          onClose={() => setShowSupplierDeleteModal(false)}
          onConfirm={() => {
            if (supplierToDelete) {
              deleteSupplierMutation.mutate(supplierToDelete.id, {
                onSuccess: () => {
                  setShowSupplierDeleteModal(false);
                  setSupplierToDelete(null);
                },
              });
            }
          }}
          isPending={deleteSupplierMutation.isPending}
        />

        <BarcodeScannerModal
          visible={isScannerOpen}
          mode="single"
          onClose={closeScanner}
          onScan={handleScannedBarcode}
        />
      </View>
    </SafeAreaView>
  );
}
