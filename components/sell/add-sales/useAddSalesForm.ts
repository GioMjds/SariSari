import { useCallback, useMemo, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Customer, NewSaleItem, Product } from '@/types';
import { useBarcodeResolver, useCustomers, useProducts, useSales } from '@/hooks';
import { InsufficientStockError } from '@/database/sales';
import { calculateCartProductPieces, calculateTotalPieces } from '@/lib';
import { Alert } from '@/utils';
import { useToastStore } from '@/stores';

/**
 * Form data for the Add Sales screen.
 *
 * The POS only has one true input — the product search query — which
 * is bound through react-hook-form so the field participates in the
 * same reset/dispatch plumbing as the rest of the app's edit forms.
 * The cart, payment type, and selected customer are local React state
 * because they're UI-shaped, not field-shaped.
 */
export interface AddSalesFormData {
  search: string;
}

/**
 * Cart line item used inside `useAddSalesForm()`.
 */
export interface CartItem {
  product: Product;
  quantity: number;
}

/**
 * `useAddSalesForm()` — owns the Add Sales (POS) screen's state.
 *
 * Encapsulates react-hook-form setup, cart manipulation (add, increment,
 * decrement, set quantity, remove), stock validation (`calculateCartProductPieces`),
 * payment-type/customer selection, barcode processing via `useBarcodeResolver()`,
 * and the final transaction submission through `useSales()`.
 *
 * This hook is the single place where business logic lives; the screen and its
 * components stay presentational.
 */
