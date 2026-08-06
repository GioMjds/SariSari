import { useCallback, useEffect, useRef, useState } from 'react';
import { Href, router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useToastStore } from '@/stores';
import {
  useSales,
  useBarcodeResolver,
  useCustomers,
} from '@/hooks';
import { InsufficientStockError } from '@/database/sales';
import { Alert } from '@/utils';
import { logger } from '@/lib/logger';
import type { ScanResolution } from '@/lib/barcodes/types';
import { useCartLines } from './useCartLines';

/**
 * Cart-action surface for the POS screen.
 *
 * Responsibilities (split for stability):
 *   - cart line state and actions: see `useCartLines`.
 *   - scanner state machine (modal open, last scan, pending add):
 *     local React state with stable callback identities via refs.
 *   - submit / customer actions: built on top of both.
 *
 * The product catalog query is owned by `CatalogProductsBridge` in
 * `app/(tabs)/sales/pos.tsx`, NOT here, so the search keystroke does
 * not invalidate the cart subtree's render.
 */
export function useCart() {
  const cartLines = useCartLines();
  const { data: customers = [] } = useCustomers();
  const { insertSaleMutation, getTodayStatsQuery } = useSales();
  const addToast = useToastStore((state) => state.addToast);

  // Watch the `customers` reference identity. If useCustomers returns
  // a new array on every render, every downstream memo in the POS
  // subtree invalidates and the css-interop layer can re-process the
  // whole tree. Emit a single warn when the identity flips mid-flow.
  const prevCustomersRef = useRef<typeof customers>(customers);
  useEffect(() => {
    if (prevCustomersRef.current !== customers) {
      logger.warn(
        {
          event: 'checkout_useCustomers_identity_changed',
          feature: 'checkout',
          prevLength: prevCustomersRef.current.length,
          nextLength: customers.length,
        },
        'useCustomers returned a new reference',
      );
      prevCustomersRef.current = customers;
    }
  }, [customers]);

  // Same watch for the payment type from the store. Pair with the
  // CheckoutModal-level event so we get a source-and-consumer view.
  const prevPaymentTypeRef = useRef(cartLines.paymentType);
  useEffect(() => {
    if (prevPaymentTypeRef.current !== cartLines.paymentType) {
      logger.info(
        {
          event: 'checkout_payment_type_changed_at_source',
          feature: 'checkout',
          from: prevPaymentTypeRef.current,
          to: cartLines.paymentType,
        },
        'payment type changed at store source',
      );
      prevPaymentTypeRef.current = cartLines.paymentType;
    }
  }, [cartLines.paymentType]);

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

  const isSubmitDisabled =
    insertSaleMutation.isPending ||
    cartLines.cartItems.length === 0 ||
    (cartLines.paymentType === 'credit' && !cartLines.selectedCustomer);

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
        cartLines.addItem(product, matchedUnit);
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
    [resolve, addToast, cartLines],
  );

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
    if (cartLines.cartItems.length === 0 || insertSaleMutation.isPending) {
      return false;
    }

    logger.info(
      {
        event: 'checkout_submit_started',
        feature: 'checkout',
        paymentType: cartLines.paymentType,
        itemCount: cartLines.cartItems.length,
        hasCustomer: cartLines.selectedCustomer != null,
      },
      'checkout submit started',
    );

    try {
      const customerName =
        typeof cartLines.selectedCustomer === 'string'
          ? cartLines.selectedCustomer
          : cartLines.selectedCustomer?.name;
      const customerCreditId =
        typeof cartLines.selectedCustomer === 'string'
          ? undefined
          : cartLines.selectedCustomer?.id;

      await insertSaleMutation.mutateAsync({
        items: cartLines.cartItems.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price,
          selected_unit: item.selected_unit,
        })),
        payment_type: cartLines.paymentType,
        ...(customerName !== undefined ? { customer_name: customerName } : {}),
        ...(customerCreditId !== undefined
          ? { customer_credit_id: customerCreditId }
          : {}),
      });

      cartLines.clearCart();
      logger.info(
        {
          event: 'checkout_submit_succeeded',
          feature: 'checkout',
          paymentType: cartLines.paymentType,
        },
        'checkout submit succeeded',
      );
      return true;
    } catch (err) {
      const errorName = err instanceof Error ? err.name : 'unknown';
      if (err instanceof InsufficientStockError) {
        Alert.alert(
          'Stock changed',
          `Only ${err.available} of ${err.requested} available now. Please refresh.`,
        );
      } else {
        Alert.alert('Error', 'Failed to complete sale. Please try again.');
      }
      logger.warn(
        {
          event: 'checkout_submit_failed',
          feature: 'checkout',
          paymentType: cartLines.paymentType,
          errorName,
        },
        'checkout submit failed',
      );
      return false;
    }
  }, [
    cartLines.cartItems,
    cartLines.paymentType,
    cartLines.selectedCustomer,
    cartLines.clearCart,
    insertSaleMutation,
  ]);

  return {
    // Domain data
    customers,
    todayStats: getTodayStatsQuery.data,

    // Cart state (delegated from useCartLines)
    cartItems: cartLines.cartItems,
    paymentType: cartLines.paymentType,
    selectedCustomer: cartLines.selectedCustomer,
    itemCount: cartLines.itemCount,
    total: cartLines.total,
    isSubmitDisabled,

    // Scanner state (local)
    isScannerOpen,
    lastScanned,
    pendingAddProductBarcode,

    // Store actions
    addItem: cartLines.addItem,
    updateQuantity: cartLines.updateQuantity,
    toggleUnit: cartLines.toggleUnit,
    clearCart: cartLines.clearCart,
    setPaymentType: cartLines.setPaymentType,
    setCustomer: cartLines.setCustomer,

    // Handlers
    openScanner,
    closeScanner,
    handleScannedBarcode,
    handlePressAddNewProduct,
    dismissPendingAddProduct,
    submit,
    getCartLine: cartLines.getCartLine,

    // Mutation
    insertSaleMutation,
  };
}