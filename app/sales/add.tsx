import StyledText from "@/components/elements/StyledText";
import { Alert } from "@/utils/alert";
import { getAllCustomers } from "@/db/credits";
import { getAllProducts, Product } from "@/db/products";
import { insertSale } from "@/db/sales";
import { NewSaleItem } from "@/types/sales.types";
import { FontAwesome } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Modal,
    Pressable,
    ScrollView,
    TextInput,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AddSale() {
    const [selectedItems, setSelectedItems] = useState<NewSaleItem[]>([]);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [paymentType, setPaymentType] = useState<'cash' | 'credit'>('cash');
    const [showCheckout, setShowCheckout] = useState<boolean>(false);
    const [selectedCustomer, setSelectedCustomer] = useState<{ id: number; name: string } | null>(null);
    const [showCustomerPicker, setShowCustomerPicker] = useState<boolean>(false);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    
    const router = useRouter();
    const queryClient = useQueryClient();

    // Fetch products
    const { data: products = [], isLoading } = useQuery({
        queryKey: ['products'],
        queryFn: getAllProducts,
    });

    // Fetch customers for credit sales
    const { data: customers = [] } = useQuery({
        queryKey: ['customers'],
        queryFn: () => getAllCustomers('all', 'name_asc'),
    });

    // Filter products based on search
    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleAddItem = (product: Product) => {
        const existing = selectedItems.find(item => item.product_id === product.id);
        
        if (existing) {
            if (existing.quantity >= product.quantity) {
                Alert.alert("Insufficient Stock", `Only ${product.quantity} items available`);
                return;
            }
            setSelectedItems(prev =>
                prev.map(item =>
                    item.product_id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                )
            );
        } else {
            if (product.quantity <= 0) {
                Alert.alert("Out of Stock", "This product is currently out of stock");
                return;
            }
            setSelectedItems(prev => [...prev, {
                product_id: product.id,
                product_name: product.name,
                price: product.price,
                quantity: 1,
                stock: product.quantity
            }]);
        }
    };

    const handleUpdateQuantity = (productId: number, delta: number) => {
        setSelectedItems(prev => {
            const updated = prev.map(item => {
                if (item.product_id === productId) {
                    const newQuantity = item.quantity + delta;
                    if (newQuantity <= 0) return null;
                    if (newQuantity > item.stock) {
                        Alert.alert("Insufficient Stock", `Only ${item.stock} items available`);
                        return item;
                    }
                    return { ...item, quantity: newQuantity };
                }
                return item;
            }).filter(Boolean) as NewSaleItem[];
            return updated;
        });
    };

    const getTotalAmount = () => {
        return selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    };

    const handleCheckout = () => {
        if (selectedItems.length === 0) {
            Alert.alert("No Items", "Please add items to the sale");
            return;
        }
        setShowCheckout(true);
    };

    const handleCompleteSale = async () => {
        if (paymentType === 'credit' && !selectedCustomer) {
            Alert.alert("Customer Required", "Please select a customer for credit sales");
            return;
        }

        setIsProcessing(true);
        try {
            await insertSale(
                selectedItems.map(item => ({
                    product_id: item.product_id,
                    quantity: item.quantity,
                    price: item.price
                })),
                paymentType,
                selectedCustomer?.name,
                selectedCustomer?.id
            );

            // Refetch queries
            await queryClient.invalidateQueries({ queryKey: ['sales'] });
            await queryClient.invalidateQueries({ queryKey: ['sales-stats'] });
            await queryClient.invalidateQueries({ queryKey: ['products'] });
            
            Alert.alert("Success", "Sale completed successfully", [
                { text: "OK", onPress: () => router.back() }
            ]);
        } catch (error) {
            Alert.alert("Error", "Failed to complete sale. Please try again.");
        } finally {
            setIsProcessing(false);
        }
    };

    const renderProductItem = ({ item }: { item: Product }) => {
        const selectedItem = selectedItems.find(si => si.product_id === item.id);
        const isOutOfStock = item.quantity <= 0;
        const isLowStock = item.quantity > 0 && item.quantity <= 5;

        return (
            <Pressable
                onPress={() => !isOutOfStock && handleAddItem(item)}
                disabled={isOutOfStock}
                className={`bg-white mx-4 mb-3 rounded-xl p-4 ${isOutOfStock ? 'opacity-50' : 'active:opacity-70'}`}
            >
                <View className="flex-row justify-between items-start">
                    <View className="flex-1">
                        <StyledText variant="semibold" className="text-primary text-base mb-1">
                            {item.name}
                        </StyledText>
                        <StyledText variant="regular" className="text-text-secondary text-xs mb-2">
                            SKU: {item.sku}
                        </StyledText>
                        <View className="flex-row items-center gap-2">
                            <StyledText variant="extrabold" className="text-secondary text-lg">
                                ₱{item.price.toFixed(2)}
                            </StyledText>
                            <View className={`px-2 py-1 rounded-full ${isOutOfStock ? 'bg-red-100' : isLowStock ? 'bg-orange-100' : 'bg-green-100'}`}>
                                <StyledText variant="medium" className={`text-xs ${isOutOfStock ? 'text-red-600' : isLowStock ? 'text-orange-600' : 'text-green-600'}`}>
                                    Stock: {item.quantity}
                                </StyledText>
                            </View>
                        </View>
                    </View>

                    {selectedItem && (
                        <View className="flex-row items-center bg-accent/20 rounded-xl px-2 py-1">
                            <Pressable
                                onPress={() => handleUpdateQuantity(item.id, -1)}
                                className="w-8 h-8 items-center justify-center active:opacity-50"
                            >
                                <FontAwesome name="minus" size={14} color="#7A1CAC" />
                            </Pressable>
                            <StyledText variant="extrabold" className="text-secondary text-base mx-3">
                                {selectedItem.quantity}
                            </StyledText>
                            <Pressable
                                onPress={() => handleUpdateQuantity(item.id, 1)}
                                className="w-8 h-8 items-center justify-center active:opacity-50"
                            >
                                <FontAwesome name="plus" size={14} color="#7A1CAC" />
                            </Pressable>
                        </View>
                    )}
                </View>
            </Pressable>
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            {/* Header */}
            <View className="px-4 py-4">
                <View className="flex-row items-center gap-3">
                    <Pressable hitSlop={20} onPress={() => router.back()} className="active:opacity-50">
                        <FontAwesome name="arrow-left" size={20} color="#2E073F" />
                    </Pressable>
                    <StyledText variant="extrabold" className="text-primary text-2xl">
                        New Sale
                    </StyledText>
                </View>
            </View>

            {/* Search Bar */}
            <View className="bg-white mx-4 mt-4 mb-2 rounded-xl px-4 py-3 flex-row items-center shadow-sm">
                <FontAwesome name="search" size={16} color="#AD49E1" />
                <TextInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Search products..."
                    placeholderTextColor="#AD49E1"
                    className="flex-1 ml-3 text-primary font-stack-sans"
                    autoFocus
                />
                {searchQuery.length > 0 && (
                    <Pressable onPress={() => setSearchQuery("")} className="active:opacity-50">
                        <FontAwesome name="times-circle" size={18} color="#AD49E1" />
                    </Pressable>
                )}
            </View>

            {/* Products List */}
            {isLoading ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#7A1CAC" />
                </View>
            ) : (
                <FlatList
                    data={filteredProducts}
                    renderItem={renderProductItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={{ 
                        paddingTop: 8, 
                        paddingBottom: 120
                    }}
                    ListEmptyComponent={
                        <View className="flex-1 justify-center items-center py-12">
                            <FontAwesome name="inbox" size={64} color="#AD49E1" style={{ opacity: 0.3 }} />
                            <StyledText variant="semibold" className="text-text-secondary text-lg mt-4">
                                No products found
                            </StyledText>
                        </View>
                    }
                />
            )}

            {/* Floating Cart Bubble */}
            {selectedItems.length > 0 && (
                <Pressable
                    onPress={handleCheckout}
                    className="absolute bg-secondary rounded-2xl shadow-2xl active:opacity-90"
                    style={{
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 8,
                        bottom: 140,
                        right: 10
                    }}
                >
                    <View className="px-5 py-4 flex-row items-center gap-3">
                        <View className="bg-white/20 rounded-full w-10 h-10 items-center justify-center">
                            <FontAwesome name="shopping-cart" size={18} color="#fff" />
                            <View className="absolute -top-1 -right-1 bg-accent rounded-full w-5 h-5 items-center justify-center">
                                <StyledText variant="extrabold" className="text-white text-xs">
                                    {selectedItems.length}
                                </StyledText>
                            </View>
                        </View>
                        <View>
                            <StyledText variant="medium" className="text-white/80 text-xs">
                                {selectedItems.length} {selectedItems.length === 1 ? 'item' : 'items'}
                            </StyledText>
                            <StyledText variant="extrabold" className="text-white text-lg">
                                ₱{getTotalAmount().toFixed(2)}
                            </StyledText>
                        </View>
                        <FontAwesome name="chevron-right" size={16} color="#fff" style={{ marginLeft: 8 }} />
                    </View>
                </Pressable>
            )}

            {/* Checkout Modal */}
            <Modal
                visible={showCheckout}
                transparent
                animationType="slide"
                onRequestClose={() => setShowCheckout(false)}
            >
                <View className="flex-1 bg-black/50 justify-end">
                    <View className="bg-white rounded-t-3xl px-4 pt-6 pb-8">
                        <View className="flex-row justify-between items-center mb-4">
                            <StyledText variant="extrabold" className="text-primary text-xl">
                                Review & Checkout
                            </StyledText>
                            <Pressable hitSlop={20} onPress={() => setShowCheckout(false)} className="mr-2">
                                <FontAwesome name="times" size={24} color="#2E073F" />
                            </Pressable>
                        </View>

                        <ScrollView className="max-h-64 mb-4">
                            {selectedItems.map(item => (
                                <View key={item.product_id} className="flex-row justify-between py-3 border-b border-background">
                                    <View className="flex-1">
                                        <StyledText variant="medium" className="text-primary text-sm">
                                            {item.product_name}
                                        </StyledText>
                                        <StyledText variant="regular" className="text-text-secondary text-xs">
                                            {item.quantity} × ₱{item.price.toFixed(2)}
                                        </StyledText>
                                    </View>
                                    <StyledText variant="semibold" className="text-secondary text-base">
                                        ₱{(item.quantity * item.price).toFixed(2)}
                                    </StyledText>
                                </View>
                            ))}
                        </ScrollView>

                        {/* Payment Type */}
                        <View className="mb-4">
                            <StyledText variant="semibold" className="text-primary text-sm mb-2">
                                Payment Type
                            </StyledText>
                            <View className="flex-row gap-3">
                                <Pressable
                                    onPress={() => setPaymentType('cash')}
                                    className={`flex-1 rounded-xl p-3 border-2 ${paymentType === 'cash' ? 'border-secondary bg-secondary/10' : 'border-background'}`}
                                >
                                    <StyledText variant={paymentType === 'cash' ? 'extrabold' : 'medium'} className={`text-center ${paymentType === 'cash' ? 'text-secondary' : 'text-text-secondary'}`}>
                                        Cash
                                    </StyledText>
                                </Pressable>
                                <Pressable
                                    onPress={() => setPaymentType('credit')}
                                    className={`flex-1 rounded-xl p-3 border-2 ${paymentType === 'credit' ? 'border-accent bg-accent/10' : 'border-background'}`}
                                >
                                    <StyledText variant={paymentType === 'credit' ? 'extrabold' : 'medium'} className={`text-center ${paymentType === 'credit' ? 'text-accent' : 'text-text-secondary'}`}>
                                        Credit
                                    </StyledText>
                                </Pressable>
                            </View>
                        </View>

                        {/* Customer Picker for Credit */}
                        {paymentType === 'credit' && (
                            <View className="mb-4">
                                <StyledText variant="semibold" className="text-primary text-sm mb-2">
                                    Customer
                                </StyledText>
                                <Pressable
                                    onPress={() => setShowCustomerPicker(true)}
                                    className="bg-background rounded-xl p-3 flex-row justify-between items-center"
                                >
                                    <StyledText variant="medium" className={selectedCustomer ? 'text-primary' : 'text-text-secondary'}>
                                        {selectedCustomer ? selectedCustomer.name : 'Select customer'}
                                    </StyledText>
                                    <FontAwesome name="chevron-down" size={14} color="#7A1CAC" />
                                </Pressable>
                            </View>
                        )}

                        {/* Total */}
                        <View className="bg-primary/5 rounded-xl p-4 mb-4">
                            <View className="flex-row justify-between items-center">
                                <StyledText variant="semibold" className="text-primary text-lg">
                                    Total Amount
                                </StyledText>
                                <StyledText variant="extrabold" className="text-primary text-2xl">
                                    ₱{getTotalAmount().toFixed(2)}
                                </StyledText>
                            </View>
                        </View>

                        {/* Complete Button */}
                        <Pressable
                            onPress={handleCompleteSale}
                            disabled={isProcessing || (paymentType === 'credit' && !selectedCustomer)}
                            className={`bg-secondary rounded-xl p-4 ${(isProcessing || (paymentType === 'credit' && !selectedCustomer)) ? 'opacity-50' : 'active:opacity-70'}`}
                        >
                            {isProcessing ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <StyledText variant="extrabold" className="text-white text-center text-base">
                                    Complete Sale
                                </StyledText>
                            )}
                        </Pressable>
                    </View>
                </View>
            </Modal>

            {/* Customer Picker Modal */}
            <Modal
                visible={showCustomerPicker}
                transparent
                animationType="slide"
                onRequestClose={() => setShowCustomerPicker(false)}
            >
                <View className="flex-1 bg-black/50 justify-end">
                    <View className="bg-white rounded-t-3xl px-4 pt-6 pb-8">
                        <View className="flex-row justify-between items-center mb-4">
                            <StyledText variant="extrabold" className="text-primary text-xl">
                                Select Customer
                            </StyledText>
                            <Pressable onPress={() => setShowCustomerPicker(false)} className="active:opacity-50">
                                <FontAwesome name="times" size={24} color="#2E073F" />
                            </Pressable>
                        </View>

                        <ScrollView className="max-h-96">
                            {customers.map(customer => (
                                <Pressable
                                    key={customer.id}
                                    onPress={() => {
                                        setSelectedCustomer({ id: customer.id, name: customer.name });
                                        setShowCustomerPicker(false);
                                    }}
                                    className="py-3 px-4 rounded-xl mb-2 active:bg-background"
                                >
                                    <StyledText variant="medium" className="text-primary text-base">
                                        {customer.name}
                                    </StyledText>
                                    <StyledText variant="regular" className="text-text-secondary text-xs mt-1">
                                        Balance: ₱{customer.outstanding_balance.toFixed(2)}
                                    </StyledText>
                                </Pressable>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}