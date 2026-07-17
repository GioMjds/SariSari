import { useCallback, useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  Alert,
  Pressable,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { StyledText } from '@/components/elements';
import { useGetProduct, useGetSupplier, useProducts } from '@/hooks';
import { useInventoryTransactionsByProduct } from '@/hooks/useInventory';
import {
  ProductDetailsHero,
  ProductDetailsTabs,
  ProductHistoryTab,
  ProductOverviewTab,
  ProductSupplierTab,
  type ProductDetailTab,
} from '@/components/inventory/products/details';
import { InventoryActionModal } from '@/components/inventory/InventoryActionModal';
import { Product } from '@/types/products.types';
import { InventoryEventType } from '@/types/inventory.types';

const SCROLL_CONTENT_STYLE = { paddingBottom: 110 } as const;

export default function ProductDetailsPage() {
  const rawId = useLocalSearchParams<{ id: string | string[] }>().id;
  const parsedProductId = parseInt(
    Array.isArray(rawId) ? (rawId[0] ?? '') : (rawId ?? ''),
    10,
  );
  const queryClient = useQueryClient();

  const { deleteProductMutation } = useProducts();
  const productQuery = useGetProduct(parsedProductId);
  const transactionsQuery = useInventoryTransactionsByProduct(parsedProductId);

  const product = productQuery.data;
  const supplierQuery = useGetSupplier(product?.supplier_id ?? '');

  const [activeTab, setActiveTab] = useState<ProductDetailTab>('overview');
  const [pendingAction, setPendingAction] = useState<{
    product: Product;
    type: InventoryEventType;
  } | null>(null);

  const handleBack = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
    router.back();
  }, []);

  const handleEdit = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
    if (product) {
      router.push(`/(edit-forms)/edit-product/${product.id}`);
    }
  }, [product]);

  const handleDelete = useCallback(() => {
    if (!product) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${product.name}"? This action cannot be undone and will delete all transaction history for this item.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProductMutation.mutateAsync(product.id);
              router.back();
            } catch (err) {
              console.error('Failed to delete product:', err);
            }
          },
        },
      ],
    );
  }, [product, deleteProductMutation]);

  const handleTabChange = useCallback((next: ProductDetailTab) => {
    Haptics.selectionAsync().catch(() => {});
    setActiveTab(next);
  }, []);

  const handleRefresh = useCallback(() => {
    productQuery.refetch();
    transactionsQuery.refetch();
    queryClient.invalidateQueries({ queryKey: ['suppliers'] });
  }, [productQuery, transactionsQuery, queryClient]);

  const handleRestock = useCallback(
    () => product && setPendingAction({ product, type: 'restock' }),
    [product],
  );
  const handleAdjust = useCallback(
    () => product && setPendingAction({ product, type: 'adjustment' }),
    [product],
  );
  const handleDamaged = useCallback(
    () => product && setPendingAction({ product, type: 'damaged' }),
    [product],
  );
  const handleModalClose = useCallback(() => setPendingAction(null), []);

  const tabCounts = useMemo<Partial<Record<ProductDetailTab, number>>>(
    () => ({
      history: transactionsQuery.data?.length ?? 0,
    }),
    [transactionsQuery.data],
  );

  // ─── Loading state ─────────────────────────────────────────────
  if (productQuery.isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <View className="flex-row items-center px-5 pt-3 pb-2">
          <Pressable
            onPress={handleBack}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            className="press-scale w-10 h-10 items-center justify-center rounded-full bg-paper-50 shadow-paper border border-ink-100 active:opacity-70"
          >
            <FontAwesome name="arrow-left" size={16} color="#0E0C0A" />
          </Pressable>
        </View>
        <View className="flex-1 justify-center items-center">
          <View
            className="w-12 h-12 rounded-full border-2 border-ink-200"
            style={{ borderTopColor: '#E85A1F' }}
          />
          <StyledText variant="medium" className="text-ink-500 mt-4 label-caps">
            Loading product…
          </StyledText>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Not-found state ───────────────────────────────────────────
  if (!product) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <View className="flex-row items-center px-5 pt-3 pb-2">
          <Pressable
            onPress={handleBack}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            className="press-scale w-10 h-10 items-center justify-center rounded-full bg-paper-50 shadow-paper border border-ink-100 active:opacity-70"
          >
            <FontAwesome name="arrow-left" size={16} color="#0E0C0A" />
          </Pressable>
        </View>
        <View className="flex-1 justify-center items-center px-6">
          <View className="bg-paper-50 rounded-2xl p-5 border border-ink-100 items-center shadow-paper">
            <View className="w-14 h-14 rounded-full bg-paper-100 border border-ink-200 items-center justify-center">
              <Ionicons name="cube-outline" size={28} color="#A89F90" />
            </View>
            <StyledText
              variant="black"
              className="text-ink-900 text-xl mt-3 text-center"
            >
              Product Not Found
            </StyledText>
            <StyledText
              variant="regular"
              className="text-ink-500 text-sm mt-1 text-center"
            >
              This product may have been deleted on another device.
            </StyledText>
            <Pressable
              onPress={handleBack}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              className="mt-5 bg-persimmon-500 rounded-pill px-6 py-3 active:opacity-80"
              style={{
                shadowColor: '#E85A1F',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.22,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              <StyledText variant="extrabold" className="text-paper-50 text-sm">
                Go Back
              </StyledText>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Main screen ───────────────────────────────────────────────
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* ── Slim 3-slot top bar ─────────────────────────────── */}
      <View className="flex-row items-center justify-between px-5 pt-3 pb-2">
        <Pressable
          onPress={handleBack}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="press-scale w-10 h-10 items-center justify-center rounded-full bg-paper-50 shadow-paper border border-ink-100 active:opacity-70"
        >
          <FontAwesome name="arrow-left" size={16} color="#0E0C0A" />
        </Pressable>

        <StyledText variant="extrabold" className="label-caps text-ink-400">
          Product Profile
        </StyledText>

        <Pressable
          onPress={handleDelete}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Delete product"
          className="press-scale w-10 h-10 items-center justify-center rounded-full bg-paper-50 shadow-paper border border-ink-100 active:opacity-70"
        >
          <FontAwesome name="trash" size={14} color="#C13030" />
        </Pressable>
      </View>

      {/* ── Scrollable body (hero + tabs + content) ──────────── */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={SCROLL_CONTENT_STYLE}
        refreshControl={
          <RefreshControl
            refreshing={productQuery.isRefetching}
            onRefresh={handleRefresh}
            tintColor="#623418"
            colors={['#E85A1F']}
          />
        }
      >
        {/* ── Receipt-style hero ────────────────────────────── */}
        <ProductDetailsHero product={product} />

        {/* ── Segmented control ─────────────────────────────── */}
        <View className="px-4 mt-4">
          <ProductDetailsTabs
            activeTab={activeTab}
            onChange={handleTabChange}
            counts={tabCounts}
          />
        </View>

        {/* ── Tab content ────────────────────────────────────── */}
        <View className="mt-4">
          {activeTab === 'overview' && (
            <ProductOverviewTab
              product={product}
              onEdit={handleEdit}
              onRestock={handleRestock}
              onAdjust={handleAdjust}
              onDamaged={handleDamaged}
              onDelete={handleDelete}
            />
          )}

          {activeTab === 'history' && (
            <ProductHistoryTab
              transactions={transactionsQuery.data ?? []}
              isLoading={transactionsQuery.isLoading}
              currentStock={product.quantity}
            />
          )}

          {activeTab === 'supplier' && (
            <ProductSupplierTab
              supplier={supplierQuery.data ?? null}
              isLoading={supplierQuery.isLoading && !!product.supplier_id}
              onLinkSupplier={handleEdit}
            />
          )}
        </View>
      </ScrollView>

      {/* ── Action Modals ──────────────────────────────────── */}
      {pendingAction && (
        <InventoryActionModal
          pendingAction={pendingAction}
          onClose={handleModalClose}
        />
      )}
    </SafeAreaView>
  );
}
