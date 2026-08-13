import {
  FilterChips,
  SaleRow,
  SalesEmptyState,
  SalesFilterModal,
  SalesSkeleton,
} from '@/components/sales';
import { useTabBarBottomOffset } from '@/components/layout';
import { Pagination, RefreshableFlatList } from '@/components/ui';
import { StyledText } from '@/components/elements';
import { SalesFilterState, ITEMS_PER_PAGE } from '@/constants';
import { useSales } from '@/hooks';
import { SaleWithItems } from '@/types';
import { parseStoredTimestamp } from '@/utils';
import { Href, useRouter } from 'expo-router';
import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { FlatList, View } from 'react-native';
import {
  endOfDay,
  endOfMonth,
  startOfDay,
  startOfMonth,
  subDays,
  subMonths,
} from 'date-fns';
import { formatPesos } from '@/lib';

export default function Receipts() {
  const router = useRouter();
  const flatListRef = useRef<FlatList<SaleWithItems>>(null);

  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [filterModalVisible, setFilterModalVisible] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filters, setFilters] = useState<SalesFilterState>({
    paymentType: 'all',
    dateRange: 'all',
  });

  const { getTodayStatsQuery, getAllSalesQuery } = useSales();

  const { refetch: refetchStats } = getTodayStatsQuery;

  const {
    data: sales = [],
    refetch: refetchSales,
    isLoading,
  } = getAllSalesQuery;

  useEffect(() => {
    setCurrentPage(1);
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [filters, searchQuery]);

  const filteredSales = useMemo(() => {
    let filtered = [...sales];

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((sale) => {
        if (sale.customer_name?.toLowerCase().includes(q)) return true;
        const refStr = `#sr-${String(sale.id).padStart(4, '0')}`;
        if (refStr.includes(q) || String(sale.id) === q) return true;
        if (
          sale.items?.some((item) =>
            item.product_name.toLowerCase().includes(q),
          )
        )
          return true;
        return false;
      });
    }

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

    // Sort by timestamp descending (newest first)
    return filtered.sort((a, b) => {
      const tsA = a.timestamp || '';
      const tsB = b.timestamp || '';
      return tsA < tsB ? 1 : tsA > tsB ? -1 : 0;
    });
  }, [sales, filters, searchQuery]);

  const filteredTotalAmount = useMemo(() => {
    return filteredSales.reduce((acc, sale) => acc + (sale.total || 0), 0);
  }, [filteredSales]);

  const paginatedSales = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredSales.slice(startIndex, endIndex);
  }, [filteredSales, currentPage]);

  const totalPages = Math.ceil(filteredSales.length / ITEMS_PER_PAGE);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, []);

  const handleResetFilters = useCallback(() => {
    setSearchQuery('');
    setFilters({
      paymentType: 'all',
      dateRange: 'all',
    });
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchStats(), refetchSales()]);
    setRefreshing(false);
  }, [refetchStats, refetchSales]);

  const handleSalePress = useCallback(
    (saleId: number) => {
      router.push(`/(edit-forms)/sale-details/${saleId}` as Href);
    },
    [router],
  );

  const handleApplyFilters = useCallback((newFilters: SalesFilterState) => {
    setFilters(newFilters);
  }, []);

  const handleOpenAddSales = useCallback(() => {
    router.push('/(tabs)/sales/pos' as Href);
  }, [router]);

  const handleOpenFilters = useCallback(() => {
    setFilterModalVisible(true);
  }, []);

  const handleCloseFilters = useCallback(() => {
    setFilterModalVisible(false);
  }, []);

  const handleOpenCorrectionsReport = useCallback(() => {
    router.push('/reports/corrections' as Href);
  }, [router]);

  const renderSaleItem = useCallback(
    ({ item }: { item: SaleWithItems }) => {
      return <SaleRow sale={item} onPress={handleSalePress} />;
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
        <FilterChips
          filters={filters}
          onOpenMore={handleOpenFilters}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenCorrectionsReport={handleOpenCorrectionsReport}
        />

        {filteredSales.length > 0 && (
          <View className="px-4 pt-1 pb-3 flex-row items-center justify-between">
            <StyledText variant="extrabold" className="label-caps text-ink-400">
              {filteredSales.length}{' '}
              {filteredSales.length === 1 ? 'Receipt' : 'Receipts'} Found
            </StyledText>
            <View className="flex-row items-baseline">
              <StyledText
                variant="regular"
                className="text-ink-500 text-xs mr-1"
              >
                Sum:
              </StyledText>
              <StyledText
                variant="extrabold"
                className="text-persimmon-600 text-xs"
              >
                {formatPesos(filteredTotalAmount)}
              </StyledText>
            </View>
          </View>
        )}
      </View>
    );
  }, [
    filters,
    searchQuery,
    filteredSales.length,
    filteredTotalAmount,
    handleOpenFilters,
  ]);

  const listEmpty = useMemo(() => {
    if (isLoading) return <SalesSkeleton />;
    return (
      <View className="px-2 pb-12">
        <SalesEmptyState
          onNewSale={handleOpenAddSales}
          hasSales={sales.length > 0}
          onClearFilters={handleResetFilters}
        />
      </View>
    );
  }, [isLoading, handleOpenAddSales, sales.length, handleResetFilters]);

  const tabBarBottomOffset = useTabBarBottomOffset();

  return (
    <View className="flex-1 bg-paper-200">
      <View className="flex-1">
        <RefreshableFlatList<SaleWithItems>
          ref={flatListRef}
          isRefreshing={refreshing}
          onRefresh={onRefresh}
          data={paginatedSales}
          renderItem={renderSaleItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={{ paddingBottom: tabBarBottomOffset + 24 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={listEmpty}
          initialNumToRender={ITEMS_PER_PAGE}
          maxToRenderPerBatch={ITEMS_PER_PAGE}
          windowSize={5}
          removeClippedSubviews={true}
        />

        {filteredSales.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
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
