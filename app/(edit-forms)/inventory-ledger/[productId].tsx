import { useCallback, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { StyledText } from '@/components/elements';
import { useProducts } from '@/hooks';
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

/**
 * Inventory Ledger — the per-product transaction history screen.
 *
 * Layout (top → bottom):
 *   1. Slim white top bar (back button + eyebrow + product name).
 *   2. `LedgerHero` — receipt-style hero with the product's current
 *      stock (big tabular number), 30-day movement totals, and a
 *      "Log Transaction" CTA.
 *   3. `LedgerToolbar` — search input + type-filter chips, both
 *      wrapped in a single control surface.
 *   4. `LedgerList` — animated timeline of transactions, day-grouped
 *      with running-balance pills on every row.
 *   5. FAB (bottom-right) — opens `LogTransactionForm` so the owner
 *      can restock / record a sale / mark damaged / adjust stock
 *      without scrolling.
 *
 * The screen is the orchestrator: it owns data fetching via hooks
 * (products + inventory), the page-level refresh control, the
 * filter/search state, and the form's open/close state. All visual
 * rendering is delegated to the presentation sub-components under
 * `components/inventory/ledger/`.
 */
export default function InventoryLedger() {
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const parsedProductId = parseInt(productId ?? '', 10);

  const { useGetProduct } = useProducts();
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

  // ─── Filter state (shared by toolbar + list) ───────────────────
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedType, setSelectedType] = useState<LedgerTypeFilter>('all');

  // Per-type totals used to render the chip count badges.
  // Computed once per `transactions` change so the toolbar and the
  // hero stats grid can't drift.
  const counts = useMemo<Partial<Record<InventoryEventType, number>>>(() => {
    const acc: Partial<Record<InventoryEventType, number>> = {};
    for (const tx of transactions) {
      acc[tx.type] = (acc[tx.type] ?? 0) + 1;
    }
    return acc;
  }, [transactions]);

  // ─── Form open state ────────────────────────────────────────────
  const [formOpen, setFormOpen] = useState<boolean>(false);

  // ─── Handlers ───────────────────────────────────────────────────
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

  if (isLoading) {
    return <LedgerSkeleton />;
  }

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
