import { useCallback, useMemo, useRef } from 'react';
import { useCartStore } from '@/stores';
import type { NewSaleItem } from '@/types';

/**
 * Cart-lines subscription. Narrow Zustand selectors mean that a
 * payment-type change does not invalidate a row-level memo, a unit
 * toggle does not invalidate a payment-type subscriber, and so on.
 *
 * Returns stable callback identities for the cart-line lookup so the
 * `ProductRow.memo` boundary actually does something on the hot path.
 */
export function useCartLines() {
  const cartItems = useCartStore((s) => s.cartItems);
  const addItem = useCartStore((s) => s.addItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const toggleUnit = useCartStore((s) => s.toggleUnit);
  const clearCart = useCartStore((s) => s.clearCart);
  const setPaymentType = useCartStore((s) => s.setPaymentType);
  const setCustomer = useCartStore((s) => s.setCustomer);
  const selectedCustomer = useCartStore((s) => s.selectedCustomer);
  const paymentType = useCartStore((s) => s.paymentType);

  const itemCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems],
  );
  const total = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartItems],
  );

  // Stable lookup callback. Reads the latest cartItems via the store
  // directly so the reference here doesn't depend on the cartItems
  // array reference. This is the single most important stability
  // rule for the POS hot path: every key prop in the screen tree
  // passes through this, and a fresh ref here forces every visible
  // ProductRow to re-render whenever the cart mutates.
  const cartItemsRef = useRef<NewSaleItem[]>(cartItems);
  cartItemsRef.current = cartItems;
  const getCartLine = useCallback(
    (productId: number): NewSaleItem | undefined =>
      cartItemsRef.current.find((item) => item.product_id === productId),
    [],
  );

  return {
    cartItems,
    itemCount,
    total,
    paymentType,
    selectedCustomer,
    getCartLine,
    addItem,
    updateQuantity,
    toggleUnit,
    clearCart,
    setPaymentType,
    setCustomer,
  };
}
