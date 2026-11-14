import {
  BEAT_ORDER,
  CASH_TENDERED,
  LOW_STOCK_AT,
  PRODUCT_ORDER,
  SCRIPTED_ORDERS,
  SCRIPTED_PAYMENT,
  SCRIPTED_RESTOCK,
  SEED_PRODUCTS,
  type BeatId,
  type DayProductId,
  type DaySukiId,
  type SaleBeat,
} from '@/constants/onboardingDay';
import { formatPesos, type Pesos } from '@/lib/money';

/**
 * onboardingDay - pure state for the onboarding "day at your store"
 * walkthrough. Every action either returns a new state or the same
 * state object (rejected). Nothing here touches SQLite, React, or
 * stores; the screen holds it in useReducer.
 */

export type CartLine = { id: DayProductId; qty: number };

export type DayState = {
  products: Record<DayProductId, { stock: number; price: Pesos }>;
  sukiBalances: Record<DaySukiId, Pesos>;
  sales: { total: Pesos; items: number; utangOut: Pesos };
  cart: CartLine[];
  /** Per-beat receipts so revisiting a beat shows its own numbers. */
  receipts: {
    cash: { total: Pesos; change: Pesos } | null;
    utang: { total: Pesos } | null;
  };
  beatDone: Record<BeatId, boolean>;
};

export type DayAction =
  | { type: 'addToCart'; id: DayProductId }
  | { type: 'removeFromCart'; id: DayProductId }
  | { type: 'clearCart' }
  | { type: 'checkoutCash'; tendered: Pesos }
  | { type: 'checkoutUtang'; suki: DaySukiId }
  | { type: 'restock'; id: DayProductId; qty: number }
  | { type: 'receivePayment'; suki: DaySukiId; amount: Pesos }
  | { type: 'autoplay'; beat: BeatId };

const pesos = (n: number): Pesos => n as Pesos;

function withKey<K extends string, V>(
  record: Record<K, V>,
  key: K,
  value: V,
): Record<K, V> {
  return { ...record, [key]: value } as Record<K, V>;
}

export function createDaySeed(): DayState {
  const products = {} as DayState['products'];
  for (const id of PRODUCT_ORDER) {
    products[id] = {
      stock: SEED_PRODUCTS[id].stock,
      price: SEED_PRODUCTS[id].price,
    };
  }
  return {
    products,
    sukiBalances: { nena: pesos(0) },
    sales: { total: pesos(0), items: 0, utangOut: pesos(0) },
    cart: [],
    receipts: { cash: null, utang: null },
    beatDone: { cash: false, utang: false, restock: false, close: false },
  };
}

export function cartQty(cart: readonly CartLine[], id: DayProductId): number {
  return cart.find((line) => line.id === id)?.qty ?? 0;
}

export function cartTotal(state: DayState): Pesos {
  return pesos(
    state.cart.reduce(
      (sum, line) => sum + state.products[line.id].price * line.qty,
      0,
    ),
  );
}

export function cartMatches(
  cart: readonly CartLine[],
  beat: SaleBeat,
): boolean {
  const order = SCRIPTED_ORDERS[beat];
  const ids = PRODUCT_ORDER.filter((id) => (order[id] ?? 0) > 0);
  if (cart.length !== ids.length) return false;
  return ids.every((id) => cartQty(cart, id) === order[id]);
}

export function cartHasExtras(
  cart: readonly CartLine[],
  beat: SaleBeat,
): boolean {
  const order = SCRIPTED_ORDERS[beat];
  return cart.some((line) => line.qty > (order[line.id] ?? 0));
}

export function isLowStock(stock: number): boolean {
  return stock <= LOW_STOCK_AT;
}

/**
 * First beat not yet finished, in day order; null once the day is done.
 * Each beat depends on the ones before it (restock needs the cash sale,
 * the payment needs the utang sale), so this is the only unfinished
 * beat the owner can actually complete.
 */
export function firstUnfinishedBeat(state: DayState): BeatId | null {
  return BEAT_ORDER.find((beat) => !state.beatDone[beat]) ?? null;
}

/** Deduct the cart from stock, add it to the day totals, empty the cart. */
function applySale(state: DayState): DayState {
  let products = state.products;
  let items = 0;
  for (const line of state.cart) {
    const product = products[line.id];
    products = withKey(products, line.id, {
      ...product,
      stock: product.stock - line.qty,
    });
    items += line.qty;
  }
  return {
    ...state,
    products,
    cart: [],
    sales: {
      ...state.sales,
      total: pesos(state.sales.total + cartTotal(state)),
      items: state.sales.items + items,
    },
  };
}

function orderActions(beat: SaleBeat): DayAction[] {
  const order = SCRIPTED_ORDERS[beat];
  return PRODUCT_ORDER.flatMap((id) =>
    Array.from({ length: order[id] ?? 0 }, (): DayAction => ({
      type: 'addToCart',
      id,
    })),
  );
}

