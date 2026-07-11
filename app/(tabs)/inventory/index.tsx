import { StyledText } from '@/components/elements';
import { InventoryActionModal } from '@/components/inventory/InventoryActionModal';
import { ProductsTab } from '@/components/inventory/products';
import { CategoriesTab } from '@/components/inventory/category';
import { SuppliersTab } from '@/components/inventory/suppliers/SuppliersTab';
import { BarcodeScannerModal, SearchBar } from '@/components/ui';
import { LOW_STOCK_THRESHOLD, SortOption, sortOption } from '@/constants';
import { useCategories, useProducts, useSuppliers } from '@/hooks';
import { Product, Supplier } from '@/types';
import { InventoryEventType } from '@/types/inventory.types';
import { useInventoryViewStore } from '@/stores';
import { FontAwesome } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { useTranslation } from 'react-i18next';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type TabType = 'products' | 'categories' | 'suppliers';
type SortDirection = 'asc' | 'desc';

type PendingAction = { product: Product; type: InventoryEventType };

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

  console.log(`Active tab: ${activeTab}`);

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
              <View className="flex-row gap-2">
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={openScanner}
                  accessibilityRole="button"
                  accessibilityLabel="Scan barcode to add a product"
                  className="w-11 h-11 rounded-full items-center justify-center bg-paper-50/15 active:scale-[0.96] transition-transform"
                >
                  <FontAwesome name="barcode" size={18} color="#FBF7EE" />
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => router.push('/(edit-forms)/add-product')}
                  accessibilityRole="button"
                  accessibilityLabel={t('addProductA11y')}
                  className="w-11 h-11 rounded-full items-center justify-center bg-paper-50/15 active:scale-[0.96] transition-transform"
                >
                  <FontAwesome name="plus" size={18} color="#FBF7EE" />
                </TouchableOpacity>
              </View>
            )}

            {activeTab === 'suppliers' && (
              <View className="flex-row gap-2">
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => router.push('/(edit-forms)/add-supplier')}
                  accessibilityRole="button"
                  accessibilityLabel={t('addSupplierA11y')}
                  className="w-11 h-11 rounded-full items-center justify-center bg-paper-50/15 active:scale-[0.96] transition-transform"
                >
                  <FontAwesome name="plus" size={18} color="#FBF7EE" />
                </TouchableOpacity>
              </View>
            )}
          </MotiView>

          {/* Search & Sort Row (Z3a) — ONLY for products and suppliers tab */}
          {(activeTab === 'products' || activeTab === 'suppliers') && (
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
                      className="w-[46px] h-[46px] rounded-xl justify-center items-center bg-paper-50/15 relative active:scale-[0.96] transition-transform"
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
                      className="w-[46px] h-[46px] rounded-xl justify-center items-center bg-paper-50/15 active:scale-[0.96] transition-transform"
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
                {t('sortBy')}
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
                      {t(
                        `sort${
                          option.key.charAt(0).toUpperCase() +
                          option.key.slice(1)
                        }`,
                      )}
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
                hitSlop={8}
                className="bg-ink-100 rounded-xl py-3 mt-4 active:opacity-70 active:scale-[0.98] transition-transform"
              >
                <StyledText
                  variant="semibold"
                  className="text-ink-700 text-center text-base"
                >
                  {t('common:close')}
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
                  {t('actionSheetSubtitle')}
                </StyledText>
              </View>

              <View className="gap-2">
                {/* Action: Mark Damaged */}
                <TouchableOpacity
                  onPress={() => {
                    const product = selectedProductForSheet!;
                    setSelectedProductForSheet(null);
                    setPendingAction({ product, type: 'damaged' });
                  }}
                  className="flex-row items-center py-4 px-4 bg-paper-100 rounded-xl border border-ink-100 active:scale-[0.98] transition-transform active:opacity-85"
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
                    {t('actionMarkDamaged')}
                  </StyledText>
                </TouchableOpacity>

                {/* Action: Adjust Stock */}
                <TouchableOpacity
                  onPress={() => {
                    const product = selectedProductForSheet!;
                    setSelectedProductForSheet(null);
                    setPendingAction({ product, type: 'adjustment' });
                  }}
                  className="flex-row items-center py-4 px-4 bg-paper-100 rounded-xl border border-ink-100 active:scale-[0.98] transition-transform active:opacity-85"
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
                    {t('actionAdjustStock')}
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
                  className="flex-row items-center py-4 px-4 bg-paper-100 rounded-xl border border-ink-100 active:scale-[0.98] transition-transform active:opacity-85"
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
                    {t('actionViewLedger')}
                  </StyledText>
                </TouchableOpacity>

                {/* Divider */}
                <View className="h-[1px] bg-ink-100 my-2" />

                {/* Action: Edit Product */}
                <TouchableOpacity
                  onPress={() => {
                    const product = selectedProductForSheet!;
                    router.push(`/(edit-forms)/edit-product/${product.id}`);
                    setSelectedProductForSheet(null);
                  }}
                  className="flex-row items-center py-4 px-4 bg-paper-100 rounded-xl border border-red-200 active:scale-[0.98] transition-transform active:opacity-85"
                >
                  <FontAwesome
                    name="pencil"
                    size={18}
                    color="#C22D2D"
                    className="mr-3 w-6 text-center"
                  />
                  <StyledText
                    variant="extrabold"
                    className="text-cinnamon-500 text-base"
                  >
                    {t('actionEditProduct')}
                  </StyledText>
                </TouchableOpacity>

                {/* Action: Delete Product */}
                <TouchableOpacity
                  onPress={() => {
                    const product = selectedProductForSheet!;
                    setSelectedProductForSheet(null);
                    setProductToDelete(product);
                    setShowDeleteModal(true);
                  }}
                  className="flex-row items-center py-4 px-4 bg-red-50 rounded-xl border border-red-200 active:scale-[0.98] transition-transform active:opacity-85"
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
                    {t('actionDeleteProduct')}
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
                  {t('deleteTitle')}
                </StyledText>
                <StyledText
                  variant="regular"
                  className="text-ink-500 text-sm text-center"
                >
                  {t('deleteBody', {
                    name: productToDelete?.name || '',
                  })}
                </StyledText>
                <StyledText
                  variant="semibold"
                  className="text-semantic-danger text-sm mt-2 text-center"
                >
                  {t('deleteWarning')}
                </StyledText>
              </View>
              <View className="gap-3">
                <TouchableOpacity
                  onPress={confirmDelete}
                  disabled={deleteProductMutation.isPending}
                  className="bg-semantic-danger rounded-xl py-3 active:opacity-70 active:scale-[0.98] transition-transform"
                >
                  {deleteProductMutation.isPending ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <StyledText
                      variant="extrabold"
                      className="text-white text-center text-base"
                    >
                      {t('deleteConfirm')}
                    </StyledText>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowDeleteModal(false)}
                  className="bg-ink-100 rounded-xl py-3 active:opacity-70 active:scale-[0.98] transition-transform"
                >
                  <StyledText
                    variant="semibold"
                    className="text-ink-700 text-center text-base"
                  >
                    {t('common:cancel')}
                  </StyledText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Supplier Action Sheet Modal (Overflow menu) */}
        <Modal
          visible={!!selectedSupplierForSheet}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedSupplierForSheet(null)}
          statusBarTranslucent
        >
          <Pressable
            className="flex-1 justify-end"
            onPress={() => setSelectedSupplierForSheet(null)}
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
                  {selectedSupplierForSheet?.name}
                </StyledText>
                <StyledText
                  variant="regular"
                  className="text-ink-500 text-xs text-center mt-1"
                >
                  {t('actionSheetSubtitle')}
                </StyledText>
              </View>

              <View className="gap-2">
                {/* Action: Edit Supplier */}
                <TouchableOpacity
                  onPress={() => {
                    const supplier = selectedSupplierForSheet!;
                    router.push(`/(edit-forms)/edit-supplier/${supplier.id}`);
                    setSelectedSupplierForSheet(null);
                  }}
                  className="flex-row items-center py-4 px-4 bg-paper-100 rounded-xl border border-ink-100 active:scale-[0.98] transition-transform active:opacity-85"
                >
                  <FontAwesome
                    name="pencil"
                    size={18}
                    color="#E85A1F"
                    className="mr-3 w-6 text-center"
                  />
                  <StyledText
                    variant="extrabold"
                    className="text-cinnamon-500 text-base"
                  >
                    {t('actionEditSupplier')}
                  </StyledText>
                </TouchableOpacity>

                {/* Action: Delete Supplier */}
                <TouchableOpacity
                  onPress={() => {
                    const supplier = selectedSupplierForSheet!;
                    setSelectedSupplierForSheet(null);
                    setSupplierToDelete(supplier);
                    setShowSupplierDeleteModal(true);
                  }}
                  className="flex-row items-center py-4 px-4 bg-red-50 rounded-xl border border-red-200 active:scale-[0.98] transition-transform active:opacity-85"
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
                    {t('actionDeleteSupplier')}
                  </StyledText>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </Modal>

        {/* Supplier Delete Confirmation Modal */}
        <Modal
          visible={showSupplierDeleteModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowSupplierDeleteModal(false)}
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
                  {t('deleteSupplierTitle')}
                </StyledText>
                <StyledText
                  variant="regular"
                  className="text-ink-500 text-sm text-center"
                >
                  {t('deleteSupplierBody', {
                    name: supplierToDelete?.name || '',
                  })}
                </StyledText>
                <StyledText
                  variant="semibold"
                  className="text-semantic-danger text-sm mt-2 text-center"
                >
                  {t('deleteSupplierWarning')}
                </StyledText>
              </View>
              <View className="gap-3">
                <TouchableOpacity
                  onPress={() => {
                    if (supplierToDelete) {
                      deleteSupplierMutation.mutate(supplierToDelete.id, {
                        onSuccess: () => {
                          setShowSupplierDeleteModal(false);
                          setSupplierToDelete(null);
                        },
                      });
                    }
                  }}
                  disabled={deleteSupplierMutation.isPending}
                  className="bg-semantic-danger rounded-xl py-3 active:opacity-70 active:scale-[0.98] transition-transform"
                >
                  {deleteSupplierMutation.isPending ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <StyledText
                      variant="extrabold"
                      className="text-white text-center text-base"
                    >
                      {t('deleteSupplierConfirm')}
                    </StyledText>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowSupplierDeleteModal(false)}
                  className="bg-ink-100 rounded-xl py-3 active:opacity-70 active:scale-[0.98] transition-transform"
                >
                  <StyledText
                    variant="semibold"
                    className="text-ink-700 text-center text-base"
                  >
                    {t('common:cancel')}
                  </StyledText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Barcode scanner — opens from the inventory header. Single
          mode closes after one accepted scan, then routes into the
          Add Product form with the scanned value as a prefill param. */}
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
