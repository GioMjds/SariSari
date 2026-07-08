import { describe, expect, test } from '@jest/globals';
import { useInventoryViewStore } from '../../stores/InventoryViewStore';

describe('useInventoryViewStore', () => {
  test('should default to list viewMode', () => {
    const state = useInventoryViewStore.getState();
    expect(state.viewMode).toBe('list');
  });

  test('should allow setting viewMode to grid', () => {
    useInventoryViewStore.getState().setViewMode('grid');
    expect(useInventoryViewStore.getState().viewMode).toBe('grid');
  });

  test('should allow resetting viewMode back to list', () => {
    useInventoryViewStore.getState().setViewMode('list');
    expect(useInventoryViewStore.getState().viewMode).toBe('list');
  });
});
