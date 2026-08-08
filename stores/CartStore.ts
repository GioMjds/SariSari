import { create } from 'zustand';
import { Customer, NewSaleItem, Product } from '@/types';
import { calculateCartProductPieces, calculateTotalPieces } from '@/lib';
import { Alert } from '@/utils';
import { logger } from '@/lib/logger';

/**
 * CartStore — shared point-of-sale cart state.
 *
 * The POS flow is split across separate tab screens (pos → cart →
 * checkout), so the cart cannot live in a single screen's local state.
 * This store holds the cart line items, payment type, and selected buyer
 * plus the pure cart actions, mirroring the state that used to live in
 * `useAddSalesForm`. Derived values (total, item count), barcode
 * handling, and submission stay in the `useCart` hook, which reads this
 * store and wires the data queries.
 *
 * `selectedCustomer` accepts either a registered Customer object (picked
 * from the suki list) or a plain string for one-off custom names typed
 * during cash checkout. `null` means no buyer was captured.
 */
interface CartState {
  cartItems: NewSaleItem[];
  paymentType: 'cash' | 'credit';
  selectedCustomer: Customer | string | null;

  addItem: (
    product: Product,
    selectedUnit?: 'retail' | 'wholesale',
  ) => 'over_stock' | void;
  updateQuantity: (
    productId: number,
    delta: number,
    selectedUnit?: 'retail' | 'wholesale',
  ) => 'over_stock' | void;
  toggleUnit: (index: number) => void;
  clearCart: () => void;
  setPaymentType: (type: 'cash' | 'credit') => void;
  setCustomer: (customer: Customer | string | null) => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  cartItems: [],
  paymentType: 'cash',
  selectedCustomer: null,

  addItem: (product, selectedUnit = 'retail') => {
    const prev = get().cartItems;
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
      logger.warn(
        {
          event: 'cart_over_stock',
          feature: 'cart',
          productId: product.id,
          totalPieces,
          available: product.quantity,
        },
        'addItem blocked by stock limit',
      );
      return 'over_stock';
    }

    if (existing) {
      set({
        cartItems: prev.map((item) =>
          item.product_id === product.id &&
          (item.selected_unit || 'retail') === selectedUnit
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        ),
      });
      return;
    }

    const unitPrice =
      selectedUnit === 'wholesale' && product.wholesale_price != null
        ? product.wholesale_price
        : product.price;

    set({
      cartItems: [
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
      ],
    });
    return;
  },

  updateQuantity: (productId, delta, selectedUnit = 'retail') => {
    const prev = get().cartItems;
    const matchingItems = prev.filter(
      (item) =>
        item.product_id === productId &&
        (item.selected_unit || 'retail') === selectedUnit,
    );
    const targetItem = matchingItems[0];
    if (!targetItem) return;

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

    if (calculateCartProductPieces(next, productId) > targetItem.stock) {
      logger.warn(
        {
          event: 'cart_over_stock',
          feature: 'cart',
          productId,
          available: targetItem.stock,
        },
        'updateQuantity blocked by stock limit',
      );
      return 'over_stock';
    }
    set({ cartItems: next });
    return;
  },

  toggleUnit: (index) => {
    const target = get().cartItems[index];
    logger.debug(
      {
        event: 'cart_unit_toggled',
        feature: 'cart',
        idx: index,
        productId: target?.product_id ?? null,
        prevUnit: target?.selected_unit ?? null,
        cartLen: get().cartItems.length,
      },
      'toggleUnit invoked',
    );
    set((state) => ({
      cartItems: state.cartItems.map((item, idx) => {
        if (idx !== index) return item;
        const nextUnit =
          item.selected_unit === 'wholesale' ? 'retail' : 'wholesale';

        if (nextUnit === 'wholesale') {
          const piecesPerUnit = item.conversion_factor ?? 1;
          if (item.quantity * piecesPerUnit > item.stock) {
            logger.debug(
              {
                event: 'cart_unit_toggle_blocked',
                feature: 'cart',
                productId: item.product_id,
                reason: 'insufficient_stock',
                quantity: item.quantity,
                stock: item.stock,
              },
              'toggleUnit blocked by insufficient stock',
            );
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
        logger.debug(
          {
            event: 'cart_unit_toggle_applied',
            feature: 'cart',
            productId: item.product_id,
            from: item.selected_unit,
            to: nextUnit,
            prevPrice: item.price,
            nextPrice,
          },
          'toggleUnit applied',
        );
        return {
          ...item,
          selected_unit: nextUnit,
          price: nextPrice,
        };
      }),
    }));
  },

  clearCart: () => {
    set({ cartItems: [], paymentType: 'cash', selectedCustomer: null });
  },

  setPaymentType: (type) => {
    // Credit sales require a registered suki — clear any plain string
    // (one-off name) so the user can't submit a typed buyer as a Suki
    // for an utang record. Switching back to cash preserves whatever
    // was captured, so the user can toggle modes without re-entering.
    const current = get().selectedCustomer;
    if (type === 'credit' && typeof current === 'string') {
      set({ paymentType: type, selectedCustomer: null });
      return;
    }
    set({ paymentType: type });
  },

  setCustomer: (customer) => {
    set({ selectedCustomer: customer });
  },
}));
