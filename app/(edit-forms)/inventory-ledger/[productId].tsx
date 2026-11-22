import { withProf } from '@/utils/perf';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { MotiView } from 'moti';
import { useTranslation } from 'react-i18next';
import { router, useLocalSearchParams } from 'expo-router';
import { StyledText } from '@/components/elements';
import { InventoryErrorState } from '@/components/inventory';
import { useGetProduct } from '@/hooks';
import { useInventoryTransactionsByProduct } from '@/hooks/useInventory';
import {
  InventoryEventType,
  InventoryTransaction,
} from '@/types/inventory.types';
import {
  LedgerEmptyState,
  LedgerHero,
  LedgerList,
  LedgerSkeleton,
  LedgerToolbar,
  LedgerTypeFilter,
  LogTransactionForm,
} from '@/components/inventory/ledger';

// Scroll distance after which the hero's product name has left the screen.
const TITLE_SWAP_OFFSET = 96;
const FAB_HEIGHT = 56;

function InventoryLedger() {
  const { t } = useTranslation('inventory');
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const parsedProductId = parseInt(productId ?? '', 10);

  const productQuery = useGetProduct(parsedProductId);
  const transactionsQuery = useInventoryTransactionsByProduct(parsedProductId);
  const insets = useSafeAreaInsets();

  const product = productQuery.data;
  const isLoading = productQuery.isLoading || transactionsQuery.isLoading;
  const isRefetching =
    productQuery.isRefetching || transactionsQuery.isRefetching;
  const error = productQuery.error ?? transactionsQuery.error;

  const transactions: InventoryTransaction[] = useMemo(
    () => transactionsQuery.data ?? [],
    [transactionsQuery.data],
  );

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedType, setSelectedType] = useState<LedgerTypeFilter>('all');
  const [formOpen, setFormOpen] = useState<boolean>(false);
  const [showTitle, setShowTitle] = useState<boolean>(false);
  const showTitleRef = useRef(false);

  const counts = useMemo<Partial<Record<InventoryEventType, number>>>(() => {
    const acc: Partial<Record<InventoryEventType, number>> = {};
    for (const tx of transactions) {
      acc[tx.type] = (acc[tx.type] ?? 0) + 1;
    }
    return acc;
  }, [transactions]);

  const unitLabel = product?.retail_unit_name || t('ledgerUnitDefault');

  const handleBack = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
    router.back();
  }, []);

  const { refetch: refetchProduct } = productQuery;
  const { refetch: refetchTransactions } = transactionsQuery;
  const handleRefresh = useCallback(() => {
    refetchProduct();
    refetchTransactions();
  }, [refetchProduct, refetchTransactions]);

  const handleOpenForm = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
    setFormOpen(true);
  }, []);

  const handleCloseForm = useCallback(() => setFormOpen(false), []);

  // Re-renders only when the threshold is crossed, not on every scroll frame.
  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const next = e.nativeEvent.contentOffset.y > TITLE_SWAP_OFFSET;
      if (next !== showTitleRef.current) {
        showTitleRef.current = next;
        setShowTitle(next);
      }
    },
    [],
  );

  const hasTransactions = transactions.length > 0;

  const listHeader = useMemo(
    () =>
      product ? (
        <View className="pt-2">
          <LedgerHero
            product={product}
            transactions={transactions}
            unitLabel={unitLabel}
          />
          {hasTransactions && (
            <LedgerToolbar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedType={selectedType}
              setSelectedType={setSelectedType}
              counts={counts}
            />
          )}
        </View>
      ) : null,
    [product, transactions, unitLabel, hasTransactions, searchQuery, selectedType, counts],
  );

  const emptyState = useMemo(
    () =>
      hasTransactions ? undefined : (
        <LedgerEmptyState onLogTransaction={handleOpenForm} />
      ),
    [hasTransactions, handleOpenForm],
  );

  if (isLoading) return <LedgerSkeleton />;

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center px-4 pt-2 pb-2 bg-background">
        <Pressable
          onPress={handleBack}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('ledgerBack')}
          className="press-scale w-11 h-11 items-center justify-center rounded-full bg-paper-50 border border-ink-100 active:bg-paper-300"
        >
          <FontAwesome name="arrow-left" size={16} color="#0E0C0A" />
        </Pressable>

        <View className="flex-1 ml-3 justify-center" style={{ minHeight: 44 }}>
          <StyledText
            variant="black"
            accessibilityRole="header"
            className="text-ink-900 text-base"
          >
            {t('ledgerTitle')}
          </StyledText>
          {product && (
            <MotiView
              animate={{ opacity: showTitle ? 1 : 0 }}
              transition={{ type: 'timing', duration: 150 }}
              importantForAccessibility="no-hide-descendants"
              accessibilityElementsHidden
            >
              <StyledText
                variant="medium"
                className="text-ink-500 text-xs"
                numberOfLines={1}
              >
                {product.name} · {product.quantity} {unitLabel}
              </StyledText>
            </MotiView>
          )}
        </View>
      </View>

      {error ? (
        <InventoryErrorState
          title={t('ledgerLoadError')}
          message={(error as Error).message ?? t('errorUnknown')}
          onRetry={handleRefresh}
        />
      ) : !product ? (
        <InventoryErrorState
          title={t('ledgerNotFoundTitle')}
          message={t('ledgerNotFoundBody')}
          onRetry={handleRefresh}
        />
      ) : (
        <LedgerList
          transactions={transactions}
          currentStock={product.quantity}
          unitLabel={unitLabel}
          searchQuery={searchQuery}
          selectedType={selectedType}
          isRefetching={isRefetching}
          onRefresh={handleRefresh}
          onScroll={handleScroll}
          bottomPadding={insets.bottom + FAB_HEIGHT + 40}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={emptyState}
        />
      )}

      {product && hasTransactions && (
        <Pressable
          onPress={handleOpenForm}
          accessibilityRole="button"
          accessibilityLabel={t('ledgerLogChange')}
          className="absolute right-4 flex-row items-center px-5 rounded-full bg-persimmon-500 active:bg-persimmon-700 shadow-persimmon-glow"
          style={({ pressed }) => ({
            bottom: insets.bottom + 16,
            height: FAB_HEIGHT,
            transform: [{ scale: pressed ? 0.97 : 1 }],
          })}
        >
          <FontAwesome name="plus" size={16} color="#FAFAF7" />
          <StyledText variant="extrabold" className="text-paper-50 text-sm ml-2">
            {t('ledgerLogChange')}
          </StyledText>
        </Pressable>
      )}

      {product && (
        <LogTransactionForm
          product={product}
          visible={formOpen}
          onClose={handleCloseForm}
        />
      )}
    </View>
  );
}

export default withProf(InventoryLedger, 'inventory-ledger/[productId]');
