import { withProf } from '@/utils/perf';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  useInventoryTransactionTypeCounts,
  usePaginatedInventoryTransactions,
} from '@/hooks/useInventory';
import {
  LedgerList,
  LedgerNoMatches,
  LedgerRowsSkeleton,
  LedgerToolbar,
  MovementsGuide,
  type LedgerTypeFilter,
} from '@/components/inventory/ledger';
import { useFabClearance } from '@/components/inventory/InventorySpeedDialFab';
import { MovementEmptyState } from '@/components/inventory/movements';
import { InventoryErrorState } from '@/components/inventory';
import { useStockSheetSignal } from '@/stores';
import type { InventoryEventType } from '@/types';

const EMPTY_COUNTS: Partial<Record<InventoryEventType, number>> = {};
// The guide lives in the list header so it scrolls away and leaves room for rows.
const LIST_HEADER = <MovementsGuide />;
// Caps line length on tablets, matching the product form width.
const CONTENT_CLASS = 'flex-1 w-full max-w-[640px] self-center';

function MovementsScreen() {
  const { t } = useTranslation('inventory');
  const router = useRouter();
  const fabClearance = useFabClearance();
  const { q } = useLocalSearchParams<{ q?: string }>();
  const signal = useStockSheetSignal();

  const searchQuery = (q ?? '').trim();
  const [selectedType, setSelectedType] = useState<LedgerTypeFilter>('all');
  const hasFilters = searchQuery !== '' || selectedType !== 'all';

  const txQuery = usePaginatedInventoryTransactions(searchQuery, selectedType);
  const countsQuery = useInventoryTransactionTypeCounts(searchQuery);
  const counts = countsQuery.data ?? EMPTY_COUNTS;
  const { fetchNextPage, refetch, error } = txQuery;
  const refetchCounts = countsQuery.refetch;

  const transactions = useMemo(
    () => txQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [txQuery.data],
  );

  useEffect(() => {
    if (error) console.warn('[movements] load failed', error);
  }, [error]);

  const setSearchQuery = useCallback(
    (next: string) => {
      router.setParams({ q: next });
    },
    [router],
  );

  const clearFilters = useCallback(() => {
    setSelectedType('all');
    router.setParams({ q: '' });
  }, [router]);

  const handleRefresh = useCallback(() => {
    refetch();
    refetchCounts();
  }, [refetch, refetchCounts]);

  const handleReceiveStock = useCallback(
    () => signal.requestRestock(null),
    [signal],
  );

  const handleAdjustStock = useCallback(
    () => signal.requestAdjust(null),
    [signal],
  );

  const listEmpty = useMemo(
    () =>
      txQuery.isLoading ? (
        <LedgerRowsSkeleton />
      ) : (
        <LedgerNoMatches onClear={hasFilters ? clearFilters : undefined} />
      ),
    [txQuery.isLoading, hasFilters, clearFilters],
  );

  if (error) {
    return (
      <View className="flex-1 bg-paper-200">
        <InventoryErrorState
          title={t('movementsLoadError')}
          message={t('movementsLoadErrorBody')}
          onRetry={handleRefresh}
        />
      </View>
    );
  }

  // Placeholder rows belong to the previous filter, so only settled data may decide the store is empty.
  const storeIsEmpty =
    !txQuery.isLoading &&
    !txQuery.isPlaceholderData &&
    transactions.length === 0 &&
    !hasFilters;

  if (storeIsEmpty) {
    return (
      <ScrollView
        className="flex-1 bg-paper-200"
        contentContainerStyle={{ paddingBottom: fabClearance }}
      >
        <View className="w-full max-w-[640px] self-center">
          <MovementEmptyState
            onReceiveStock={handleReceiveStock}
            onAdjustStock={handleAdjustStock}
          />
        </View>
      </ScrollView>
    );
  }

  return (
    <View className="flex-1 bg-paper-200">
      <View className={CONTENT_CLASS}>
        <LedgerToolbar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedType={selectedType}
          setSelectedType={setSelectedType}
          counts={counts}
          showGuide={false}
        />
        <LedgerList
          transactions={transactions}
          currentStock={0}
          hideBalance={true}
          bottomPadding={fabClearance}
          // The query already filters by search and type on the database side.
          searchQuery=""
          selectedType="all"
          ListHeaderComponent={LIST_HEADER}
          ListEmptyComponent={listEmpty}
          isRefetching={
            txQuery.isRefetching &&
            !txQuery.isFetchingNextPage &&
            !txQuery.isPlaceholderData
          }
          onRefresh={handleRefresh}
          isFetchingNextPage={txQuery.isFetchingNextPage}
          hasNextPage={txQuery.hasNextPage}
          onEndReached={fetchNextPage}
        />
      </View>
    </View>
  );
}

export default withProf(MovementsScreen, 'inventory/movements');
