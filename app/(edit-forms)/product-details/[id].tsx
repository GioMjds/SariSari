import { withProf } from '@/utils/perf';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Href, router, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { useGetProduct, useGetSupplier, useProducts } from '@/hooks';
import { useInventoryTransactionsByProduct } from '@/hooks/useInventory';
import { useOwnerPinGuard } from '@/hooks/useOwnerPinGuard';
import { Modal } from '@/components/ui';
import { InventoryErrorState } from '@/components/inventory';
import { LogTransactionForm } from '@/components/inventory/ledger';
import { buildLedgerRows } from '@/components/inventory/ledger/ledgerMath';
import type {
  InventoryEventType,
  InventoryTransaction,
} from '@/types/inventory.types';
import {
  computeProductInsights,
  ProductActionBar,
  ProductDetailsHero,
  ProductDetailsSkeleton,
  ProductDetailsTabs,
  ProductMovementsTab,
  ProductOverviewTab,
  ProductPricingTab,
  ProductSupplierTab,
  type ProductDetailTab,
} from '@/components/inventory/products/details';

// Tablets and landscape get one centered column instead of a stretched phone layout.
const MAX_CONTENT_WIDTH = 640;
const FRAME_STYLE = {
  width: '100%',
  maxWidth: MAX_CONTENT_WIDTH,
  alignSelf: 'center',
} as const;
const SCROLL_CONTENT_STYLE = {
  ...FRAME_STYLE,
  paddingTop: 8,
  paddingBottom: 24,
} as const;
// Scroll distance after which the hero's product name has left the screen.
const TITLE_SWAP_OFFSET = 96;
const EMPTY_TRANSACTIONS: InventoryTransaction[] = [];

const tapHaptic = () => Haptics.selectionAsync().catch(() => {});

