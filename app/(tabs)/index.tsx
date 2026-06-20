import StyledText from '@/components/elements/StyledText';
import CustomModal from '@/components/ui/Modal';
import Pagination from '@/components/ui/Pagination';
import MoneyText from '@/components/ui/MoneyText';
import { GUIDE_TIPS } from '@/constants/guide';
import { useProducts } from '@/hooks/useProducts';
import { useInventory } from '@/hooks/useInventory';
import { useDialogStore } from '@/stores/DialogStore';
import { useToastStore } from '@/stores/ToastStore';
import { Product } from '@/types/products.types';
import { FontAwesome } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  FlatList,
  Modal,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getStockStatus } from '@/utils/formatters';

const LOW_STOCK_THRESHOLD = 5;
const ITEMS_PER_PAGE = 4;

interface PendingAction {
  product: Product;
  type: 'restock' | 'sale';
}

export default function InventoryScreen() {
  const [search, setSearch] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [showLowOnly, setShowLowOnly] = useState<boolean>(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(
    null,
  );
  const [quantityInput, setQuantityInput] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [showGuide, setShowGuide] = useState<boolean>(false);

  const router = useRouter();

  const addToast = useToastStore((state) => state.addToast);

  const { visible: dialogVisible, showDialog, hideDialog } = useDialogStore();

  const debounceRef = useRef<number | null>(null);

  const { getAllProductsQuery } = useProducts();
  const { insertInventoryMutation } = useInventory();

  // Debounce search input
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);
  }, [search]);

  // Reset to first page when search or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, showLowOnly]);

  // Query products
  const {
    data: products,
    isLoading,
    isRefetching,
    refetch,
  } = getAllProductsQuery();

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  useFocusEffect(
    useCallback(() => {
      const backAction = () => {
        showDialog({
          title: 'Exit App',
          message: 'Are you sure you want to exit the app?',
          showCloseButton: false,
        });
        return true;
      };

      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        backAction,
      );

      return () => backHandler.remove();
    }, [showDialog]),
  );

  const handleExitApp = () => {
    hideDialog();
    BackHandler.exitApp();
  };

  const handleCancelExit = () => {
    hideDialog();
  };

  // Mutation for inventory transaction
  const transactionMutation = insertInventoryMutation();

  const filtered = useMemo(() => {
    if (!products) return [];
    let list = products;
    if (debouncedSearch) {
      const term = debouncedSearch.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.sku.toLowerCase().includes(term),
      );
    }
    if (showLowOnly)
      list = list.filter((p) => p.quantity < LOW_STOCK_THRESHOLD);
    return list;
  }, [products, debouncedSearch, showLowOnly]);

  // Paginated products
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filtered.slice(startIndex, endIndex);
  }, [filtered, currentPage]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

  const openAction = useCallback(
    (product: Product, type: 'restock' | 'sale') => {
      setPendingAction({ product, type });
      setQuantityInput('');
    },
    [],
  );

  const closeAction = useCallback(() => {
    setPendingAction(null);
    setQuantityInput('');
  }, []);

  const submitAction = useCallback(() => {
    if (!pendingAction) return;
    const qty = parseInt(quantityInput, 10);
    if (isNaN(qty) || qty <= 0) {
      addToast({
        message: 'Please enter a valid quantity',
        variant: 'error',
        duration: 1800,
        position: 'top-center',
      });
      return;
    }

    if (pendingAction.type === 'sale' && qty > pendingAction.product.quantity) {
      addToast({
        message: 'Not enough stock available',
        variant: 'error',
        duration: 1800,
        position: 'top-center',
      });
      return;
    }

    transactionMutation.mutate({
      product_id: pendingAction.product.id,
      type: pendingAction.type,
      quantity: qty,
    });

    closeAction();
  }, [
    pendingAction,
    quantityInput,
    transactionMutation,
    closeAction,
    addToast,
  ]);

  const renderItem = ({ item }: { item: Product }) => {
    const stockStatus = getStockStatus(item.quantity);

    return (
      <View className="mx-4 my-2 bg-white rounded-2xl shadow-sm border border-warm-100 overflow-hidden">
        <View className="p-4">
          <View className="flex-row justify-between items-start mb-2">
            <View className="flex-1 mr-3">
              <StyledText
                variant="semibold"
                className="text-lg text-warm-900 mb-1"
              >
                {item.name}
              </StyledText>
              <StyledText
                variant="regular"
                className="text-sm text-warm-600 mb-2"
              >
                SKU: {item.sku}
              </StyledText>
            </View>
            <View className={`px-2 py-1 rounded-full ${stockStatus.bg}`}>
              <StyledText
                variant="medium"
                className={`text-xs ${stockStatus.color}`}
              >
                {stockStatus.label}
              </StyledText>
            </View>
          </View>

          <View className="flex-row justify-between items-center">
            <View className="flex-row items-baseline gap-3">
              <View>
                <StyledText
                  variant="regular"
                  className="text-xs text-warm-600"
                >
                  Quantity
                </StyledText>
                <StyledText
                  variant="extrabold"
                  className={`text-xl ${stockStatus.color}`}
                >
                  {item.quantity}
                </StyledText>
              </View>
              <View>
                <StyledText
                  variant="regular"
                  className="text-xs text-warm-600"
                >
                  Price
                </StyledText>
                <MoneyText
                  value={item.price * 100}
                  className="text-lg text-warm-900 font-semibold"
                />
              </View>
            </View>

            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => openAction(item, 'restock')}
                className="w-12 h-12 rounded-full bg-primary-500 items-center justify-center shadow-sm"
              >
                <FontAwesome name="plus" size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  // Summary footer stats
  const summary = useMemo(() => {
    if (!products) return { total: 0, low: 0, totalQty: 0 };
    const lowStockCount = products.filter(
      (p) => p.quantity < LOW_STOCK_THRESHOLD,
    ).length;
    const outOfStockCount = products.filter((p) => p.quantity === 0).length;

    return {
      total: products.length,
      low: lowStockCount,
      outOfStock: outOfStockCount,
      totalQty: products.reduce((acc, p) => acc + p.quantity, 0),
    };
  }, [products]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="px-6 pt-6 pb-4 bg-background">
        <View className="flex-row items-center justify-between mb-4">
          <StyledText
            variant="extrabold"
            className="text-warm-900 text-3xl"
          >
            Inventory
          </StyledText>
          <View className="flex-row gap-2 items-center">
            <TouchableOpacity
              onPress={() => setShowGuide(true)}
              className="w-10 h-10 rounded-full bg-white border border-warm-200 items-center justify-center shadow-sm"
            >
              <FontAwesome name="question-circle" size={18} color="#B45309" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/(edit-forms)/add-product' as any)}
              className="w-10 h-10 rounded-full bg-primary-500 items-center justify-center shadow-sm"
            >
              <FontAwesome name="plus" size={18} color="#ffffff" />
            </TouchableOpacity>
            {/* <TouchableOpacity
							onPress={() => router.push('/dev/reset')}
							className="w-10 h-10 rounded-full bg-primary-500 items-center justify-center shadow-sm"
						>
							<FontAwesome name="adjust" size={18} color="#ffffff" />
						</TouchableOpacity> */}
          </View>
        </View>

        {/* Search */}
        <View className="relative mb-3">
          <TextInput
            placeholder="Search products or SKU..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="#A8A29E"
            className="bg-white border border-warm-200 rounded-2xl px-4 py-3 pl-11 text-warm-900 shadow-sm"
          />
          <View className="absolute left-3 top-3.5">
            <FontAwesome name="search" size={18} color="#A8A29E" />
          </View>
          {search.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearch('')}
              className="absolute right-3 top-3.5"
            >
              <FontAwesome name="times-circle" size={18} color="#A8A29E" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filters & Stats */}
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => setShowLowOnly((prev) => !prev)}
            className={`flex-row items-center px-4 py-2 rounded-full ${showLowOnly ? 'bg-red-500' : 'bg-white border border-warm-200'}`}
          >
            <FontAwesome
              name="exclamation-triangle"
              size={14}
              color={showLowOnly ? '#ffffff' : '#EF4444'}
              style={{ marginRight: 6 }}
            />
            <StyledText
              variant="medium"
              className={`text-xs ${showLowOnly ? 'text-white' : 'text-red-500'}`}
            >
              Low Stock
            </StyledText>
          </TouchableOpacity>

          <View className="flex-row items-center gap-4">
            <View className="items-center">
              <StyledText
                variant="black"
                className="text-2xl text-warm-900"
              >
                {summary.total}
              </StyledText>
              <StyledText variant="light" className="text-sm text-warm-600">
                Total
              </StyledText>
            </View>
            <View className="items-center">
              <StyledText variant="black" className="text-2xl text-semantic-danger">
                {summary.low}
              </StyledText>
              <StyledText variant="light" className="text-sm text-warm-600">
                Low
              </StyledText>
            </View>
            <View className="items-center">
              <StyledText
                variant="black"
                className="text-2xl text-warm-900"
              >
                {summary.totalQty}
              </StyledText>
              <StyledText variant="light" className="text-sm text-warm-600">
                Items
              </StyledText>
            </View>
          </View>
        </View>
      </View>

      {/* Inventory List */}
      {isLoading || isRefetching ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#B45309" />
          <StyledText variant="medium" className="text-warm-600 mt-3">
            Loading inventory...
          </StyledText>
        </View>
      ) : (
        <FlatList
          data={paginatedProducts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{
            paddingBottom: 100,
            paddingTop: 8,
          }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="items-center justify-center py-12 px-6 mt-48">
              <FontAwesome name="inbox" size={78} color="#B45309" />
              <StyledText
                variant="semibold"
                className="text-warm-900 text-xl mt-4 mb-2"
              >
                No products found
              </StyledText>
              <StyledText
                variant="regular"
                className="text-warm-600 text-center text-sm"
              >
                {showLowOnly
                  ? 'No low stock items. Great job!'
                  : 'Add your first product to get started'}
              </StyledText>
              {!showLowOnly && (
                <TouchableOpacity
                  onPress={() =>
                    router.push('/(edit-forms)/add-product' as any)
                  }
                  className="mt-4 bg-primary-500 px-6 py-3 rounded-full"
                >
                  <StyledText variant="semibold" className="text-white text-sm">
                    Add Product
                  </StyledText>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      {/* Guide Modal */}
      <Modal
        visible={showGuide}
        transparent
        animationType="fade"
        onRequestClose={() => setShowGuide(false)}
      >
        <View className="flex-1 bg-black/50 justify-center px-6">
          <View className="bg-white rounded-2xl p-6 shadow-xl">
            <View className="flex-row justify-between items-center mb-4">
              <StyledText
                variant="extrabold"
                className="text-xl text-warm-900"
              >
                Quick guide
              </StyledText>
              <TouchableOpacity onPress={() => setShowGuide(false)}>
                <FontAwesome name="times" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <View className="space-y-3 mb-4">
              {GUIDE_TIPS.map((tip) => (
                <View
                  key={tip.title}
                  className="bg-warm-50 rounded-xl p-3 flex-row gap-3"
                >
                  <View className="w-10 h-10 rounded-full bg-white items-center justify-center">
                    <FontAwesome
                      name={tip.icon as any}
                      size={18}
                      color="#B45309"
                    />
                  </View>
                  <View className="flex-1">
                    <StyledText
                      variant="semibold"
                      className="text-warm-900 text-base"
                    >
                      {tip.title}
                    </StyledText>
                    <StyledText
                      variant="regular"
                      className="text-warm-600 text-sm leading-5"
                    >
                      {tip.description}
                    </StyledText>
                  </View>
                </View>
              ))}
            </View>

            <TouchableOpacity
              onPress={() => setShowGuide(false)}
              className="bg-secondary-500 rounded-xl py-3 items-center"
            >
              <StyledText variant="semibold" className="text-white">
                Got it
              </StyledText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Pagination */}
      {filtered.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filtered.length}
          itemsPerPage={ITEMS_PER_PAGE}
        />
      )}

      {/* Action Modal */}
      <Modal
        visible={!!pendingAction}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={closeAction}
      >
        <View className="flex-1 justify-end bg-black/50">
          <TouchableOpacity
            className="flex-1"
            activeOpacity={1}
            onPress={closeAction}
          />
          {pendingAction && (
            <KeyboardAwareScrollView
              enableOnAndroid
              enableAutomaticScroll
              extraScrollHeight={280}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{
                flexGrow: 1,
                justifyContent: 'flex-end',
              }}
            >
              <View className="w-full bg-white rounded-t-2xl p-6 shadow-xl">
                <View className="flex-row items-center justify-between mb-4">
                  <StyledText
                    variant="extrabold"
                    className="text-xl text-warm-900"
                  >
                    {pendingAction.type === 'restock'
                      ? 'Restock Product'
                      : 'Record Sale'}
                  </StyledText>
                  <TouchableOpacity onPress={closeAction} className="p-1">
                    <FontAwesome name="times" size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>

                <View className="bg-warm-50 rounded-xl p-4 mb-4">
                  <StyledText
                    variant="semibold"
                    className="text-warm-900 text-base mb-1"
                  >
                    {pendingAction.product.name}
                  </StyledText>
                  <StyledText
                    variant="regular"
                    className="text-warm-600 text-sm"
                  >
                    SKU: {pendingAction.product.sku}
                  </StyledText>
                  <View className="flex-row gap-6 mt-2">
                    <View>
                      <StyledText
                        variant="regular"
                        className="text-warm-600 text-xs"
                      >
                        Current Stock
                      </StyledText>
                      <StyledText
                        variant="semibold"
                        className="text-warm-900 text-lg"
                      >
                        {pendingAction.product.quantity}
                      </StyledText>
                    </View>
                    <View>
                      <StyledText
                        variant="regular"
                        className="text-warm-600 text-xs"
                      >
                        Price
                      </StyledText>
                      <MoneyText
                        value={pendingAction.product.price * 100}
                        className="text-lg text-warm-900 font-semibold"
                      />
                    </View>
                  </View>
                </View>

                <View className="mb-6">
                  <StyledText
                    variant="medium"
                    className="text-warm-900 mb-2"
                  >
                    Quantity
                  </StyledText>
                  <TextInput
                    placeholder="Enter quantity"
                    keyboardType="number-pad"
                    value={quantityInput}
                    textAlign="left"
                    onChangeText={setQuantityInput}
                    className="bg-white border border-warm-200 rounded-xl px-4 py-3 text-warm-900 text-lg"
                  />
                </View>

                <View className="flex-row gap-3">
                  <TouchableOpacity
                    onPress={closeAction}
                    className="flex-1 border border-warm-200 rounded-xl py-3 items-center"
                  >
                    <StyledText variant="medium" className="text-warm-600">
                      Cancel
                    </StyledText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={submitAction}
                    className={`flex-1 rounded-xl py-3 items-center ${
                      pendingAction.type === 'restock'
                        ? 'bg-primary-500'
                        : 'bg-secondary-500'
                    }`}
                  >
                    <StyledText variant="semibold" className="text-white">
                      Confirm
                    </StyledText>
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAwareScrollView>
          )}
        </View>
      </Modal>

      {/* Exit Confirmation Dialog */}
      <CustomModal
        visible={dialogVisible}
        onClose={handleCancelExit}
        title="Exit App"
        description="Are you sure you want to exit the app?"
        variant="warning"
        buttons={[
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: handleCancelExit,
          },
          {
            text: 'Exit',
            style: 'destructive',
            onPress: handleExitApp,
          },
        ]}
      />
    </SafeAreaView>
  );
}