/** The exact taps "Show me" performs for a beat, in order. */
export function scriptFor(beat: BeatId): DayAction[] {
  switch (beat) {
    case 'cash':
      return [
        { type: 'clearCart' },
        ...orderActions('cash'),
        { type: 'checkoutCash', tendered: CASH_TENDERED },
      ];
    case 'utang':
      return [
        { type: 'clearCart' },
        ...orderActions('utang'),
        { type: 'checkoutUtang', suki: 'nena' },
      ];
    case 'restock':
      return [
        { type: 'restock', id: SCRIPTED_RESTOCK.id, qty: SCRIPTED_RESTOCK.qty },
      ];
    case 'close':
      return [
        {
          type: 'receivePayment',
          suki: SCRIPTED_PAYMENT.suki,
          amount: SCRIPTED_PAYMENT.amount,
        },
      ];
  }
}

export function dayReducer(state: DayState, action: DayAction): DayState {
  switch (action.type) {
    case 'addToCart': {
      const inCart = cartQty(state.cart, action.id);
      if (inCart >= state.products[action.id].stock) return state;
      const cart =
        inCart === 0
          ? [...state.cart, { id: action.id, qty: 1 }]
          : state.cart.map((line) =>
              line.id === action.id ? { ...line, qty: line.qty + 1 } : line,
            );
      return { ...state, cart };
    }
    case 'removeFromCart': {
      if (cartQty(state.cart, action.id) === 0) return state;
      const cart = state.cart.flatMap((line) => {
        if (line.id !== action.id) return [line];
        return line.qty > 1 ? [{ ...line, qty: line.qty - 1 }] : [];
      });
      return { ...state, cart };
    }
    case 'clearCart':
      return state.cart.length === 0 ? state : { ...state, cart: [] };
    case 'checkoutCash': {
      if (state.beatDone.cash || !cartMatches(state.cart, 'cash')) return state;
      const total = cartTotal(state);
      if (!Number.isInteger(action.tendered) || action.tendered < total)
        return state;
      const sold = applySale(state);
      return {
        ...sold,
        receipts: {
          ...sold.receipts,
          cash: { total, change: pesos(action.tendered - total) },
        },
        beatDone: { ...sold.beatDone, cash: true },
      };
    }
    case 'checkoutUtang': {
      if (state.beatDone.utang || !cartMatches(state.cart, 'utang'))
        return state;
      const total = cartTotal(state);
      const sold = applySale(state);
      return {
        ...sold,
        sukiBalances: withKey(
          sold.sukiBalances,
          action.suki,
          pesos(sold.sukiBalances[action.suki] + total),
        ),
        sales: { ...sold.sales, utangOut: pesos(sold.sales.utangOut + total) },
        receipts: { ...sold.receipts, utang: { total } },
        beatDone: { ...sold.beatDone, utang: true },
      };
    }
    case 'restock': {
      const product = state.products[action.id];
      if (
        state.beatDone.restock ||
        !isLowStock(product.stock) ||
        !Number.isInteger(action.qty) ||
        action.qty <= 0
      ) {
        return state;
      }
      return {
        ...state,
        products: withKey(state.products, action.id, {
          ...product,
          stock: product.stock + action.qty,
        }),
        beatDone: { ...state.beatDone, restock: true },
      };
    }
    case 'receivePayment': {
      const balance = state.sukiBalances[action.suki];
      if (
        state.beatDone.close ||
        !Number.isInteger(action.amount) ||
        action.amount <= 0 ||
        action.amount > balance
      ) {
        return state;
      }
      return {
        ...state,
        sukiBalances: withKey(
          state.sukiBalances,
          action.suki,
          pesos(balance - action.amount),
        ),
        sales: {
          ...state.sales,
          utangOut: pesos(state.sales.utangOut - action.amount),
        },
        beatDone: { ...state.beatDone, close: true },
      };
    }
    case 'autoplay': {
      if (state.beatDone[action.beat]) return state;
      return scriptFor(action.beat).reduce(dayReducer, state);
    }
  }
}

/** i18n params for a finished beat's outcome line. */
export function outcomeParams(
  beat: BeatId,
  state: DayState,
): Record<string, string> {
  switch (beat) {
    case 'cash':
      return state.receipts.cash
        ? {
            total: formatPesos(state.receipts.cash.total),
            change: formatPesos(state.receipts.cash.change),
          }
        : {};
    case 'utang':
      return state.receipts.utang
        ? { total: formatPesos(state.receipts.utang.total) }
        : {};
    case 'restock':
      return { stock: String(state.products[SCRIPTED_RESTOCK.id].stock) };
    case 'close':
      return {
        balance: formatPesos(state.sukiBalances[SCRIPTED_PAYMENT.suki]),
      };
  }
}
