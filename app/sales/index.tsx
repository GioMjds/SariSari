import StyledText from "@/components/elements/StyledText";
import SalesFilterModal from "@/components/sales/SalesFilterModal";
import Pagination from "@/components/ui/Pagination";
import { SalesFilterState } from "@/constants/filters";
import { useSalesMutation } from "@/hooks/useSalesMutation";
import { SaleWithItems } from "@/types/sales.types";
import { parseStoredTimestamp } from "@/utils/timezone";
import { FontAwesome } from "@expo/vector-icons";
import { endOfDay, endOfMonth, format, startOfDay, startOfMonth, subDays, subMonths } from "date-fns";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ITEMS_PER_PAGE = 4;

export default function Sales() {
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [filterModalVisible, setFilterModalVisible] = useState<boolean>(false);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [filters, setFilters] = useState<SalesFilterState>({
        paymentType: 'all',
        dateRange: 'all',
    });

    const router = useRouter();
    const { getTodayStatsQuery, getAllSalesQuery } = useSalesMutation();

    // Fetch today's stats
    const { data: stats, refetch: refetchStats } = getTodayStatsQuery;

    // Fetch all sales
    const { data: sales = [], refetch: refetchSales, isLoading } = getAllSalesQuery;

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [filters]);

    // Filter and sort sales based on selected filters
    const filteredSales = useMemo(() => {
        let filtered = [...sales];

        // Filter by payment type
        if (filters.paymentType !== 'all') {
            filtered = filtered.filter(sale => sale.payment_type === filters.paymentType);
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
                case 'lastMonth':
                    const lastMonth = subMonths(now, 1);
                    startDate = startOfMonth(lastMonth);
                    endDate = endOfMonth(lastMonth);
                    break;
                default:
                    startDate = new Date(0); // Beginning of time
            }

            filtered = filtered.filter(sale => {
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
        router.push('/sales/add');
    };

    const handleSalePress = (saleId: number) => {
        router.push(`/sales/${saleId}` as any);
    };

    const handleApplyFilters = (newFilters: SalesFilterState) => {
        setFilters(newFilters);
    };

    const renderSaleItem = ({ item }: { item: SaleWithItems }) => {
        const isCredit = item.payment_type === 'credit';
        const timestamp = parseStoredTimestamp(item.timestamp) || new Date();

        return (
            <Pressable
                onPress={() => handleSalePress(item.id)}
                className="bg-white mx-4 mb-3 rounded-2xl p-4 shadow-sm active:opacity-70"
            >
                <View className="flex-row justify-between items-start mb-2">
                    <View className="flex-1">
                        <StyledText variant="medium" className="text-text-primary text-base mb-1">
                            #{item.id} • {format(timestamp, 'MMM dd, yyyy')}
                        </StyledText>
                        <StyledText variant="regular" className="text-text-secondary text-xs">
                            {format(timestamp, 'hh:mm a')}
                        </StyledText>
                    </View>
                    <View className={`px-3 py-1 rounded-full ${isCredit ? 'bg-accent/20' : 'bg-secondary/20'}`}>
                        <StyledText variant="semibold" className={`text-xs ${isCredit ? 'text-accent' : 'text-secondary'}`}>
                            {isCredit ? 'Credit' : 'Cash'}
                        </StyledText>
                    </View>
                </View>

                <View className="flex-row justify-between items-center mt-3 pt-3 border-t border-background">
                    <View>
                        <StyledText variant="extrabold" className="text-primary text-xl">
                            ₱{item.total.toFixed(2)}
                        </StyledText>
                        <StyledText variant="regular" className="text-text-secondary text-xs mt-1">
                            {item.items_count} {item.items_count === 1 ? 'item' : 'items'}
                        </StyledText>
                    </View>

                    {isCredit && item.customer_name && (
                        <View className="flex-row items-center">
                            <FontAwesome name="user" size={14} color="#AD49E1" />
                            <StyledText variant="medium" className="text-accent text-sm ml-2">
                                {item.customer_name}
                            </StyledText>
                        </View>
                    )}
                </View>
            </Pressable>
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            {/* Header */}
            <View className="px-4 py-4 pb-6">
                <View className="flex-row justify-between items-center">
                    <StyledText variant="extrabold" className="text-primary text-3xl">
                        My Sales
                    </StyledText>
                    <View className="flex-row gap-2">
                        <TouchableOpacity
                            hitSlop={20}
                            activeOpacity={0.2}
                            onPress={() => setFilterModalVisible(true)}
                            className="bg-secondary rounded-xl px-4 py-2 active:opacity-70 flex-row items-center gap-2"
                        >
                            <FontAwesome name="filter" size={18} color="#fff" />
                            {activeFilterCount > 0 && (
                                <View className="bg-accent rounded-full w-5 h-5 items-center justify-center">
                                    <StyledText variant="extrabold" className="text-white text-xs">
                                        {activeFilterCount}
                                    </StyledText>
                                </View>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity
                            hitSlop={20}
                            activeOpacity={0.2}
                            onPress={handleNewSale}
                            className="bg-secondary rounded-xl px-4 py-2 flex-row items-center gap-2 active:opacity-70"
                        >
                            <FontAwesome name="plus" size={18} color="#fff" />
                            <StyledText variant="semibold" className="text-white text-sm">
                                New Sale
                            </StyledText>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Summary Stats */}
                {stats && (
                    <View className="flex-row justify-between mt-4 gap-3">
                        <View className="flex-1 bg-white rounded-xl p-3">
                            <StyledText variant="regular" className="text-secondary text-sm mb-1">
                                Today's Total
                            </StyledText>
                            <StyledText variant="extrabold" className="text-secondary text-xl">
                                ₱{stats.total.toFixed(2)}
                            </StyledText>
                        </View>
                        <View className="flex-1 bg-white rounded-xl p-3">
                            <StyledText variant="regular" className="text-secondary text-sm mb-1">
                                Items Sold
                            </StyledText>
                            <StyledText variant="extrabold" className="text-secondary text-xl">
                                {stats.items_sold}
                            </StyledText>
                        </View>
                        <View className="flex-1 bg-white rounded-xl p-3">
                            <StyledText variant="regular" className="text-secondary text-sm mb-1">
                                Credit Sales
                            </StyledText>
                            <StyledText variant="extrabold" className="text-secondary text-xl">
                                {stats.credit_sales}
                            </StyledText>
                        </View>
                    </View>
                )}
            </View>

            {/* Sales List */}
            {isLoading ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#7A1CAC" />
                </View>
            ) : filteredSales.length === 0 ? (
                <View className="flex-1 justify-center items-center px-8">
                    <FontAwesome name="shopping-cart" size={64} color="#AD49E1" style={{ opacity: 0.3 }} />
                    <StyledText variant="semibold" className="text-text-secondary text-lg mt-4 text-center">
                        {sales.length === 0 ? 'No sales yet' : 'No sales match your filters'}
                    </StyledText>
                    <StyledText variant="regular" className="text-text-muted text-sm mt-2 text-center">
                        {sales.length === 0 ? 'Start by creating your first sale' : 'Try adjusting your filter criteria'}
                    </StyledText>
                </View>
            ) : (
                <FlatList
                    data={paginatedSales}
                    renderItem={renderSaleItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={{ paddingTop: 16, paddingBottom: 100 }}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor="#7A1CAC"
                            colors={['#7A1CAC']}
                        />
                    }
                />
            )}

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

            {/* Filter Modal */}
            <SalesFilterModal
                visible={filterModalVisible}
                onClose={() => setFilterModalVisible(false)}
                currentFilters={filters}
                onApplyFilters={handleApplyFilters}
            />
        </SafeAreaView>
    );
}