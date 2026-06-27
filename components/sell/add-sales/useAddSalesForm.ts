import { useCallback, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';

import { router } from 'expo-router';
import { Customer, NewSaleItem, Product } from '@/types';
import { useCredits, useProducts, useSales } from '@/hooks';
import { InsufficientStockError } from '@/database/sales';
import { Alert } from '@/utils';

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
 * useAddSalesForm — owns the Add Sales modal's POS state.
 *
 * Encapsulates the cart line list (`NewSaleItem[]`), search query,
 * payment mode, and selected suki (for credit checkout). Wires the
 * submission pipeline to `useSales.insertSaleMutation` and surfaces
 * `InsufficientStockError` as an alert so the user can refresh.
 *
 * Mirrors the architectural pattern of `useAddCreditForm`: the hook
 * is the single place where business logic lives; the screen and its
 * components stay presentational.
 */
export function useAddSalesForm() {


  const { getAllProductsQuery } = useProducts();
  const { useCustomers } = useCredits();
  const { insertSaleMutation } = useSales();

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

  // react-hook-form — search input only. Matches the field-shape
  // convention used by other edit-form routes.
  const { control, reset, watch } = useForm<AddSalesFormData>({
    defaultValues: { search: '' },
  });

  const search = watch('search');

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

  const handleAddItem = useCallback((product: Product) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product_id === product.id);
      if (existing) {
        if (existing.quantity >= product.quantity) {
          Alert.alert(
            'Insufficient Stock',
            `Only ${product.quantity} items available`,
          );
          return prev;
        }
        return prev.map((item) =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      if (product.quantity <= 0) {
        Alert.alert('Out of Stock', 'This product is currently out of stock');
        return prev;
      }
      return [
        ...prev,
        {
          product_id: product.id,
          product_name: product.name,
          price: product.price,
          quantity: 1,
          stock: product.quantity,
        },
      ];
    });
  }, []);

  const handleUpdateQuantity = useCallback(
    (productId: number, delta: number) => {
      setCartItems((prev) => {
        const next = prev
          .map((item) => {
            if (item.product_id !== productId) return item;
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
          })
          .filter(Boolean) as NewSaleItem[];
        return next;
      });
    },
    [],
  );

  const clearCart = useCallback(() => {
    setCartItems([]);
    setPaymentType('cash');
    setSelectedCustomer(null);
    reset({ search: '' });
  }, [reset]);

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

  // ─── Submit ───────────────────────────────────────────────────

  const submit = useCallback(async () => {
    if (cartItems.length === 0) {
      Alert.alert('No Items', 'Please add items to the sale');
      return;
    }
    if (paymentType === 'credit' && !selectedCustomer) {
      Alert.alert(
        'Customer Required',
        'Please select a customer for credit sales',
      );
      return;
    }

    try {
      await insertSaleMutation.mutateAsync({
        items: cartItems.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price,
        })),
        payment_type: paymentType,
        // Map the hybrid selectedCustomer shape into the two columns:
        //   • string  → typed one-off name; no Suki link.
        //   • Customer object → registered Suki; save both columns.
        //   • null → leave both unset.
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
    // Form wiring
    control,
    reset,

    // Watched values
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

    // Setters
    setShowCustomerPicker,

    // Handlers
    handleAddItem,
    handleUpdateQuantity,
    clearCart,
    handlePaymentTypeChange,
    handleSelectCustomer,
    handleSelectOneOffName,
    submit,
    getCartLine,

    // Mutation
    insertSaleMutation,

    // Router (exposed for the back button in the header)
    router,
  };
}
