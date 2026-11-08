/**
 * onboardingDemo - pure helpers behind the onboarding demo widgets.
 * No React, no storage. Money is integer pesos.
 */

export type DemoItem = {
  readonly id: string;
  readonly name: string;
  readonly price: number;
};

export const DEMO_SALE_ITEMS: readonly DemoItem[] = [
  { id: 'kape', name: 'Kape sachet', price: 8 },
  { id: 'sabon', name: 'Sabon', price: 25 },
  { id: 'itlog', name: 'Itlog', price: 12 },
];

export type DemoCart = Readonly<Record<string, number>>;

export const MAX_CART_QTY = 99;
export const STOCK_MAX = 20;
export const LOW_STOCK_THRESHOLD = 5;

export function addToCart(
  cart: DemoCart,
  id: string,
  items: readonly DemoItem[] = DEMO_SALE_ITEMS,
): DemoCart {
  if (!items.some((item) => item.id === id)) return cart;
  const current = cart[id] ?? 0;
  if (current >= MAX_CART_QTY) return cart;
  return { ...cart, [id]: current + 1 };
}

export function cartTotal(
  cart: DemoCart,
  items: readonly DemoItem[] = DEMO_SALE_ITEMS,
): number {
  return items.reduce(
    (sum, item) => sum + item.price * (cart[item.id] ?? 0),
    0,
  );
}

export function cartQuantity(cart: DemoCart): number {
  return Object.values(cart).reduce((sum, qty) => sum + qty, 0);
}

export function restock(
  qty: number,
  amount: number,
  max: number = STOCK_MAX,
): number {
  const added = qty + Math.max(0, amount);
  return Math.max(qty, Math.min(max, added));
}

export function stockRatio(qty: number, max: number = STOCK_MAX): number {
  if (max <= 0) return 0;
  return Math.min(1, Math.max(0, qty / max));
}

export function isLowStock(
  qty: number,
  threshold: number = LOW_STOCK_THRESHOLD,
): boolean {
  return qty <= threshold;
}

export function markPaid(balance: number, payment?: number): number {
  const owed = Math.max(0, balance);
  const paid = payment === undefined ? owed : Math.max(0, payment);
  return Math.max(0, owed - paid);
}

export function weeklyBarHeights(totals: readonly number[]): number[] {
  const max = totals.reduce((m, t) => Math.max(m, t), 0);
  if (max <= 0) return totals.map(() => 0);
  return totals.map((t) => Math.max(0, t) / max);
}
