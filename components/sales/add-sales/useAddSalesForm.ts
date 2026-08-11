import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Href, router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  Customer,
  NewSaleItem,
  Product,
  type OverrideReasonCode,
} from '@/types';
import {
  useBarcodeResolver,
  useCustomers,
  useProducts,
  useSales,
  useCustomerCreditSummary,
} from '@/hooks';
import type { OverrideReasonResult } from '@/components/utang/credit-guardrails';
import { InsufficientStockError } from '@/database/sales';
import { calculateCartProductPieces, calculateTotalPieces } from '@/lib';
import { Alert } from '@/utils';
import { useToastStore } from '@/stores';

export interface AddSalesFormData {
  search: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export function useAddSalesForm() {
  const { getAllProductsQuery } = useProducts();
  const { insertSaleMutation } = useSales();
  const addToast = useToastStore((state) => state.addToast);

  const [cartItems, setCartItems] = useState<NewSaleItem[]>([]);
  const [paymentType, setPaymentType] = useState<'cash' | 'credit'>('cash');
  const [selectedCustomer, setSelectedCustomer] = useState<
    Customer | string | null
  >(null);
  const [showCustomerPicker, setShowCustomerPicker] = useState<boolean>(false);

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
  const [overrideReason, setOverrideReason] =
    useState<OverrideReasonResult | null>(null);
  const [showOverrideModal, setShowOverrideModal] = useState<boolean>(false);
  const [showSoftWarnModal, setShowSoftWarnModal] = useState<boolean>(false);
  const pendingScanRef = useRef<string | null>(null);
  const { resolve } = useBarcodeResolver();

  const { control, setValue, reset } = useForm<AddSalesFormData>({
    defaultValues: { search: '' },
  });

  const search = useWatch({ control, name: 'search' }) || '';

  const { data: products = [], isLoading: isProductsLoading } =
    getAllProductsQuery;
  const { data: customers = [] } = useCustomers();

  const selectedCustomerId =
    typeof selectedCustomer === 'object' && selectedCustomer !== null
      ? selectedCustomer.id
      : undefined;

  const { data: creditSummary = null } =
    useCustomerCreditSummary(selectedCustomerId);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q),
    );
  }, [products, search]);

  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const total = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const projectedAvailable =
    creditSummary?.creditLimit != null && paymentType === 'credit'
      ? creditSummary.creditLimit - creditSummary.balance - total
      : null;

  const projectedWouldExceedLimit =
    creditSummary?.creditLimit != null &&
    projectedAvailable !== null &&
    projectedAvailable < 0 &&
    paymentType === 'credit';

  const submitIsBlockedByGuardrail =
    projectedWouldExceedLimit &&
    (creditSummary?.blockOnExceed ?? false) &&
    overrideReason === null;

  const isSubmitDisabled =
    insertSaleMutation.isPending ||
    cartItems.length === 0 ||
    (paymentType === 'credit' && !selectedCustomer) ||
    submitIsBlockedByGuardrail;

  const handleAddItem = useCallback(
    (product: Product, selectedUnit: 'retail' | 'wholesale' = 'retail') => {
      setCartItems((prev) => {
        const existing = prev.find(
          (item) =>
            item.product_id === product.id &&
            (item.selected_unit || 'retail') === selectedUnit,
        );
        const currentPieces = calculateCartProductPieces(prev, product.id);
        const totalPieces =
          currentPieces +
          calculateTotalPieces(1, selectedUnit, product.conversion_factor);

        if (totalPieces > product.quantity) {
          if (currentPieces === 0) {
            Alert.alert(
              'Out of Stock',
              'Insufficient stock for this packaging unit',
            );
          } else {
            Alert.alert(
              'Insufficient Stock',
              `Only ${product.quantity} total pieces available`,
            );
          }
          return prev;
        }

        if (existing) {
          return prev.map((item) =>
            item.product_id === product.id &&
            (item.selected_unit || 'retail') === selectedUnit
              ? { ...item, quantity: item.quantity + 1 }
              : item,
          );
        }
        const unitPrice =
          selectedUnit === 'wholesale' && product.wholesale_price != null
            ? product.wholesale_price
            : product.price;

        return [
          ...prev,
          {
            product_id: product.id,
            product_name: product.name,
            price: unitPrice,
            quantity: 1,
            stock: product.quantity,
            selected_unit: selectedUnit,
            retail_unit_name: product.retail_unit_name || 'Pc',
            wholesale_unit_name: product.wholesale_unit_name ?? null,
            retail_price: product.price,
            wholesale_price: product.wholesale_price ?? null,
            conversion_factor: product.conversion_factor ?? null,
          },
        ];
      });
    },
    [],
  );

  const handleUpdateQuantity = useCallback(
    (
      productId: number,
      delta: number,
      selectedUnit: 'retail' | 'wholesale' = 'retail',
    ) => {
      setCartItems((prev) => {
        const matchingItems = prev.filter(
          (item) =>
            item.product_id === productId &&
            (item.selected_unit || 'retail') === selectedUnit,
        );
        if (matchingItems.length === 0) return prev;

        const next = prev
          .map((item) => {
            if (
              item.product_id !== productId ||
              (item.selected_unit || 'retail') !== selectedUnit
            ) {
              return item;
            }
            const newQuantity = item.quantity + delta;
            if (newQuantity <= 0) return null;
            return { ...item, quantity: newQuantity };
          })
          .filter(Boolean) as NewSaleItem[];

        if (
          calculateCartProductPieces(next, productId) > matchingItems[0]!.stock
        ) {
          Alert.alert(
            'Insufficient Stock',
            `Only ${matchingItems[0]!.stock} total pieces available`,
          );
          return prev;
        }
        return next;
      });
    },
    [],
  );

  const toggleCartItemUnit = useCallback((index: number) => {
    setCartItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        const nextUnit =
          item.selected_unit === 'wholesale' ? 'retail' : 'wholesale';

        if (nextUnit === 'wholesale') {
          const piecesPerUnit = item.conversion_factor ?? 1;
          if (item.quantity * piecesPerUnit > item.stock) {
            Alert.alert(
              'Insufficient Stock',
              `Only ${item.stock} pieces available. Not enough for ${item.quantity} wholesale units.`,
            );
            return item;
          }
        }

        const nextPrice =
          nextUnit === 'wholesale' && item.wholesale_price != null
            ? item.wholesale_price
            : (item.retail_price ?? item.price);
        return {
          ...item,
          selected_unit: nextUnit,
          price: nextPrice,
        };
      }),
    );
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
    setPaymentType('cash');
    setSelectedCustomer(null);
    reset({ search: '' });
  }, [reset]);

  const openScanner = useCallback(() => {
    setIsScannerOpen(true);
  }, []);

  const closeScanner = useCallback(() => {
    setIsScannerOpen(false);
  }, []);

  const handleScannedBarcode = useCallback(
    async (barcode: string) => {
      const result = await resolve(barcode, Date.now());

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
        const { product, source, matchedUnit } = result;
        handleAddItem(product, matchedUnit);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        setPendingAddProductBarcode(null);
        setLastScanned({
          name: product.name,
          sku: product.sku,
          at: Date.now(),
          found: true,
        });
        void source;
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
    [resolve, addToast, handleAddItem],
  );

  useEffect(() => {
    if (!getAllProductsQuery.isSuccess || getAllProductsQuery.isFetching)
      return;
    const queued = pendingScanRef.current;
    if (!queued) return;
    pendingScanRef.current = null;
    void handleScannedBarcode(queued);
  }, [
    getAllProductsQuery.isSuccess,
    getAllProductsQuery.isFetching,
    handleScannedBarcode,
  ]);

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

  // ─── Payment / customer handlers ───────────────────────────────

  const handlePaymentTypeChange = useCallback(
    (type: 'cash' | 'credit') => {
      setPaymentType(type);
      if (type === 'credit' && typeof selectedCustomer === 'string') {
        setSelectedCustomer(null);
      }
    },
    [selectedCustomer],
  );

  const handleSelectCustomer = useCallback((customer: Customer) => {
    setSelectedCustomer(customer);
    setShowCustomerPicker(false);
  }, []);

  const handleSelectOneOffName = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSelectedCustomer(trimmed);
    setShowCustomerPicker(false);
  }, []);

  const submit = useCallback(async () => {
    if (cartItems.length === 0 || insertSaleMutation.isPending) return;

    if (submitIsBlockedByGuardrail) return;

    if (
      projectedWouldExceedLimit &&
      !(creditSummary?.blockOnExceed ?? false) &&
      overrideReason === null
    ) {
      setShowSoftWarnModal(true);
      return;
    }

    try {
      await insertSaleMutation.mutateAsync({
        items: cartItems.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price,
          selected_unit: item.selected_unit,
        })),
        payment_type: paymentType,
        ...(typeof selectedCustomer === 'string'
          ? { customer_name: selectedCustomer }
          : selectedCustomer?.name != null
            ? { customer_name: selectedCustomer.name }
            : {}),
        ...(typeof selectedCustomer !== 'string' && selectedCustomer?.id != null
          ? { customer_credit_id: selectedCustomer.id }
          : {}),
        ...(overrideReason
          ? {
              overrideReasonCode: overrideReason.code as OverrideReasonCode,
              overrideReasonNote: overrideReason.note,
            }
          : {}),
      });

      setOverrideReason(null);
      clearCart();
      router.back();
    } catch (err) {
      if (err instanceof InsufficientStockError) {
        Alert.alert(
          'Stock changed',
          `Only ${err.available} of ${err.requested} available now. Please refresh.`,
        );
        return;
      }
      Alert.alert('Error', 'Failed to complete sale. Please try again.');
    }
  }, [
    cartItems,
    paymentType,
    selectedCustomer,
    insertSaleMutation,
    clearCart,
    overrideReason,
    projectedWouldExceedLimit,
    submitIsBlockedByGuardrail,
    creditSummary,
  ]);

  const getCartLine = useCallback(
    (productId: number): NewSaleItem | undefined =>
      cartItems.find((item) => item.product_id === productId),
    [cartItems],
  );

  return {
    // Form & Search
    control,
    setValue,
    search,

    // Domain data
    products,
    customers,
    isProductsLoading,

    // Derived
    filteredProducts,
    cartItems,
    itemCount,
    total,
    isSubmitDisabled,

    // Local state
    paymentType,
    selectedCustomer,
    showCustomerPicker,
    isScannerOpen,
    lastScanned,
    pendingAddProductBarcode,

    // Setters
    setShowCustomerPicker,

    // Handlers
    handleAddItem,
    handleUpdateQuantity,
    toggleCartItemUnit,
    clearCart,
    handlePaymentTypeChange,
    handleSelectCustomer,
    handleSelectOneOffName,
    submit,
    getCartLine,

    // Scanner
    openScanner,
    closeScanner,
    handleScannedBarcode,
    handlePressAddNewProduct,
    dismissPendingAddProduct,

    // Mutation
    insertSaleMutation,

    creditSummary,
    overrideReason,
    setOverrideReason,
    showOverrideModal,
    setShowOverrideModal,
    showSoftWarnModal,
    setShowSoftWarnModal,
    projectedWouldExceedLimit,
    submitIsBlockedByGuardrail,
    selectedCustomerId,

    // Router (exposed for the back button in the header)
    router,
  };
}
