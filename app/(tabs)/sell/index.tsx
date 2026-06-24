import { StyledText } from '@/components/elements';
import {
  FilterChips,
  SaleRow,
  SalesEmptyState,
  SalesFilterModal,
  SalesSkeleton,
} from '@/components/sell';
import {
  MoneyText,
  Pagination,
  ReceiptHero,
  ReceiptHeroDivider,
  ReceiptHeroMeta,
} from '@/components/ui';
import { SalesFilterState, ITEMS_PER_PAGE } from '@/constants';
import { InsufficientStockError } from '@/database/sales';
import { useCredits, useProducts, useSales } from '@/hooks';
import { NewSaleItem, Product, SaleWithItems } from '@/types';
import { Alert, parseStoredTimestamp } from '@/utils';
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Sales() {
  const { tab: initialTabParam } = useLocalSearchParams<{ tab?: string }>();
  const [activeTab, setActiveTab] = useState<'new-sale' | 'history'>('new-sale');

  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [filterModalVisible, setFilterModalVisible] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [filters, setFilters] = useState<SalesFilterState>({
    paymentType: 'all',
    dateRange: 'all',
  });

  // Sync tab URL param
  useEffect(() => {
    if (initialTabParam === 'history') {
      setActiveTab('history');
    } else if (initialTabParam === 'new-sale') {
      setActiveTab('new-sale');
    }
  }, [initialTabParam]);

  const router = useRouter();
  const { getTodayStatsQuery, getAllSalesQuery, insertSaleMutation } = useSales();
  const { useCustomers } = useCredits();
  const { getAllProductsQuery } = useProducts();

  // Fetch today's stats
  const { data: stats, refetch: refetchStats } = getTodayStatsQuery;

  // Fetch all sales
  const {
    data: sales = [],
    refetch: refetchSales,
    isLoading,
  } = getAllSalesQuery;

  // POS State
  const [selectedItems, setSelectedItems] = useState<NewSaleItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [paymentType, setPaymentType] = useState<'cash' | 'credit'>('cash');
  const [showCheckout, setShowCheckout] = useState<boolean>(false);
  const [selectedCustomer, setSelectedCustomer] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [showCustomerPicker, setShowCustomerPicker] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Fetch products & customers
  const { data: products = [], isLoading: isProductsLoading } = getAllProductsQuery;
  const { data: customers = [] } = useCustomers();

  // Filter products based on search
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleAddItem = (product: Product) => {
    const existing = selectedItems.find(
      (item) => item.product_id === product.id,
    );

    if (existing) {
      if (existing.quantity >= product.quantity) {
        Alert.alert(
          'Insufficient Stock',
          `Only ${product.quantity} items available`,
        );
        return;
      }
      setSelectedItems((prev) =>
        prev.map((item) =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        ),
      );
    } else {
      if (product.quantity <= 0) {
        Alert.alert('Out of Stock', 'This product is currently out of stock');
        return;
      }
      setSelectedItems((prev) => [
        ...prev,
        {
          product_id: product.id,
          product_name: product.name,
          price: product.price,
          quantity: 1,
          stock: product.quantity,
        },
      ]);
    }
  };

  const handleUpdateQuantity = (productId: number, delta: number) => {
    setSelectedItems((prev) => {
      const updated = prev
        .map((item) => {
          if (item.product_id === productId) {
            const newQuantity = item.quantity + delta;
            if (newQuantity <= 0) return null;
            if (newQuantity > item.stock) {
              Alert.alert(
                'Insufficient Stock',
                `Only ${item.stock} items available`,
              );
              return item;
            }
            return { ...item, quantity: newQuantity };
          }
          return item;
        })
        .filter(Boolean) as NewSaleItem[];
      return updated;
    });
  };

  const getTotalAmount = () => {
    return selectedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
  };

  const handleCheckout = () => {
    if (selectedItems.length === 0) {
      Alert.alert('No Items', 'Please add items to the sale');
      return;
    }
    setShowCheckout(true);
  };

  const handleCompleteSale = async () => {
    if (paymentType === 'credit' && !selectedCustomer) {
      Alert.alert(
        'Customer Required',
        'Please select a customer for credit sales',
      );
      return;
    }

    setIsProcessing(true);
    try {
      await insertSaleMutation.mutateAsync({
        items: selectedItems.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price,
        })),
        payment_type: paymentType,
        customer_name: selectedCustomer?.name,
        customer_credit_id: selectedCustomer?.id,
      });

      // Clear cart and close modals
      setSelectedItems([]);
      setSearchQuery('');
      setPaymentType('cash');
      setSelectedCustomer(null);
      setShowCheckout(false);

      Alert.alert('Success', 'Sale completed successfully', [
        {
          text: 'OK',
          onPress: () => {
            // Switch to history tab to see the sale
            setActiveTab('history');
          },
        },
      ]);
    } catch (err) {
      if (err instanceof InsufficientStockError) {
        Alert.alert(
          'Stock changed',
          `Only ${err.available} of ${err.requested} available now. Please refresh.`,
        );
        return;
      }
      Alert.alert('Error', 'Failed to complete sale. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

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

  const renderProductItem = ({ item }: { item: Product }) => {
    const selectedItem = selectedItems.find((si) => si.product_id === item.id);
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
            <StyledText
              variant="semibold"
              className="text-warm-900 text-base mb-1"
            >
              {item.name}
            </StyledText>
            <StyledText
              variant="regular"
              className="text-warm-600 text-xs mb-2"
            >
              SKU: {item.sku}
            </StyledText>
            <View className="flex-row items-center gap-2">
              <StyledText
                variant="extrabold"
                className="text-secondary-600 text-lg"
              >
                <MoneyText
                  value={item.price}
                  fromPesos
                  className="text-secondary-600 text-lg"
                />
              </StyledText>
              <View
                className={`px-2 py-1 rounded-full ${isOutOfStock ? 'bg-red-100' : isLowStock ? 'bg-orange-100' : 'bg-green-100'}`}
              >
                <StyledText
                  variant="medium"
                  className={`text-xs ${isOutOfStock ? 'text-red-600' : isLowStock ? 'text-orange-600' : 'text-green-600'}`}
                >
                  Stock: {item.quantity}
                </StyledText>
              </View>
            </View>
          </View>

          {selectedItem && (
            <View className="flex-row items-center bg-secondary-500/20 rounded-xl px-2 py-1">
              <Pressable
                onPress={() => handleUpdateQuantity(item.id, -1)}
                className="w-8 h-8 items-center justify-center active:opacity-50"
              >
                <FontAwesome name="minus" size={14} color="#B45309" />
              </Pressable>
              <StyledText
                variant="extrabold"
                className="text-secondary-600 text-base mx-3"
              >
                {selectedItem.quantity}
              </StyledText>
              <Pressable
                onPress={() => handleUpdateQuantity(item.id, 1)}
                className="w-8 h-8 items-center justify-center active:opacity-50"
              >
                <FontAwesome name="plus" size={14} color="#B45309" />
              </Pressable>
            </View>
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Fixed cinnamon header */}
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: 'timing', duration: 320 }}
      >
        <View className="bg-cinnamon-500 px-5 pt-3 pb-5">
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
                {activeTab === 'new-sale' ? 'New Sale' : 'My Sales'}
              </StyledText>
              <StyledText
                variant="regular"
                className="text-paper-200 text-sm mt-1 opacity-90"
              >
                {activeTab === 'new-sale'
                  ? 'Record a transaction'
                  : filteredSales.length === 0
                  ? 'Start your resibo book'
                  : `${filteredSales.length} ${filteredSales.length === 1 ? 'resibo' : 'resibos'} on file`}
              </StyledText>
            </View>

            {activeTab === 'history' && (
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
            )}
          </View>

          {/* Segment switch */}
          <View className="flex-row bg-cinnamon-600/30 p-1 rounded-xl mt-4">
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('new-sale')}
              className={`flex-1 py-2.5 rounded-lg items-center ${activeTab === 'new-sale' ? 'bg-persimmon-500' : ''}`}
            >
              <StyledText
                variant="bold"
                className={`text-sm ${activeTab === 'new-sale' ? 'text-paper-50' : 'text-paper-200'}`}
              >
                New Sale
              </StyledText>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('history')}
              className={`flex-1 py-2.5 rounded-lg items-center ${activeTab === 'history' ? 'bg-persimmon-500' : ''}`}
            >
              <StyledText
                variant="bold"
                className={`text-sm ${activeTab === 'history' ? 'text-paper-50' : 'text-paper-200'}`}
              >
                History
              </StyledText>
            </TouchableOpacity>
          </View>
        </View>
      </MotiView>

      {/* Main Switchable Contents */}
      {activeTab === 'new-sale' ? (
        // POS / Checkout Contents
        <View className="flex-1">
          {/* Search Bar */}
          <View className="bg-white mx-4 mt-4 mb-2 rounded-xl px-4 py-3 flex-row items-center shadow-sm">
            <FontAwesome name="search" size={20} color="#B45309" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search products..."
              placeholderTextColor="#B45309"
              className="flex-1 ml-3 text-warm-900 font-stack-sans"
            />
            {searchQuery.length > 0 && (
              <Pressable
                onPress={() => setSearchQuery('')}
                className="active:opacity-50"
              >
                <FontAwesome name="times-circle" size={18} color="#B45309" />
              </Pressable>
            )}
          </View>

          {/* Products List */}
          {isProductsLoading ? (
            <View className="flex-1 justify-center items-center">
              <ActivityIndicator size="large" color="#B45309" />
            </View>
          ) : (
            <FlatList
              data={filteredProducts}
              renderItem={renderProductItem}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={{
                paddingTop: 8,
                paddingBottom: 120,
              }}
              ListEmptyComponent={
                <View className="flex-1 justify-center items-center py-12">
                  <FontAwesome
                    name="inbox"
                    size={64}
                    color="#B45309"
                    style={{ opacity: 0.3 }}
                  />
                  <StyledText
                    variant="semibold"
                    className="text-warm-600 text-lg mt-4"
                  >
                    No products found
                  </StyledText>
                </View>
              }
            />
          )}

          {/* Floating Cart Bubble */}
          {selectedItems.length > 0 && (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleCheckout}
              className="absolute rounded-2xl"
              style={{
                bottom: 20,
                right: 10,
                zIndex: 10,
              }}
            >
              <View className="px-5 py-4 flex-row items-center gap-3">
                <View className="bg-secondary-500 rounded-full w-14 h-14 items-center justify-center shadow-lg">
                  <FontAwesome name="shopping-cart" size={22} color="#fff" />
                  <View className="absolute -top-1 -right-2 bg-secondary-500 rounded-full w-6 h-6 items-center justify-center">
                    <StyledText variant="extrabold" className="text-white text-xs">
                      {selectedItems.length}
                    </StyledText>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        // Sales History Contents
        <View className="flex-1">
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
                {/* Today's Slip hero */}
                {showHero && stats && (
                  <MotiView
                    from={{ opacity: 0, translateY: 18 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 480, delay: 80 }}
                  >
                    <View className="px-4 mt-2 mb-4">
                      <ReceiptHero tone="persimmon" headerLabel="Today Slip">
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

                {/* Filter chips strip */}
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
                    onNewSale={() => setActiveTab('new-sale')}
                    hasSales={sales.length > 0}
                  />
                </View>
              )
            }
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
      )}

      {/* Checkout Modal */}
      <Modal
        visible={showCheckout}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCheckout(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl px-4 pt-6 pb-8">
            <View className="flex-row justify-between items-center mb-4">
              <StyledText variant="extrabold" className="text-warm-900 text-xl">
                Review & Checkout
              </StyledText>
              <Pressable
                hitSlop={20}
                onPress={() => setShowCheckout(false)}
                className="mr-2"
              >
                <FontAwesome name="times" size={24} color="#B45309" />
              </Pressable>
            </View>

            <ScrollView className="max-h-64 mb-4">
              {selectedItems.map((item) => (
                <View
                  key={item.product_id}
                  className="flex-row justify-between py-3 border-b border-warm-100"
                >
                  <View className="flex-1">
                    <StyledText
                      variant="medium"
                      className="text-warm-900 text-sm"
                    >
                      {item.product_name}
                    </StyledText>
                    <StyledText
                      variant="regular"
                      className="text-warm-600 text-xs"
                    >
                      {item.quantity} ×{' '}
                      <MoneyText
                        value={item.price}
                        fromPesos
                        className="text-secondary-600 text-lg"
                      />
                    </StyledText>
                  </View>
                  <StyledText
                    variant="semibold"
                    className="text-secondary-600 text-base"
                  >
                    <MoneyText
                      value={item.quantity * item.price}
                      fromPesos
                      className="text-secondary-600 text-base"
                    />
                  </StyledText>
                </View>
              ))}
            </ScrollView>

            {/* Payment Type */}
            <View className="mb-4">
              <StyledText
                variant="semibold"
                className="text-warm-900 text-sm mb-2"
              >
                Payment Type
              </StyledText>
              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => setPaymentType('cash')}
                  className={`flex-1 rounded-xl p-3 border-2 ${paymentType === 'cash' ? 'border-secondary bg-secondary-500/10' : 'border-warm-100'}`}
                >
                  <StyledText
                    variant={paymentType === 'cash' ? 'extrabold' : 'medium'}
                    className={`text-center ${paymentType === 'cash' ? 'text-secondary-600' : 'text-warm-600'}`}
                  >
                    Cash
                  </StyledText>
                </Pressable>
                <Pressable
                  onPress={() => setPaymentType('credit')}
                  className={`flex-1 rounded-xl p-3 border-2 ${paymentType === 'credit' ? 'border-accent bg-secondary-500/10' : 'border-warm-100'}`}
                >
                  <StyledText
                    variant={paymentType === 'credit' ? 'extrabold' : 'medium'}
                    className={`text-center ${paymentType === 'credit' ? 'text-secondary-600' : 'text-warm-600'}`}
                  >
                    Credit
                  </StyledText>
                </Pressable>
              </View>
            </View>

            {/* Customer Picker for Credit */}
            {paymentType === 'credit' && (
              <View className="mb-4">
                <StyledText
                  variant="semibold"
                  className="text-warm-900 text-sm mb-2"
                >
                  Customer
                </StyledText>
                <Pressable
                  onPress={() => setShowCustomerPicker(true)}
                  className="bg-background rounded-xl p-3 flex-row justify-between items-center"
                >
                  <StyledText
                    variant="medium"
                    className={
                      selectedCustomer ? 'text-warm-900' : 'text-warm-600'
                    }
                  >
                    {selectedCustomer
                      ? selectedCustomer.name
                      : 'Select customer'}
                  </StyledText>
                  <FontAwesome name="chevron-down" size={14} color="#B45309" />
                </Pressable>
              </View>
            )}

            {/* Total */}
            <View className="bg-warm-50 rounded-xl p-4 mb-4">
              <View className="flex-row justify-between items-center">
                <StyledText
                  variant="semibold"
                  className="text-warm-900 text-lg"
                >
                  Total Amount
                </StyledText>
                <StyledText
                  variant="extrabold"
                  className="text-warm-900 text-2xl"
                >
                  <MoneyText
                    value={getTotalAmount()}
                    fromPesos
                    className="text-warm-900 text-2xl"
                  />
                </StyledText>
              </View>
            </View>

            {/* Complete Button */}
            <Pressable
              onPress={handleCompleteSale}
              disabled={
                isProcessing || (paymentType === 'credit' && !selectedCustomer)
              }
              className={`bg-secondary-500 rounded-xl p-4 ${isProcessing || (paymentType === 'credit' && !selectedCustomer) ? 'opacity-50' : 'active:opacity-70'}`}
            >
              {isProcessing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <StyledText
                  variant="extrabold"
                  className="text-white text-center text-base"
                >
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
        animationType="fade"
        onRequestClose={() => setShowCustomerPicker(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl px-4 pt-6 pb-8">
            <View className="flex-row justify-between items-center mb-4">
              <StyledText variant="extrabold" className="text-warm-900 text-xl">
                Select Customer
              </StyledText>
              <Pressable
                onPress={() => setShowCustomerPicker(false)}
                className="active:opacity-50"
              >
                <FontAwesome name="times" size={24} color="#B45309" />
              </Pressable>
            </View>

            <ScrollView className="max-h-96">
              {customers.map((customer) => (
                <Pressable
                  key={customer.id}
                  onPress={() => {
                    setSelectedCustomer({
                      id: customer.id,
                      name: customer.name,
                    });
                    setShowCustomerPicker(false);
                  }}
                  className="py-3 px-4 rounded-xl mb-2 active:bg-background"
                >
                  <StyledText
                    variant="medium"
                    className="text-warm-900 text-base"
                  >
                    {customer.name}
                  </StyledText>
                  <StyledText
                    variant="regular"
                    className="text-warm-600 text-xs mt-1"
                  >
                    Balance:{' '}
                    <MoneyText
                      value={customer.outstanding_balance}
                      fromPesos
                      className="text-warm-600 text-xs"
                    />
                  </StyledText>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

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
