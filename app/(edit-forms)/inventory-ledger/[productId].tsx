import { useCallback, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { StyledText } from '@/components/elements';
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

export default function InventoryLedger() {
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const parsedProductId = parseInt(productId ?? '', 10);

  const productQuery = useGetProduct(parsedProductId);
  const transactionsQuery = useInventoryTransactionsByProduct(parsedProductId);
  const insets = useSafeAreaInsets();

  const product = productQuery.data;
  const isLoading = productQuery.isLoading || transactionsQuery.isLoading;
  const isRefetching =
    productQuery.isRefetching || transactionsQuery.isRefetching;

  const transactions: InventoryTransaction[] = useMemo(
    () => transactionsQuery.data ?? [],
    [transactionsQuery.data],
  );

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedType, setSelectedType] = useState<LedgerTypeFilter>('all');

  const counts = useMemo<Partial<Record<InventoryEventType, number>>>(() => {
    const acc: Partial<Record<InventoryEventType, number>> = {};
    for (const tx of transactions) {
      acc[tx.type] = (acc[tx.type] ?? 0) + 1;
    }
    return acc;
  }, [transactions]);

  const [formOpen, setFormOpen] = useState<boolean>(false);

  const handleBack = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
    router.back();
  }, []);

  const handleRefresh = useCallback(() => {
    productQuery.refetch();
    transactionsQuery.refetch();
  }, [productQuery, transactionsQuery]);

  const handleOpenForm = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
    setFormOpen(true);
  }, []);

  if (isLoading) return <LedgerSkeleton />;

  const hasTransactions = transactions.length > 0;

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* ─── Slim top bar ───────────────────────────────────────── */}
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

        <View className="flex-1 ml-3">
          <StyledText variant="extrabold" className="label-caps text-ink-400">
            Inventory Ledger
          </StyledText>
          {product && (
            <StyledText
              variant="black"
              className="text-ink-900 text-base mt-0.5"
              numberOfLines={1}
            >
              {product.name}
            </StyledText>
          )}
        </View>
      </View>

      {/* ─── Body ───────────────────────────────────────────────── */}
      {!product ? null : !hasTransactions ? (
        <LedgerEmptyState
          currentStock={product.quantity}
          currentStockLabel="pcs on hand"
        />
      ) : (
        <LedgerList
          transactions={transactions}
          currentStock={product.quantity}
          searchQuery={searchQuery}
          selectedType={selectedType}
          isRefetching={isRefetching}
          onRefresh={handleRefresh}
          ListHeaderComponent={
            <View>
              {/* Hero — receipt-style summary card */}
              <View className="px-4">
                <LedgerHero
                  product={product}
                  transactions={transactions}
                  onLogTransaction={handleOpenForm}
                />
              </View>

              {/* Toolbar — search + filter chips */}
              <LedgerToolbar
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                selectedType={selectedType}
                setSelectedType={setSelectedType}
                counts={counts}
              />
            </View>
          }
        />
      )}

      {/* ─── FAB ────────────────────────────────────────────────── */}
      {product && (
        <Pressable
          onPress={handleOpenForm}
          accessibilityRole="button"
          accessibilityLabel="Log a new transaction"
          className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-persimmon-500 items-center justify-center shadow-persimmon-glow active:opacity-90"
          style={({ pressed }) => ({
            transform: [{ scale: pressed ? 0.96 : 1 }],
          })}
        >
          <FontAwesome name="plus" size={22} color="#FBF7EE" />
        </Pressable>
      )}

      {/* ─── Log-transaction sheet ───────────────────────────────── */}
      {product && (
        <LogTransactionForm
          product={product}
          visible={formOpen}
          onClose={() => setFormOpen(false)}
        />
      )}
    </View>
  );
}
