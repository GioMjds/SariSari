import { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { usePaginatedInventoryTransactions } from '@/hooks/useInventory';
import { LedgerList, LedgerToolbar, type LedgerTypeFilter } from '@/components/inventory/ledger';
import { MovementEmptyState } from '@/components/inventory/movements';
import { InventoryErrorState } from '@/components/inventory';
import { useStockSheetSignal } from '@/stores';
import type { InventoryEventType } from '@/types';

export default function MovementsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ q?: string }>();
  const signal = useStockSheetSignal();

  const searchQuery = (params.q ?? '').trim();
  const [selectedType, setSelectedType] = useState<LedgerTypeFilter>('all');

  const txQuery = usePaginatedInventoryTransactions(searchQuery, selectedType);

  const transactions = useMemo(
    () => txQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [txQuery.data],
  );

  const counts = useMemo<Partial<Record<InventoryEventType, number>>>(() => {
    const acc: Partial<Record<InventoryEventType, number>> = {};
    for (const tx of transactions) {
      if (tx?.type) {
        acc[tx.type] = (acc[tx.type] ?? 0) + 1;
      }
    }
    return acc;
  }, [transactions]);

  const setSearchQuery = useCallback(
    (next: string) => {
      router.setParams({ q: next || undefined } as any);
    },
    [router],
  );

  const handleReceiveStock = useCallback(
    () => signal.requestRestock(null),
    [signal],
  );
  const handleAdjustStock = useCallback(() => signal.requestAdjust(null), [signal]);

  if (txQuery.error) {
    return (
      <InventoryErrorState
        title="Couldn't load movements"
        message={(txQuery.error as Error)?.message ?? 'Unknown error'}
        onRetry={() => txQuery.refetch?.()}
      />
    );
  }
  if (txQuery.isLoading) {
    return (
      <View className="flex-1 bg-paper-200">
        <LedgerToolbar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedType={selectedType}
          setSelectedType={setSelectedType}
          counts={counts}
        />
      </View>
    );
  }
  if (transactions.length === 0) {
    return (
      <View className="flex-1 bg-paper-200">
        <MovementEmptyState
          onReceiveStock={handleReceiveStock}
          onAdjustStock={handleAdjustStock}
        />
      </View>
    );
  }
  return (
    <View className="flex-1 bg-paper-200">
      <LedgerToolbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedType={selectedType}
        setSelectedType={setSelectedType}
        counts={counts}
      />
      <LedgerList
        transactions={transactions}
        currentStock={0}
        searchQuery={searchQuery}
        selectedType={selectedType}
        isFetchingNextPage={txQuery.isFetchingNextPage}
        hasNextPage={txQuery.hasNextPage}
        onEndReached={() => {
          if (!txQuery.isFetchingNextPage && txQuery.hasNextPage) {
            txQuery.fetchNextPage();
          }
        }}
      />
    </View>
  );
}
