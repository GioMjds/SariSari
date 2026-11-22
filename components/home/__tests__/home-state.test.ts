import { resolveHomeState } from '../home-state';

const base = {
  productCount: 10,
  outOfStockCount: 0,
  lowStockCount: 0,
  hasAnySales: true,
  overdueCount: 0,
  hour: 13,
};

describe('resolveHomeState', () => {
  it('asks to set up the catalog when there are no products', () => {
    expect(resolveHomeState({ ...base, productCount: 0 }).goal.kind).toBe(
      'setupCatalog',
    );
  });

  it('puts out-of-stock ahead of low stock', () => {
    const { goal } = resolveHomeState({
      ...base,
      outOfStockCount: 2,
      lowStockCount: 3,
    });
    expect(goal).toEqual({ kind: 'outOfStock', destination: 'inventory', count: 2 });
  });

  it('reports low stock when nothing is out of stock', () => {
    const { goal, lowStockCount } = resolveHomeState({ ...base, lowStockCount: 3 });
    expect(goal.kind).toBe('lowStock');
    expect(lowStockCount).toBe(3);
  });

  it('falls back to selling when stock and credit are fine', () => {
    expect(resolveHomeState(base).goal.kind).toBe('continueSelling');
  });
});
