import {
  FilterChips,
  SaleRow,
  SalesEmptyState,
  SalesFilterModal,
  SalesSkeleton,
  TodayStatsHero,
} from '@/components/sales';
import { useTabBarBottomOffset } from '@/components/layout';
import { Pagination } from '@/components/ui';
import { SalesFilterState, ITEMS_PER_PAGE } from '@/constants';
import { useSales } from '@/hooks';
import { SaleWithItems } from '@/types';
import { parseStoredTimestamp } from '@/utils';
import { MotiView } from 'moti';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import {
  endOfDay,
  endOfMonth,
  startOfDay,
  startOfMonth,
  subDays,
  subMonths,
} from 'date-fns';

// Static animation targets to prevent garbage collection and animation re-triggering on reference updates.
const FILTER_CHIPS_FROM = { opacity: 0 };
const FILTER_CHIPS_ANIMATE = { opacity: 1 };
const FILTER_CHIPS_TRANSITION = {
  type: 'timing' as const,
  duration: 360,
  delay: 160,
};

const SALE_ITEM_FROM = { opacity: 0, translateY: 12 };
const SALE_ITEM_ANIMATE = { opacity: 1, translateY: 0 };
const SALE_ITEM_TRANSITIONS = Array.from({ length: 5 }, (_, i) => ({
  type: 'timing' as const,
  duration: 400,
  delay: 200 + i * 50,
}));

export default function Receipts() {
  const router = useRouter();
  const { t } = useTranslation('sales');

  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [filterModalVisible, setFilterModalVisible] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [filters, setFilters] = useState<SalesFilterState>({
    paymentType: 'all',
    dateRange: 'all',
  });

  const { getTodayStatsQuery, getAllSalesQuery } = useSales();

  const { data: stats, refetch: refetchStats } = getTodayStatsQuery;

  const {
    data: sales = [],
    refetch: refetchSales,
    isLoading,
  } = getAllSalesQuery;

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const filteredSales = useMemo(() => {
    let filtered = [...sales];

    if (filters.paymentType !== 'all') {
      filtered = filtered.filter(
        (sale) => sale.payment_type === filters.paymentType,
      );
    }

    if (filters.dateRange !== 'all') {
      const now = new Date();
      let startDate: Date;
      let endDate: Date = endOfDay(now);

      switch (filters.dateRange) {
        case 'today':
          startDate = startOfDay(now);
          break;
        case 'yesterday':
          startDate = startOfDay(subDays(now, 1));
          endDate = endOfDay(subDays(now, 1));
          break;
        case 'last7days':
          startDate = startOfDay(subDays(now, 6));
          break;
        case 'last30days':
          startDate = startOfDay(subDays(now, 29));
          break;
        case 'thisMonth':
          startDate = startOfMonth(now);
          break;
        case 'lastMonth': {
          const lastMonth = subMonths(now, 1);
          startDate = startOfMonth(lastMonth);
          endDate = endOfMonth(lastMonth);
          break;
        }
        default:
          startDate = new Date(0);
      }

      filtered = filtered.filter((sale) => {
        const saleDate = parseStoredTimestamp(sale.timestamp);
        if (!saleDate) return false;
        return saleDate >= startDate && saleDate <= endDate;
      });
    }

    // Sort by timestamp descending (newest first) — optimized string comparison avoids Date parsing overhead.
    return filtered.sort((a, b) => {
      const tsA = a.timestamp || '';
      const tsB = b.timestamp || '';
      return tsA < tsB ? 1 : tsA > tsB ? -1 : 0;
    });
  }, [sales, filters]);

  const paginatedSales = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredSales.slice(startIndex, endIndex);
  }, [filteredSales, currentPage]);

  const totalPages = Math.ceil(filteredSales.length / ITEMS_PER_PAGE);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.paymentType !== 'all') count++;
    if (filters.dateRange !== 'all') count++;
    return count;
  }, [filters]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchStats(), refetchSales()]);
    setRefreshing(false);
  }, [refetchStats, refetchSales]);

  const handleSalePress = useCallback(
    (saleId: number) => {
      router.push(`/(edit-forms)/sale-details/${saleId}` as any);
    },
    [router],
  );

  const handleApplyFilters = useCallback((newFilters: SalesFilterState) => {
    setFilters(newFilters);
  }, []);

  const handleOpenAddSales = useCallback(() => {
    router.push('/(tabs)/sales/pos');
  }, [router]);

  const handleOpenFilters = useCallback(() => {
    setFilterModalVisible(true);
  }, []);

  const handleCloseFilters = useCallback(() => {
    setFilterModalVisible(false);
  }, []);

  const showHero = (stats !== undefined && stats !== null) || sales.length > 0;

  const renderSaleItem = useCallback(
    ({ item, index }: { item: SaleWithItems; index: number }) => {
      return (
        <MotiView
          from={SALE_ITEM_FROM}
          animate={SALE_ITEM_ANIMATE}
          transition={SALE_ITEM_TRANSITIONS[index % 5]}
        >
          <SaleRow sale={item} onPress={handleSalePress} />
        </MotiView>
      );
    },
    [handleSalePress],
  );

  const keyExtractor = useCallback(
    (item: SaleWithItems) => item.id.toString(),
    [],
  );

  const listHeader = useMemo(() => {
    return (
      <View>
        {showHero && stats && (
          <TodayStatsHero
            stats={stats}
            headerLabel={t('todaySlip')}
            headerSubLabel={t('todaySlipSub')}
            amountDueLabel={t('amountDue')}
            itemsSoldLabel={t('itemsSold')}
            creditsLabel={t('credits')}
          />
        )}

        <MotiView
          from={FILTER_CHIPS_FROM}
          animate={FILTER_CHIPS_ANIMATE}
          transition={FILTER_CHIPS_TRANSITION}
        >
          <FilterChips
            filters={filters}
            onChange={setFilters}
            onOpenMore={handleOpenFilters}
          />
        </MotiView>
      </View>
    );
  }, [showHero, stats, filters, t, setFilters, handleOpenFilters]);

  const listEmpty = useMemo(() => {
    if (isLoading) {
      return <SalesSkeleton />;
    }
    return (
      <View className="px-2 pb-12">
        <SalesEmptyState
          onNewSale={handleOpenAddSales}
          hasSales={sales.length > 0}
        />
      </View>
    );
  }, [isLoading, handleOpenAddSales, sales.length]);

  const tabBarBottomOffset = useTabBarBottomOffset();

  return (
    <View className="flex-1 bg-paper-200">
      <View className="flex-1">
        <FlatList
          data={paginatedSales}
          renderItem={renderSaleItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={{ paddingBottom: tabBarBottomOffset + 24 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#E85A1F"
              colors={['#E85A1F']}
            />
          }
          ListHeaderComponent={listHeader}
          ListEmptyComponent={listEmpty}
          initialNumToRender={5}
          maxToRenderPerBatch={5}
          windowSize={3}
          removeClippedSubviews={true}
        />

        {filteredSales.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredSales.length}
            itemsPerPage={ITEMS_PER_PAGE}
            bottomOffset={tabBarBottomOffset}
          />
        )}
      </View>

      <SalesFilterModal
        visible={filterModalVisible}
        onClose={handleCloseFilters}
        currentFilters={filters}
        onApplyFilters={handleApplyFilters}
      />
    </View>
  );
}
