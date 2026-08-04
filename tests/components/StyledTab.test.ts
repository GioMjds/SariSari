import { isPathFocused } from '@/components/layout/StyledTab';

describe('isPathFocused', () => {
  it('identifies /home tab as focused for root / index paths', () => {
    expect(isPathFocused('/home', '/')).toBe(true);
    expect(isPathFocused('/home', '')).toBe(true);
    expect(isPathFocused('/home', '/index')).toBe(true);
    expect(isPathFocused('/home', '/(tabs)')).toBe(true);
    expect(isPathFocused('/home', '/(tabs)/')).toBe(true);
    expect(isPathFocused('/home', '/(tabs)/index')).toBe(true);
  });

  it('identifies /home tab as focused for /home routes', () => {
    expect(isPathFocused('/home', '/home')).toBe(true);
    expect(isPathFocused('/home', '/(tabs)/home')).toBe(true);
    expect(isPathFocused('/home', '/home/overview')).toBe(true);
    expect(isPathFocused('/home', '/(tabs)/home/overview')).toBe(true);
  });

  it('identifies non-home tabs as focused for exact and sub-routes', () => {
    expect(isPathFocused('/sales', '/sales')).toBe(true);
    expect(isPathFocused('/sales', '/(tabs)/sales')).toBe(true);
    expect(isPathFocused('/sales', '/sales/receipts')).toBe(true);
    expect(isPathFocused('/sales', '/(tabs)/sales/pos')).toBe(true);

    expect(isPathFocused('/inventory', '/inventory')).toBe(true);
    expect(isPathFocused('/inventory', '/(tabs)/inventory')).toBe(true);
    expect(isPathFocused('/inventory', '/inventory/products')).toBe(true);

    expect(isPathFocused('/customers', '/customers')).toBe(true);
    expect(isPathFocused('/customers', '/(tabs)/customers')).toBe(true);

    expect(isPathFocused('/more', '/more')).toBe(true);
    expect(isPathFocused('/more', '/(tabs)/more')).toBe(true);
  });

  it('returns false when routes do not match', () => {
    expect(isPathFocused('/home', '/sales')).toBe(false);
    expect(isPathFocused('/sales', '/home')).toBe(false);
    expect(isPathFocused('/inventory', '/customers')).toBe(false);
    expect(isPathFocused('/customers', '/more')).toBe(false);
    expect(isPathFocused('/more', '/sales')).toBe(false);
  });
});
