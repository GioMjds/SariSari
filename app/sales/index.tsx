import StyledText from "@/components/elements/StyledText";
import { getAllSales, getTodayStats, initSalesTables } from "@/db/sales";
import { SaleWithItems } from "@/types/sales.types";
import { FontAwesome } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Sales history screen
export default function Sales() {
    const [refreshing, setRefreshing] = useState<boolean>(false);

    const router = useRouter();

    // Initialize tables
    useEffect(() => {
        initSalesTables();
    }, []);

    // Fetch today's stats
    const { data: stats, refetch: refetchStats } = useQuery({
        queryKey: ['sales-stats'],
        queryFn: getTodayStats,
    });

    // Fetch all sales
    const { data: sales = [], refetch: refetchSales, isLoading } = useQuery({
        queryKey: ['sales'],
        queryFn: getAllSales,
    });

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

    const renderSaleItem = ({ item }: { item: SaleWithItems }) => {
        const isCredit = item.payment_type === 'credit';
        const timestamp = new Date(item.timestamp);

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
                        <Pressable
                            onPress={() => {/* TODO: Open filter modal */}}
                            className="bg-secondary rounded-xl px-4 py-2 active:opacity-70"
                        >
                            <FontAwesome name="filter" size={18} color="#fff" />
                        </Pressable>
                        <Pressable
                            onPress={handleNewSale}
                            className="bg-secondary rounded-xl px-4 py-2 flex-row items-center gap-2 active:opacity-70"
                        >
                            <FontAwesome name="plus" size={18} color="#fff" />
                            <StyledText variant="semibold" className="text-white text-sm">
                                New Sale
                            </StyledText>
                        </Pressable>
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
            ) : sales.length === 0 ? (
                <View className="flex-1 justify-center items-center px-8">
                    <FontAwesome name="shopping-cart" size={64} color="#AD49E1" style={{ opacity: 0.3 }} />
                    <StyledText variant="semibold" className="text-text-secondary text-lg mt-4 text-center">
                        No sales yet
                    </StyledText>
                    <StyledText variant="regular" className="text-text-muted text-sm mt-2 text-center">
                        Start by creating your first sale
                    </StyledText>
                </View>
            ) : (
                <FlatList
                    data={sales}
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
        </SafeAreaView>
    );
}