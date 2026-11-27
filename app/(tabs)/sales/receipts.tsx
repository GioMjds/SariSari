import { withProf } from '@/utils/perf';
import {
  FilterChips,
  ReceiptDayHeader,
  ReceiptsSummary,
  SaleRow,
  SalesEmptyState,
  SalesFilterModal,
  SalesSkeleton,
  ReceiptsErrorState,
} from '@/components/sales';
import { useTabBarBottomOffset } from '@/components/layout';
import { Pagination, RefreshableFlatList } from '@/components/ui';
import { SalesFilterState, ITEMS_PER_PAGE } from '@/constants';
import { useAllSales, useTodayStats } from '@/hooks';
import {
  buildReceiptRows,
  formatReceiptRef,
  parseStoredTimestamp,
  ReceiptRow,
  summarizeReceipts,
} from '@/utils';
import { Href, useRouter } from 'expo-router';
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { FlatList, View } from 'react-native';
import {
  endOfDay,
  endOfMonth,
  startOfDay,
  startOfMonth,
  subDays,
  subMonths,
} from 'date-fns';

function Receipts() {
  const router = useRouter();
  const flatListRef = useRef<FlatList<ReceiptRow>>(null);

  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [filterModalVisible, setFilterModalVisible] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filters, setFilters] = useState<SalesFilterState>({
    paymentType: 'all',
    dateRange: 'all',
  });

  // Narrow hooks: useSales() also mounts five mutations this screen never uses.
  const { refetch: refetchStats } = useTodayStats();
  const {
    data: sales = [],
    refetch: refetchSales,
    isLoading,
    isError,
  } = useAllSales();
  // Typing stays responsive while the ledger re-filters at lower priority.
  const deferredQuery = useDeferredValue(searchQuery);

  useEffect(() => {
    setCurrentPage(1);
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [filters, searchQuery]);

  const filteredSales = useMemo(() => {
    let filtered = [...sales];

    if (deferredQuery.trim() !== '') {
      const q = deferredQuery.toLowerCase().trim().replace(/^#/, '');
      filtered = filtered.filter((sale) => {
        if (sale.customer_name?.toLowerCase().includes(q)) return true;
        const ref = formatReceiptRef(sale.id).toLowerCase();
        // Accepts "sr-0042", "sr-42", or a bare "42".
        if (ref.includes(q) || q.replace(/^sr-?0*/, '') === String(sale.id))
          return true;
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
  }, [sales, filters, deferredQuery]);

  const summary = useMemo(
    () => summarizeReceipts(filteredSales),
    [filteredSales],
  );

  const rows = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const pageSales = filteredSales.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    return buildReceiptRows(pageSales, filteredSales);
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

  const renderRow = useCallback(
    ({ item }: { item: ReceiptRow }) =>
      item.kind === 'day' ? (
        <ReceiptDayHeader label={item.label} cash={item.cash} utang={item.utang} />
      ) : (
        <SaleRow sale={item.sale} onPress={handleSalePress} />
      ),
    [handleSalePress],
  );

  const keyExtractor = useCallback((item: ReceiptRow) => item.key, []);

  const listHeader = useMemo(() => {
    return (
      <View>
        <FilterChips
          filters={filters}
          onOpenMore={handleOpenFilters}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenCorrectionsReport={handleOpenCorrectionsReport}
          onFiltersChange={handleApplyFilters}
        />

        {summary.count > 0 && <ReceiptsSummary {...summary} />}
      </View>
    );
  }, [
    filters,
    searchQuery,
    summary,
    handleOpenFilters,
    handleOpenCorrectionsReport,
    handleApplyFilters,
  ]);

  const listEmpty = useMemo(() => {
    if (isLoading) return <SalesSkeleton />;
    if (isError) return <ReceiptsErrorState onRetry={refetchSales} />;
    return (
      <View className="px-2 pb-12">
        <SalesEmptyState
          onNewSale={handleOpenAddSales}
          hasSales={sales.length > 0}
          onClearFilters={handleResetFilters}
        />
      </View>
    );
  }, [
    isLoading,
    isError,
    refetchSales,
    handleOpenAddSales,
    sales.length,
    handleResetFilters,
  ]);

  const tabBarBottomOffset = useTabBarBottomOffset();

  return (
    <View className="flex-1 bg-paper-200">
      <View className="flex-1">
        <RefreshableFlatList<ReceiptRow>
          ref={flatListRef}
          isRefreshing={refreshing}
          onRefresh={onRefresh}
          data={rows}
          renderItem={renderRow}
          keyExtractor={keyExtractor}
          contentContainerStyle={{
            // Clears the floating pager pill (about 44 tall) when it shows.
            paddingBottom: tabBarBottomOffset + (totalPages > 1 ? 72 : 24),
            width: '100%',
            maxWidth: 640,
            alignSelf: 'center',
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={listEmpty}
          initialNumToRender={5}
          maxToRenderPerBatch={5}
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

export default withProf(Receipts, 'sales/receipts');
