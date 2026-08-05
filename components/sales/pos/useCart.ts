import { useCallback, useEffect, useRef, useState } from 'react';
import { Href, router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useCartStore, useToastStore } from '@/stores';
import {
  usePaginatedProducts,
  useSales,
  useBarcodeResolver,
  useCustomers,
} from '@/hooks';
import { InsufficientStockError } from '@/database/sales';
import { Alert } from '@/utils';
import type { NewSaleItem } from '@/types';
import type { ScanResolution } from '@/lib/barcodes/types';

export function useCart(search: string = '') {
  const {
    cartItems,
    paymentType,
    selectedCustomer,
    addItem,
    updateQuantity,
    toggleUnit,
    clearCart: clearCartStore,
    setPaymentType,
    setCustomer,
  } = useCartStore();

  const productsQuery = usePaginatedProducts(search);
  const products =
    productsQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const {
    isLoading: isProductsLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch: refetchProducts,
    error: productsError,
  } = productsQuery;

  const { data: customers = [] } = useCustomers();
  const { insertSaleMutation, getTodayStatsQuery } = useSales();
  const addToast = useToastStore((state) => state.addToast);

  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [lastScanned, setLastScanned] = useState<{
    name: string;
    sku: string;
    at: number;
    found: boolean;
  } | null>(null);
  const [pendingAddProductBarcode, setPendingAddProductBarcode] = useState<
    string | null
  >(null);

  const pendingScanRef = useRef<string | null>(null);
  const { resolve } = useBarcodeResolver();

  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const total = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const isSubmitDisabled =
    insertSaleMutation.isPending ||
    cartItems.length === 0 ||
    (paymentType === 'credit' && !selectedCustomer);

  const openScanner = useCallback(() => {
    setIsScannerOpen(true);
  }, []);

  const closeScanner = useCallback(() => {
    setIsScannerOpen(false);
  }, []);

  const handleScannedBarcode = useCallback(
    async (barcode: string) => {
      const result: ScanResolution = await resolve(barcode, Date.now());
      if (result.kind === 'invalid') {
        addToast({
          message:
            result.reason === 'empty'
              ? 'Barcode is empty.'
              : "That doesn't look like a barcode. Digits only, 8–14 long.",
          variant: 'danger',
        });
        setPendingAddProductBarcode(null);
        setLastScanned({
          name: '',
          sku: barcode,
          at: Date.now(),
          found: false,
        });
        return;
      }

      if (result.kind === 'missing') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(
          () => {},
        );
        setPendingAddProductBarcode(result.barcode);
        setLastScanned({
          name: '',
          sku: result.barcode,
          at: Date.now(),
          found: false,
        });
        return;
      }

      if (result.kind === 'catalog_match') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(
          () => {},
        );
        setPendingAddProductBarcode(result.catalogProduct.barcode);
        setLastScanned({
          name: result.catalogProduct.name,
          sku: result.catalogProduct.barcode,
          at: Date.now(),
          found: false,
        });
        return;
      }

      if (result.kind === 'resolved') {
        const { product, matchedUnit } = result;
        addItem(product, matchedUnit);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        setPendingAddProductBarcode(null);
        setLastScanned({
          name: product.name,
          sku: product.sku,
          at: Date.now(),
          found: true,
        });
        return;
      }

      if (
        result.kind === 'duplicate' ||
        result.kind === 'superseded' ||
        result.kind === 'store_products_unavailable'
      ) {
        if (result.kind === 'store_products_unavailable') {
          pendingScanRef.current = barcode;
        }
        return;
      }
    },
    [resolve, addToast, addItem],
  );

  useEffect(() => {
    if (!productsQuery.isSuccess || productsQuery.isFetching) return;
    const queued = pendingScanRef.current;
    if (!queued) return;
    pendingScanRef.current = null;
    void handleScannedBarcode(queued);
  }, [productsQuery.isSuccess, productsQuery.isFetching, handleScannedBarcode]);

  const handlePressAddNewProduct = useCallback(() => {
    if (!pendingAddProductBarcode) return;
    const barcode = pendingAddProductBarcode;
    setPendingAddProductBarcode(null);
    setIsScannerOpen(false);
    router.push(
      `/(edit-forms)/add-product?prefillBarcode=${encodeURIComponent(barcode)}` as Href,
    );
  }, [pendingAddProductBarcode]);

  const dismissPendingAddProduct = useCallback(() => {
    setPendingAddProductBarcode(null);
  }, []);

  const submit = useCallback(async (): Promise<boolean> => {
    if (cartItems.length === 0 || insertSaleMutation.isPending) {
      return false;
    }

    try {
      const customerName =
        typeof selectedCustomer === 'string'
          ? selectedCustomer
          : selectedCustomer?.name;
      const customerCreditId =
        typeof selectedCustomer === 'string' ? undefined : selectedCustomer?.id;

      await insertSaleMutation.mutateAsync({
        items: cartItems.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price,
          selected_unit: item.selected_unit,
        })),
        payment_type: paymentType,
        ...(customerName !== undefined ? { customer_name: customerName } : {}),
        ...(customerCreditId !== undefined
          ? { customer_credit_id: customerCreditId }
          : {}),
      });

      clearCartStore();
      return true;
    } catch (err) {
      if (err instanceof InsufficientStockError) {
        Alert.alert(
          'Stock changed',
          `Only ${err.available} of ${err.requested} available now. Please refresh.`,
        );
        return false;
      }
      Alert.alert('Error', 'Failed to complete sale. Please try again.');
      return false;
    }
  }, [
    cartItems,
    paymentType,
    selectedCustomer,
    insertSaleMutation,
    clearCartStore,
  ]);

  const getCartLine = useCallback(
    (productId: number): NewSaleItem | undefined =>
      cartItems.find((item) => item.product_id === productId),
    [cartItems],
  );

  return {
    // Domain data
    products,
    customers,
    isProductsLoading,
    todayStats: getTodayStatsQuery.data,

    // Pagination
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetchProducts,
    productsError,

    // Cart state (from store)
    cartItems,
    paymentType,
    selectedCustomer,
    itemCount,
    total,
    isSubmitDisabled,

    // Scanner state (local)
    isScannerOpen,
    lastScanned,
    pendingAddProductBarcode,

    // Store actions
    addItem,
    updateQuantity,
    toggleUnit,
    clearCart: clearCartStore,
    setPaymentType,
    setCustomer,

    // Handlers
    openScanner,
    closeScanner,
    handleScannedBarcode,
    handlePressAddNewProduct,
    dismissPendingAddProduct,
    submit,
    getCartLine,

    // Mutation
    insertSaleMutation,
  };
}
