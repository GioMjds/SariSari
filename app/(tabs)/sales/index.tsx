import { StyledText } from '@/components/elements';
import {
  FilterChips,
  SaleRow,
  SalesEmptyState,
  SalesFilterModal,
  SalesSkeleton,
} from '@/components/sales';
import {
  MoneyText,
  Pagination,
  ReceiptHero,
  ReceiptHeroDivider,
  ReceiptHeroMeta,
} from '@/components/ui';
import { SalesFilterState, ITEMS_PER_PAGE } from '@/constants';
import { useSales } from '@/hooks';
import { SaleWithItems } from '@/types';
import { parseStoredTimestamp } from '@/utils';
import { FontAwesome } from '@expo/vector-icons';
import {
  endOfDay,
  endOfMonth,
  startOfDay,
  startOfMonth,
  subDays,
  subMonths,
} from 'date-fns';
import { MotiView } from 'moti';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Sales() {
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [filterModalVisible, setFilterModalVisible] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [filters, setFilters] = useState<SalesFilterState>({
    paymentType: 'all',
    dateRange: 'all',
  });

  const router = useRouter();
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

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchStats(), refetchSales()]);
    setRefreshing(false);
  };

  const handleNewSale = () => {
    router.push('/(edit-forms)/add-sales' as any);
  };

  const handleSalePress = (saleId: number) => {
    router.push(`/(edit-forms)/sale-details/${saleId}` as any);
  };

  const handleApplyFilters = (newFilters: SalesFilterState) => {
    setFilters(newFilters);
  };

  // Hide the hero when there are no sales anywhere yet — keep layout clean.
  const showHero = (stats !== undefined && stats !== null) || sales.length > 0;

  const renderSaleItem = ({
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
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <FlatList
        data={paginatedSales}
        renderItem={renderSaleItem}
        keyExtractor={(item) => item.id.toString()}
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
        ListHeaderComponent={
          <View>
            {/* Z1 — sticky cinnamon header */}
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ type: 'timing', duration: 320 }}
            >
              <View className="bg-cinnamon-500 px-5 pt-3 pb-6">
                {/* small monogram dot */}
                <View className="flex-row items-center mb-3">
                  <View
                    className="w-8 h-8 rounded-full bg-persimmon-500 items-center justify-center mr-2"
                    style={{
                      shadowColor: '#564E45',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.06,
                      shadowRadius: 6,
                      elevation: 2,
                    }}
                  >
                    <StyledText
                      variant="black"
                      className="text-paper-50 text-xl"
                    >
                      ₱
                    </StyledText>
                  </View>
                  <StyledText
                    variant="extrabold"
                    className="label-caps text-paper-200 opacity-80"
                  >
                    Resibo Book
                  </StyledText>
                </View>

                <View className="flex-row items-start justify-between">
                  <View className="flex-1 mr-3">
                    <StyledText
                      variant="black"
                      className="text-paper-50 text-h1"
                    >
                      My Sales
                    </StyledText>
                    <StyledText
                      variant="regular"
                      className="text-paper-200 text-sm mt-1 opacity-90"
                    >
                      {filteredSales.length === 0
                        ? 'Start your resibo book'
                        : `${filteredSales.length} ${filteredSales.length === 1 ? 'resibo' : 'resibo'} on file`}
                    </StyledText>
                  </View>

                  <Pressable
                    hitSlop={12}
                    onPress={() => setFilterModalVisible(true)}
                    className="relative w-11 h-11 rounded-full items-center justify-center"
                    style={({ pressed }) => ({
                      backgroundColor: 'rgba(251, 247, 238, 0.15)', // bg-paper-50/15
                      opacity: pressed ? 0.8 : 1,
                    })}
                  >
                    <FontAwesome name="sliders" size={18} color="#FBF7EE" />
                    {activeFilterCount > 0 && (
                      <View className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-persimmon-500 items-center justify-center border-2 border-cinnamon-500">
                        <StyledText
                          variant="black"
                          className="text-paper-50 text-[10px]"
                        >
                          {activeFilterCount}
                        </StyledText>
                      </View>
                    )}
                  </Pressable>
                </View>
              </View>
            </MotiView>

            {/* Z2 — Today's Slip hero */}
            {showHero && stats && (
              <MotiView
                from={{ opacity: 0, translateY: 18 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 480, delay: 80 }}
              >
                <View className="px-4 -mt-2 mb-4">
                  <ReceiptHero tone="persimmon">
                    {/* eyebrow */}
                    <View className="px-5 pt-5 pb-1 flex-row items-center justify-between">
                      <View className="flex-row items-center">
                        <FontAwesome
                          name="calendar"
                          size={12}
                          color="#FBF7EE"
                          style={{ marginRight: 8 }}
                        />
                        <StyledText
                          variant="extrabold"
                          className="label-caps text-paper-50 opacity-95"
                        >
                          Today&apos;s Slip
                        </StyledText>
                      </View>
                      <StyledText
                        variant="medium"
                        className="text-mono text-paper-50 opacity-80"
                      >
                        {`№ ${String(stats.credit_sales + stats.items_sold).padStart(3, '0')}`}
                      </StyledText>
                    </View>

                    <ReceiptHeroDivider label="Amount Due" tone="persimmon" />

                    <View className="px-5">
                      <MoneyText
                        value={stats.total}
                        fromPesos
                        size="display"
                        className="text-ink-900"
                      />
                    </View>

                    <ReceiptHeroMeta
                      rows={[
                        {
                          label: 'Items Sold',
                          value: String(stats.items_sold),
                        },
                        { label: 'Credits', value: String(stats.credit_sales) },
                      ]}
                    />
                  </ReceiptHero>
                </View>
              </MotiView>
            )}

            {/* Z3 — filter chips strip */}
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ type: 'timing', duration: 360, delay: 160 }}
            >
              <FilterChips
                filters={filters}
                onChange={setFilters}
                onOpenMore={() => setFilterModalVisible(true)}
              />
            </MotiView>
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <SalesSkeleton />
          ) : (
            <View className="px-2 pb-12">
              <SalesEmptyState
                onNewSale={handleNewSale}
                hasSales={sales.length > 0}
              />
            </View>
          )
        }
      />

      {/* Z5a — floating persimmon FAB (matches Credits tab pattern) */}
      <MotiView
        from={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'timing', duration: 320, delay: 240 }}
        style={{
          position: 'absolute',
          bottom: 96,
          right: 20,
        }}
      >
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleNewSale}
          className="w-14 h-14 rounded-full bg-persimmon-500 items-center justify-center"
          style={{
            shadowColor: '#E85A1F',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.18,
            shadowRadius: 24,
            elevation: 8,
          }}
        >
          <FontAwesome name="plus" size={20} color="#FBF7EE" />
        </TouchableOpacity>
      </MotiView>

      {/* Z5b — pagination */}
      {filteredSales.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filteredSales.length}
          itemsPerPage={ITEMS_PER_PAGE}
        />
      )}

      {/* Filter modal */}
      <SalesFilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        currentFilters={filters}
        onApplyFilters={handleApplyFilters}
      />
    </SafeAreaView>
  );
}
