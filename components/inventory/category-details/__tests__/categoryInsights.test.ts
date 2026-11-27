import {
  buildCategoryRows,
  selectCategoryRows,
  summarizeCategory,
  topSellers,
} from '../categoryInsights';
import type { Product } from '@/types/products.types';

const NOW = new Date('2026-11-27T00:00:00Z').getTime();
const OLD = '2026-10-01 08:00:00';

const product = (
  id: number,
  name: string,
  extra: Partial<Product> = {},
): Product => ({
  id,
  name,
  sku: `SKU-${id}`,
  barcode: null,
  price: 10,
  cost_price: 8,
  quantity: 20,
  category: 'Snacks',
  created_at: OLD,
  updated_at: OLD,
  is_favorite: false,
  ...extra,
});

const products = [
  product(1, 'Chips', { quantity: 0 }),
  product(2, 'Biscuit', { quantity: 3 }),
  product(3, 'Candy', { cost_price: 0 }),
  product(4, 'Wafer'),
  product(5, 'New Cracker', { created_at: '2026-11-25 08:00:00' }),
];

const sales = [
  { productId: 1, cashUnits: 30, cashRevenue: 300, utangUnits: 0 },
  { productId: 2, cashUnits: 5, cashRevenue: 50, utangUnits: 2 },
  { productId: 3, cashUnits: 0, cashRevenue: 0, utangUnits: 4 },
];

const rows = buildCategoryRows(products, sales, NOW);

describe('categoryInsights', () => {
  it('flags slow movers only when nothing moved, stock remains, and product is not new', () => {
    expect(rows.filter((r) => r.isSlow).map((r) => r.product.name)).toEqual([
      'Wafer',
    ]);
  });

  it('keeps utang out of sold units and revenue', () => {
    const summary = summarizeCategory(rows);
    expect(summary.soldUnits).toBe(35);
    expect(summary.revenue).toBe(350);
    expect(summary.utangUnits).toBe(6);
  });

  it('counts stock health and only prices profit for products with cost', () => {
    const summary = summarizeCategory(rows);
    expect(summary).toMatchObject({
      out: 1,
      low: 1,
      slow: 1,
      missingCost: 1,
      pricedCount: 4,
    });
    expect(summary.units).toBe(63);
    // (10 - 8) * (0 + 3 + 20 + 20) for the four priced products.
    expect(summary.potentialProfit).toBe(86);
  });

  it('sorts by priority: out, low, slow, then demand', () => {
    const names = selectCategoryRows(rows, 'all', 'priority').map(
      (r) => r.product.name,
    );
    expect(names).toEqual([
      'Chips',
      'Biscuit',
      'Wafer',
      'Candy',
      'New Cracker',
    ]);
  });

  it('filters and ranks top sellers by cash units', () => {
    expect(
      selectCategoryRows(rows, 'nocost', 'name').map((r) => r.product.name),
    ).toEqual(['Candy']);
    expect(topSellers(rows).map((r) => r.product.name)).toEqual([
      'Chips',
      'Biscuit',
    ]);
  });
  it('never calls a product slow before sales have loaded', () => {
    expect(
      buildCategoryRows(products, undefined, NOW).some((r) => r.isSlow),
    ).toBe(false);
  });
});