function ProductDetailsPage() {
  const { t } = useTranslation('inventory');
  const insets = useSafeAreaInsets();
  const rawId = useLocalSearchParams<{ id: string | string[] }>().id;
  const parsedProductId = parseInt(
    Array.isArray(rawId) ? (rawId[0] ?? '') : (rawId ?? ''),
    10,
  );
  const queryClient = useQueryClient();
  const { runWithPinGuard } = useOwnerPinGuard();

  const productQuery = useGetProduct(parsedProductId);
  const transactionsQuery = useInventoryTransactionsByProduct(parsedProductId);
  const product = productQuery.data;
  const supplierQuery = useGetSupplier(product?.supplier_id ?? '');
  const { deleteProductMutation } = useProducts();

  const [activeTab, setActiveTab] = useState<ProductDetailTab>('overview');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  // Type outlives the open flag so the sheet keeps its title while sliding out.
  const [logFormType, setLogFormType] = useState<InventoryEventType>('restock');
  const [logFormOpen, setLogFormOpen] = useState(false);
  const [showTitle, setShowTitle] = useState(false);
  const showTitleRef = useRef(false);
  const scrollRef = useRef<ScrollView>(null);
  const scrollYRef = useRef(0);
  const tabsYRef = useRef(0);

  const transactions = transactionsQuery.data ?? EMPTY_TRANSACTIONS;
  const quantity = product?.quantity ?? 0;
  const unitLabel = product?.retail_unit_name || t('ledgerUnitDefault');

  const rows = useMemo(
    () => buildLedgerRows(transactions, quantity),
    [transactions, quantity],
  );
  const insights = useMemo(
    () => computeProductInsights(transactions, quantity),
    [transactions, quantity],
  );
  const tabCounts = useMemo(() => ({ movements: rows.length }), [rows.length]);

  const handleBack = useCallback(() => {
    tapHaptic();
    router.back();
  }, []);

  const productId = product?.id;
  const handleEdit = useCallback(() => {
    tapHaptic();
    if (productId != null)
      router.push(`/(edit-forms)/edit-product/${productId}` as Href);
  }, [productId]);

  const handleOpenLedger = useCallback(() => {
    tapHaptic();
    if (productId != null)
      router.push(`/(edit-forms)/inventory-ledger/${productId}` as Href);
  }, [productId]);

  const openLogForm = useCallback((type: InventoryEventType) => {
    tapHaptic();
    setLogFormType(type);
    setLogFormOpen(true);
  }, []);
  const handleRestock = useCallback(
    () => openLogForm('restock'),
    [openLogForm],
  );
  const handleAdjust = useCallback(
    () => openLogForm('adjustment'),
    [openLogForm],
  );
  const handleDamaged = useCallback(
    () => openLogForm('damaged'),
    [openLogForm],
  );
  const handleCloseLogForm = useCallback(() => setLogFormOpen(false), []);

  const { refetch: refetchProduct } = productQuery;
  const { refetch: refetchTransactions } = transactionsQuery;
  const handleLogSuccess = useCallback(() => {
    setLogFormOpen(false);
    refetchProduct();
    refetchTransactions();
  }, [refetchProduct, refetchTransactions]);

  const handleRefresh = useCallback(() => {
    refetchProduct();
    refetchTransactions();
    queryClient.invalidateQueries({ queryKey: ['suppliers'] });
  }, [refetchProduct, refetchTransactions, queryClient]);

  const handleTabChange = useCallback((next: ProductDetailTab) => {
    tapHaptic();
    setActiveTab(next);
  }, []);

  // Bring the tab strip back into view when the jump starts from further down the page.
  const handleSeeAllMovements = useCallback(() => {
    handleTabChange('movements');
    if (scrollYRef.current > tabsYRef.current) {
      scrollRef.current?.scrollTo({
        y: Math.max(0, tabsYRef.current - 8),
        animated: true,
      });
    }
  }, [handleTabChange]);

  const handleTabsLayout = useCallback((e: LayoutChangeEvent) => {
    tabsYRef.current = e.nativeEvent.layout.y;
  }, []);

  const handleDelete = useCallback(() => setDeleteModalOpen(true), []);
  const handleCloseDelete = useCallback(() => setDeleteModalOpen(false), []);

  const handleConfirmDelete = useCallback(async () => {
    if (!product) return;
    setDeleteModalOpen(false);
    await runWithPinGuard({
      actionId: 'product_delete',
      title: t('logPinTitle'),
      actionDescription: t('details_deletePinBody', { name: product.name }),
      onApproved: async () => {
        try {
          await deleteProductMutation.mutateAsync(product.id);
          router.back();
        } catch {
          // The mutation's own error handler already shows the toast.
        }
      },
    });
  }, [product, runWithPinGuard, deleteProductMutation, t]);

  // Re-renders only when the threshold is crossed, not on every scroll frame.
  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollYRef.current = e.nativeEvent.contentOffset.y;
      const next = scrollYRef.current > TITLE_SWAP_OFFSET;
      if (next !== showTitleRef.current) {
        showTitleRef.current = next;
        setShowTitle(next);
      }
    },
    [],
  );

  const hasProduct = !!product;
  const topBar = (
    <View
      className="flex-row items-center justify-between px-4 pt-2 pb-2"
      style={FRAME_STYLE}
    >
      <IconButton
        icon="arrow-back"
        label={t('ledgerBack')}
        onPress={handleBack}
      />
      <StyledText
        variant="extrabold"
        accessibilityRole="header"
        className="flex-1 mx-3 text-center text-ink-900 text-base"
        numberOfLines={1}
      >
        {showTitle && product ? product.name : t('details_title')}
      </StyledText>
      {hasProduct ? (
        <IconButton
          icon="create-outline"
          label={t('details_edit')}
          onPress={handleEdit}
        />
      ) : (
        <View className="w-11 h-11" />
      )}
    </View>
  );

  let body: React.ReactNode;
  if (productQuery.isLoading) {
    body = <ProductDetailsSkeleton />;
  } else if (productQuery.error) {
    body = (
      <InventoryErrorState
        title={t('details_loadErrorTitle')}
        message={t('details_loadErrorBody')}
        onRetry={refetchProduct}
      />
    );
  } else if (!product) {
    body = (
      <View className="flex-1 justify-center items-center px-6">
        <View className="w-full bg-paper-50 rounded-2xl p-6 border border-ink-100 items-center">
          <View className="w-14 h-14 rounded-full bg-paper-100 items-center justify-center">
            <Ionicons name="cube-outline" size={28} className="text-ink-400" />
          </View>
          <StyledText
            variant="black"
            className="text-ink-900 text-xl mt-3 text-center"
          >
            {t('details_notFoundTitle')}
          </StyledText>
          <StyledText
            variant="regular"
            className="text-ink-600 text-sm mt-1 text-center"
          >
            {t('details_notFoundBody')}
          </StyledText>
          <Pressable
            onPress={handleBack}
            accessibilityRole="button"
            className="mt-5 min-h-[48px] bg-persimmon-500 rounded-xl px-6 items-center justify-center active:bg-persimmon-700"
          >
            <StyledText variant="extrabold" className="text-paper-50 text-sm">
              {t('ledgerBack')}
            </StyledText>
          </Pressable>
        </View>
      </View>
    );
  } else {
    body = (
      <ScrollView
        ref={scrollRef}
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={SCROLL_CONTENT_STYLE}
        onScroll={handleScroll}
        scrollEventThrottle={32}
        refreshControl={
          <RefreshControl
            refreshing={
              productQuery.isRefetching || transactionsQuery.isRefetching
            }
            onRefresh={handleRefresh}
            tintColor="#E85A1F"
            colors={['#E85A1F']}
          />
        }
      >
        <ProductDetailsHero
          product={product}
          insights={insights}
          unitLabel={unitLabel}
        />

        <View className="px-4 mt-5" onLayout={handleTabsLayout}>
          <ProductDetailsTabs
            activeTab={activeTab}
            onChange={handleTabChange}
            counts={tabCounts}
          />
        </View>

        <View className="mt-4">
          {activeTab === 'overview' && (
            <ProductOverviewTab
              product={product}
              rows={rows}
              unitLabel={unitLabel}
              onEdit={handleEdit}
              onSeeAllMovements={handleSeeAllMovements}
              onDelete={handleDelete}
            />
          )}
          {activeTab === 'movements' && (
            <ProductMovementsTab
              rows={rows}
              isLoading={transactionsQuery.isLoading}
              unitLabel={unitLabel}
              onOpenLedger={handleOpenLedger}
              onRestock={handleRestock}
            />
          )}
          {activeTab === 'pricing' && (
            <ProductPricingTab
              product={product}
              insights={insights}
              unitLabel={unitLabel}
            />
          )}
          {activeTab === 'supplier' && (
            <ProductSupplierTab
              supplier={supplierQuery.data ?? null}
              isLoading={supplierQuery.isLoading && !!product.supplier_id}
              insights={insights}
              unitLabel={unitLabel}
              onLinkSupplier={handleEdit}
            />
          )}
        </View>
      </ScrollView>
    );
  }

  return (
    <View
      className="flex-1 bg-background"
      style={{
        paddingTop: insets.top,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }}
    >
      {topBar}
      {body}

      {product && (
        <>
          <View
            className="bg-paper-50 border-t border-ink-100"
            style={{ paddingBottom: insets.bottom }}
          >
            <View style={FRAME_STYLE}>
              <ProductActionBar
                onRestock={handleRestock}
                onAdjust={handleAdjust}
                onDamaged={handleDamaged}
              />
            </View>
          </View>

          <LogTransactionForm
            product={product}
            initialType={logFormType}
            visible={logFormOpen}
            onClose={handleCloseLogForm}
            onSuccess={handleLogSuccess}
          />

          <Modal
            visible={deleteModalOpen}
            onClose={handleCloseDelete}
            variant="danger"
            mascot="delete"
            title={t('deleteTitle')}
            description={`${t('deleteBody', { name: product.name })}\n${t('deleteWarning')}`}
            buttons={[
              {
                text: t('cancel'),
                style: 'cancel',
                onPress: handleCloseDelete,
              },
              {
                text: t('deleteConfirm'),
                style: 'destructive',
                onPress: handleConfirmDelete,
              },
            ]}
            loading={deleteProductMutation.isPending}
          />
        </>
      )}
    </View>
  );
}

function IconButton({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      className="w-11 h-11 items-center justify-center rounded-full bg-paper-100 border border-ink-100 active:opacity-70"
    >
      <Ionicons name={icon} size={20} className="text-ink-900" />
    </Pressable>
  );
}

export default withProf(ProductDetailsPage, 'product-details/[id]');
