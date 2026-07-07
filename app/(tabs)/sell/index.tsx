import {
  FilterChips,
  SaleRow,
  SalesEmptyState,
  SalesFilterModal,
  SalesSkeleton,
  SellHeader,
  TodayStatsHero,
} from '@/components/sell';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  endOfDay,
  endOfMonth,
  startOfDay,
  startOfMonth,
  subDays,
  subMonths,
} from 'date-fns';

/**
 * Sell tab — Sales History & Reports hub.
 *
 * The POS checkout flow used to live here as an in-tab "Record Sale"
 * segment; it has been extracted into its own modal route at
 * `app/(edit-forms)/add-sales/`. This screen now owns only:
 *   • Header (cinnamon hero with monogram + title + [+] entry point).
 *   • Sales history list (paginated, filterable, pull-to-refresh).
 *   • Today's stats hero.
 *   • Filter chips + advanced filter modal.
 *   • Empty state with a "New Sale" CTA.
 *
 * Every visual block is delegated to a presentational subcomponent
 * under `components/sell/`. The screen only handles data fetching,
 * filtering/pagination state, navigation, and animations.
 */
export default function Sell() {
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

  // Fetch today's stats
  const { data: stats, refetch: refetchStats } = getTodayStatsQuery;

  // Fetch all sales
  const {
    data: sales = [],
    refetch: refetchSales,
    isLoading,
  } = getAllSalesQuery;

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Filter and sort sales based on selected filters
  const filteredSales = useMemo(() => {
    let filtered = [...sales];

    // Filter by payment type
    if (filters.paymentType !== 'all') {
      filtered = filtered.filter(
        (sale) => sale.payment_type === filters.paymentType,
      );
    }

    // Filter by date range
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
          startDate = new Date(0); // Beginning of time
      }

      filtered = filtered.filter((sale) => {
        const saleDate = parseStoredTimestamp(sale.timestamp);
        if (!saleDate) return false;
        return saleDate >= startDate && saleDate <= endDate;
      });
    }

    // Sort by timestamp descending (newest first)
    return filtered.sort((a, b) => {
      const dateA = parseStoredTimestamp(a.timestamp)?.getTime() || 0;
      const dateB = parseStoredTimestamp(b.timestamp)?.getTime() || 0;
      return dateB - dateA;
    });
  }, [sales, filters]);

  // Paginated sales
  const paginatedSales = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredSales.slice(startIndex, endIndex);
  }, [filteredSales, currentPage]);

  const totalPages = Math.ceil(filteredSales.length / ITEMS_PER_PAGE);

  // Count active filters
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

  const handleSalePress = useCallback((saleId: number) => {
    router.push(`/(edit-forms)/sale-details/${saleId}` as any);
  }, [router]);

  const handleApplyFilters = useCallback((newFilters: SalesFilterState) => {
    setFilters(newFilters);
  }, []);

  const handleOpenAddSales = useCallback(() => {
    router.push('/(edit-forms)/add-sales' as any);
  }, [router]);

  const handleOpenFilters = useCallback(() => {
    setFilterModalVisible(true);
  }, []);

  const handleCloseFilters = useCallback(() => {
    setFilterModalVisible(false);
  }, []);

  // Subtitle line under the hero title. Shifts between three i18n keys
  // based on whether the filtered list is empty or has entries.
  const subtitle =
    filteredSales.length === 0
      ? t('subtitleEmpty')
      : t(
          filteredSales.length === 1
            ? 'subtitleSingular'
            : 'subtitlePlural',
          { count: filteredSales.length },
        );

  // Hide the hero when there are no sales anywhere yet — keep layout clean.
  const showHero = (stats !== undefined && stats !== null) || sales.length > 0;

  const renderSaleItem = useCallback(({
    item,
    index,
  }: {
    item: SaleWithItems;
    index: number;
  }) => {
    // Stagger only the first page so re-renders on scroll don't re-animate.
    const delay = 200 + (index % 5) * 50;
    return (
      <MotiView
        from={{ opacity: 0, translateY: 12 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400, delay }}
      >
        <SaleRow sale={item} onPress={handleSalePress} />
      </MotiView>
    );
  }, [handleSalePress]);

  const keyExtractor = useCallback((item: SaleWithItems) => item.id.toString(), []);

  // Memoize ListHeaderComponent to prevent unnecessary re-rendering
  const listHeader = useMemo(() => {
    return (
      <View>
        {/* Today's Slip hero */}
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

        {/* Filter chips strip */}
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 360, delay: 160 }}
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

  // Memoize ListEmptyComponent to prevent unnecessary re-rendering
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

  return (
    <SafeAreaView className="flex-1 bg-cinnamon-500" edges={['top']}>
      <View className="flex-1 bg-background">
        <SellHeader
          eyebrow={t('eyebrow')}
          title={t('title')}
          subtitle={subtitle}
          activeFilterCount={activeFilterCount}
          onOpenFilters={handleOpenFilters}
          onOpenAddSales={handleOpenAddSales}
          filterA11yLabel={t('filterSalesA11y')}
          newSaleA11yLabel={t('recordNewSaleA11y')}
        />

        {/* Sales History Contents */}
        <View className="flex-1">
          <FlatList
            data={paginatedSales}
            renderItem={renderSaleItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={{ paddingBottom: 120 }}
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
          />

          {/* Pagination */}
          {filteredSales.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={filteredSales.length}
              itemsPerPage={ITEMS_PER_PAGE}
            />
          )}
        </View>

        {/* Filter modal */}
        <SalesFilterModal
          visible={filterModalVisible}
          onClose={handleCloseFilters}
          currentFilters={filters}
          onApplyFilters={handleApplyFilters}
        />
      </View>
    </SafeAreaView>
  );
}