export function useAddSalesForm() {


  const { getAllProductsQuery } = useProducts();
  const { insertSaleMutation } = useSales();
  const addToast = useToastStore((state) => state.addToast);

  // Local UI state — the cart, payment mode, search query, and suki picker.
  // `selectedCustomer` accepts either a registered Customer object (when
  // picking from the suki list) or a plain string for one-off custom names
  // typed during cash checkout. `null` means no buyer was captured.
  const [cartItems, setCartItems] = useState<NewSaleItem[]>([]);
  const [paymentType, setPaymentType] = useState<'cash' | 'credit'>('cash');
  const [selectedCustomer, setSelectedCustomer] = useState<
    Customer | string | null
  >(null);
  const [showCustomerPicker, setShowCustomerPicker] = useState<boolean>(false);

  // Barcode scanner state.
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [lastScanned, setLastScanned] = useState<{
    name: string;
    sku: string;
    at: number;
    found: boolean;
  } | null>(null);
  // v5: when a scan misses the catalog, surface the barcode so the
  // catalog can render the "Add as new product" CTA. The route push
  // happens from the catalog via `onPressAddNewProduct`.
  const [pendingAddProductBarcode, setPendingAddProductBarcode] = useState<
    string | null
  >(null);
  // The resolver composes validation + throttle + lookup. Reading it
  // here rather than re-implementing the chain keeps the policy in
  // one place (the hook) and lets us swap implementations without
  // touching the screen.
  const { resolve } = useBarcodeResolver();
  // Ref tracks accepted scans for the in-modal banner copy.
  // The resolver has its own throttle ref internally; we keep this
  // for the banner's `lastScanned` shape only.
  const lastScanRef = useRef<{ barcode: string; at: number } | null>(null);

  // react-hook-form — search input only. Matches the field-shape
  // convention used by other edit-form routes.
  const { control, reset } = useForm<AddSalesFormData>({
    defaultValues: { search: '' },
  });

  const search = useWatch({ control, name: 'search' }) || '';

  // Domain queries.
  const { data: products = [], isLoading: isProductsLoading } =
    getAllProductsQuery;
  const { data: customers = [] } = useCustomers();



  // ─── Derived values ────────────────────────────────────────────

  /** Catalog filtered by the search query. Lives here because the
   * filter is a UI concern over the products query cache. */
  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q),
    );
  }, [products, search]);

  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const total = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const isSubmitDisabled =
    insertSaleMutation.isPending ||
    cartItems.length === 0 ||
    (paymentType === 'credit' && !selectedCustomer);

  // ─── Cart handlers ────────────────────────────────────────────

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
          calculateTotalPieces(
            1,
            selectedUnit,
            product.conversion_factor,
          );

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
            wholesale_unit_name: product.wholesale_unit_name,
            retail_price: product.price,
            wholesale_price: product.wholesale_price,
            conversion_factor: product.conversion_factor,
          },
        ];
      });
    },
    [],
  );

  const handleUpdateQuantity = useCallback(
    (productId: number, delta: number, selectedUnit: 'retail' | 'wholesale' = 'retail') => {
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
          calculateCartProductPieces(next, productId) > matchingItems[0].stock
        ) {
          Alert.alert(
            'Insufficient Stock',
            `Only ${matchingItems[0].stock} total pieces available`,
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
        const nextUnit = item.selected_unit === 'wholesale' ? 'retail' : 'wholesale';

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

  // ─── Barcode scanner ───────────────────────────────────────────

  const openScanner = useCallback(() => {
    setIsScannerOpen(true);
  }, []);

  const closeScanner = useCallback(() => {
    setIsScannerOpen(false);
  }, []);

  const handleScannedBarcode = useCallback(
    (barcode: string) => {
      const result = resolve(barcode, Date.now());

      if (result.kind === 'invalid') {
        // The resolver collapses "format error" and "duplicate-
        // throttle drop" into a single 'invalid' result. In either
        // case the modal's banner copy is the same — we surface a
        // toast for malformed input and silently swallow drops.
        // We can't easily distinguish them here, so we toast
        // conservatively; duplicate drops end up as harmless toasts
        // that the throttle itself prevents from firing.
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
        Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Error,
        ).catch(() => {});
        setPendingAddProductBarcode(result.barcode);
        lastScanRef.current = { barcode: result.barcode, at: Date.now() };
        setLastScanned({
          name: '',
          sku: result.barcode,
          at: Date.now(),
          found: false,
        });
        return;
      }

      // result.kind === 'resolved'
      const { product, source, matchedUnit } = result;
      handleAddItem(product, matchedUnit);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(
        () => {},
      );
      // A resolved scan clears any pending CTA — the user has
      // successfully resolved the missing state by scanning again.
      setPendingAddProductBarcode(null);
      lastScanRef.current = { barcode: product.sku, at: Date.now() };
      setLastScanned({
        name: product.name,
        sku: product.sku,
        at: Date.now(),
        found: true,
      });
      // The `source` branch is intentionally not surfaced in the
      // banner — UI is identical regardless of which column matched.
      // Recorded here for telemetry in a future iteration.
      void source;
    },
    [resolve, addToast, handleAddItem],
  );

  // Handler bound to the "Add as new product" CTA in the catalog.
  // Routes to the Add Product form with the barcode pre-filled.
  const handlePressAddNewProduct = useCallback(() => {
    if (!pendingAddProductBarcode) return;
    const barcode = pendingAddProductBarcode;
    setPendingAddProductBarcode(null);
    setIsScannerOpen(false);
    router.push(
      `/(edit-forms)/add-product?prefillBarcode=${encodeURIComponent(barcode)}` as any,
    );
  }, [pendingAddProductBarcode]);

  // Handler bound to the modal's "Done" button — clear pending CTA.
  // (Modal exposes its own close; this is a thin wrapper for the
  // explicit cancel path.)
  const dismissPendingAddProduct = useCallback(() => {
    setPendingAddProductBarcode(null);
  }, []);

  // ─── Payment / customer handlers ───────────────────────────────

  const handlePaymentTypeChange = useCallback(
    (type: 'cash' | 'credit') => {
      setPaymentType(type);
      // Credit sales require a registered suki — clear any plain string
      // (one-off name) so the user can't submit a typed buyer as a Suki
      // for an utang record. Switching back to cash preserves whatever
      // was captured, so the user can toggle modes without re-entering.
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

  /**
   * Accepts a typed one-off name (from the customer picker's "Use 'X'
   * as a one-off name" action). Treated as a string in selectedCustomer
   * so we can distinguish it from a registered Customer object during
   * submission — string means "no customer_credit_id; just record a name".
   */
  const handleSelectOneOffName = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSelectedCustomer(trimmed);
    setShowCustomerPicker(false);
  }, []);

  // ─── Submission pipeline ───────────────────────────────────────

  const submit = useCallback(async () => {
    if (cartItems.length === 0 || insertSaleMutation.isPending) {
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
        // Map the hybrid selectedCustomer shape into the two columns:
        //   • string  → typed one-off name; no Suki link.
        //   • Customer object → registered Suki; save both columns.
        customer_name:
          typeof selectedCustomer === 'string'
            ? selectedCustomer
            : selectedCustomer?.name,
        customer_credit_id:
          typeof selectedCustomer === 'string'
            ? undefined
            : selectedCustomer?.id,
      });

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
  ]);

  // ─── Cart line lookup helper for the catalog ───────────────────

  const getCartLine = useCallback(
    (productId: number): NewSaleItem | undefined =>
      cartItems.find((item) => item.product_id === productId),
    [cartItems],
  );

  return {
    // Form & Search
    control,
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

    // Router (exposed for the back button in the header)
    router,
  };
}
