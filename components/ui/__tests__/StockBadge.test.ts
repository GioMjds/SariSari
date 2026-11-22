import { getStockLabel } from '../StockBadge';
import { useViewModeStore } from '@/stores/useViewModeStore';

describe('getStockLabel', () => {
  it('labels out, low and healthy stock', () => {
    expect(getStockLabel(0)).toBe('Out of stock');
    expect(getStockLabel(-2)).toBe('Out of stock');
    expect(getStockLabel(5)).toBe('Low · 5 left');
    expect(getStockLabel(6)).toBe('6 in stock');
  });
});

describe('useViewModeStore', () => {
  it('defaults POS to grid and Inventory to list, and sets each independently', () => {
    expect(useViewModeStore.getState().modes).toEqual({
      pos: 'grid',
      inventory: 'list',
    });
    useViewModeStore.getState().setMode('inventory', 'grid');
    expect(useViewModeStore.getState().modes).toEqual({
      pos: 'grid',
      inventory: 'grid',
    });
  });
});
