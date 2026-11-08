import {
  DEMO_SALE_ITEMS,
  LOW_STOCK_THRESHOLD,
  MAX_CART_QTY,
  STOCK_MAX,
  addToCart,
  cartQuantity,
  cartTotal,
  isLowStock,
  markPaid,
  restock,
  stockRatio,
  weeklyBarHeights,
} from '@/lib/onboardingDemo';

describe('cart', () => {
  it('sums price times quantity in integer pesos', () => {
    let cart = addToCart({}, 'kape');
    cart = addToCart(cart, 'kape');
    cart = addToCart(cart, 'sabon');
    expect(cartTotal(cart)).toBe(8 * 2 + 25);
    expect(cartQuantity(cart)).toBe(3);
  });

  it('is zero for an empty cart', () => {
    expect(cartTotal({})).toBe(0);
    expect(cartQuantity({})).toBe(0);
  });

  it('ignores unknown item ids', () => {
    const cart = addToCart({}, 'not-a-product');
    expect(cartQuantity(cart)).toBe(0);
  });

  it('caps quantity per item at MAX_CART_QTY', () => {
    let cart: Record<string, number> = { kape: MAX_CART_QTY };
    cart = { ...addToCart(cart, 'kape') };
    expect(cart['kape']).toBe(MAX_CART_QTY);
  });

  it('exposes three demo items with integer prices', () => {
    expect(DEMO_SALE_ITEMS).toHaveLength(3);
    for (const item of DEMO_SALE_ITEMS) {
      expect(Number.isInteger(item.price)).toBe(true);
    }
  });
});

describe('restock', () => {
  it('adds the amount up to the max', () => {
    expect(restock(3, 12)).toBe(15);
    expect(restock(15, 12)).toBe(STOCK_MAX);
  });

  it('never lowers stock that is already above max', () => {
    expect(restock(30, 5)).toBe(30);
  });

  it('ignores a negative amount', () => {
    expect(restock(7, -4)).toBe(7);
  });

  it('flags low stock at or below the threshold', () => {
    expect(isLowStock(LOW_STOCK_THRESHOLD)).toBe(true);
    expect(isLowStock(LOW_STOCK_THRESHOLD + 1)).toBe(false);
  });

  it('clamps the bar ratio to 0..1 and survives a bad max', () => {
    expect(stockRatio(10)).toBe(0.5);
    expect(stockRatio(50)).toBe(1);
    expect(stockRatio(-3)).toBe(0);
    expect(stockRatio(5, 0)).toBe(0);
  });
});

describe('markPaid', () => {
  it('clears the full balance by default', () => {
    expect(markPaid(350)).toBe(0);
  });

  it('subtracts a partial payment', () => {
    expect(markPaid(350, 100)).toBe(250);
  });

  it('never goes negative on overpayment or negative balance', () => {
    expect(markPaid(100, 500)).toBe(0);
    expect(markPaid(-40)).toBe(0);
  });

  it('ignores a negative payment', () => {
    expect(markPaid(100, -50)).toBe(100);
  });
});

describe('weeklyBarHeights', () => {
  it('normalises to the tallest bar', () => {
    expect(weeklyBarHeights([400, 800, 200])).toEqual([0.5, 1, 0.25]);
  });

  it('returns zeros, not NaN, for all-zero totals', () => {
    expect(weeklyBarHeights([0, 0, 0])).toEqual([0, 0, 0]);
  });

  it('returns an empty array for no data', () => {
    expect(weeklyBarHeights([])).toEqual([]);
  });

  it('treats negative totals as zero height', () => {
    expect(weeklyBarHeights([-10, 20])).toEqual([0, 1]);
  });
});
