import StyledText from "@/components/elements/StyledText";
import { useSales } from "@/hooks/useSales";
import { Alert } from "@/utils/alert";
import { parseStoredTimestamp } from "@/utils/timezone";
import { FontAwesome } from "@expo/vector-icons";
import { format } from "date-fns";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SaleDetails() {
    const { id } = useLocalSearchParams<{ id: string }>();

    const router = useRouter();

    const { useGetSale, deleteSaleMutation } = useSales();

    const { data: sale, isLoading } = useGetSale(Number(id));

    const handleDeleteSale = () => {
        Alert.alert(
            "Delete Sale",
            "Are you sure you want to delete this sale? This will restore the inventory.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteSaleMutation.mutateAsync(Number(id));
                            router.back();
                        } catch (error) {
                            Alert.alert("Error", "Failed to delete sale");
                        }
                    },
                },
            ]
        );
    };

    if (isLoading || !sale) {
        return (
            <SafeAreaView className="flex-1 bg-background" edges={['top']}>
                <View className="flex-1 justify-center items-center">
                    <StyledText variant="medium" className="text-text-secondary">
                        Loading...
                    </StyledText>
                </View>
            </SafeAreaView>
        );
    }

    const isCredit = sale.payment_type === 'credit';
    const timestamp = parseStoredTimestamp(sale.timestamp) || new Date();

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            {/* Header */}
            <View className="bg-primary px-4 py-4">
                <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-3 flex-1">
                        <Pressable onPress={() => router.back()} className="active:opacity-50">
                            <FontAwesome name="arrow-left" size={20} color="#fff" />
                        </Pressable>
                        <StyledText variant="extrabold" className="text-white text-2xl">
                            Sale #{sale.id}
                        </StyledText>
                    </View>
                    <Pressable
                        onPress={handleDeleteSale}
                        className="bg-red-500/30 rounded-xl px-3 py-2 active:opacity-70"
                    >
                        <FontAwesome name="trash" size={18} color="#fff" />
                    </Pressable>
                </View>
            </View>

            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
                {/* Sale Summary Card */}
                <View className="bg-white mx-4 mt-4 rounded-2xl p-4 shadow-sm">
                    <View className="flex-row justify-between items-start mb-4">
                        <View>
                            <StyledText variant="medium" className="text-text-secondary text-xs mb-1">
                                Date & Time
                            </StyledText>
                            <StyledText variant="semibold" className="text-primary text-base">
                                {format(timestamp, 'MMM dd, yyyy')}
                            </StyledText>
                            <StyledText variant="regular" className="text-text-secondary text-sm">
                                {format(timestamp, 'hh:mm a')}
                            </StyledText>
                        </View>
                        <View className={`px-4 py-2 rounded-full ${isCredit ? 'bg-accent/20' : 'bg-secondary/20'}`}>
                            <StyledText variant="extrabold" className={`${isCredit ? 'text-accent' : 'text-secondary'}`}>
                                {isCredit ? 'Credit' : 'Cash'}
                            </StyledText>
                        </View>
                    </View>

                    {isCredit && sale.customer_name && (
                        <View className="bg-accent/10 rounded-xl p-3 mb-4">
                            <View className="flex-row items-center">
                                <FontAwesome name="user" size={16} color="#AD49E1" />
                                <StyledText variant="medium" className="text-text-secondary text-xs ml-2">
                                    Customer
                                </StyledText>
                            </View>
                            <StyledText variant="semibold" className="text-accent text-lg mt-1">
                                {sale.customer_name}
                            </StyledText>
                        </View>
                    )}

                    <View className="border-t border-background pt-4">
                        <StyledText variant="medium" className="text-text-secondary text-xs mb-2">
                            Total Amount
                        </StyledText>
                        <StyledText variant="extrabold" className="text-primary text-3xl">
                            ₱{sale.total.toFixed(2)}
                        </StyledText>
                        <StyledText variant="regular" className="text-text-secondary text-sm mt-1">
                            {sale.items_count} {sale.items_count === 1 ? 'item' : 'items'}
                        </StyledText>
                    </View>
                </View>

                {/* Items List */}
                <View className="mt-4 mx-4">
                    <StyledText variant="extrabold" className="text-primary text-lg mb-3">
                        Items Sold
                    </StyledText>

                    {sale.items.map((item, index) => (
                        <View
                            key={item.id}
                            className={`bg-white rounded-xl p-4 ${index < sale.items.length - 1 ? 'mb-3' : ''}`}
                        >
                            <View className="flex-row justify-between items-start">
                                <View className="flex-1">
                                    <StyledText variant="semibold" className="text-primary text-base mb-1">
                                        {item.product_name}
                                    </StyledText>
                                    <StyledText variant="regular" className="text-text-secondary text-sm">
                                        {item.quantity} × ₱{item.price.toFixed(2)}
                                    </StyledText>
                                </View>
                                <StyledText variant="extrabold" className="text-secondary text-lg">
                                    ₱{(item.quantity * item.price).toFixed(2)}
                                </StyledText>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Total Summary */}
                <View className="bg-primary mx-4 mt-4 rounded-2xl p-4">
                    <View className="flex-row justify-between items-center">
                        <StyledText variant="semibold" className="text-white text-lg">
                            Grand Total
                        </StyledText>
                        <StyledText variant="extrabold" className="text-white text-2xl">
                            ₱{sale.total.toFixed(2)}
                        </StyledText>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
