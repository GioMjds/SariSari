import { HomeStateInput, resolveHomeState } from '@/components/home/home-state';

describe('resolveHomeState', () => {
  const baseInput = (overrides?: Partial<HomeStateInput>): HomeStateInput => ({
    productQuantities: [10, 20],
    hasAnySales: true,
    overdueCount: 0,
    cashSession: { status: 'open', variance: null },
    hour: 14,
    ...overrides,
  });

  test('1. setupCatalog when catalog has no products', () => {
    const input = baseInput({ productQuantities: [] });
    const state = resolveHomeState(input);
    expect(state.goal).toEqual({
      kind: 'setupCatalog',
      destination: 'addProduct',
    });
  });

  test('2. outOfStock when any product has 0 quantity', () => {
    const input = baseInput({ productQuantities: [0, 10, 0], overdueCount: 3 });
    const state = resolveHomeState(input);
    expect(state.goal).toEqual({
      kind: 'outOfStock',
      destination: 'inventory',
      count: 2,
    });
    expect(state.outOfStockCount).toBe(2);
  });

  test('3. lowStock when items are below threshold and none are 0', () => {
    const input = baseInput({ productQuantities: [2, 3, 10] });
    const state = resolveHomeState(input);
    expect(state.goal).toEqual({
      kind: 'lowStock',
      destination: 'inventory',
      count: 2,
    });
    expect(state.lowStockCount).toBe(2);
  });

  test('4. overdueCredits when overdueCount > 0', () => {
    const input = baseInput({ overdueCount: 5 });
    const state = resolveHomeState(input);
    expect(state.goal).toEqual({
      kind: 'overdueCredits',
      destination: 'utang',
      count: 5,
    });
  });

  test('5. cashShortfall when closed session has negative variance', () => {
    const input = baseInput({
      cashSession: { status: 'closed', variance: -150 },
    });
    const state = resolveHomeState(input);
    expect(state.goal).toEqual({
      kind: 'cashShortfall',
      destination: 'cashSession',
    });
  });

  test('6. openDrawer when cashSession is null', () => {
    const input = baseInput({ cashSession: null });
    const state = resolveHomeState(input);
    expect(state.goal).toEqual({
      kind: 'openDrawer',
      destination: 'cashSession',
    });
  });

  test('7. reviewClose when closed session has non-negative variance', () => {
    const input = baseInput({
      cashSession: { status: 'closed', variance: 0 },
    });
    const state = resolveHomeState(input);
    expect(state.goal).toEqual({
      kind: 'reviewClose',
      destination: 'cashSession',
    });
  });

  test('8. firstSale when products exist but hasAnySales is false', () => {
    const input = baseInput({ hasAnySales: false });
    const state = resolveHomeState(input);
    expect(state.goal).toEqual({
      kind: 'firstSale',
      destination: 'newSale',
    });
  });

  test('9. continueSelling as default normal operating state', () => {
    const input = baseInput();
    const state = resolveHomeState(input);
    expect(state.goal).toEqual({
      kind: 'continueSelling',
      destination: 'newSale',
    });
  });

  test('time-based suggestions for morning, afternoon, and evening', () => {
    // Morning (hour = 8) -> Suggestion destination 'inventory'
    const morningInput = baseInput({ hour: 8 });
    const morningState = resolveHomeState(morningInput);
    expect(morningState.suggestions).toEqual([
      { kind: 'lowStock', destination: 'inventory' },
    ]);

    // Afternoon (hour = 14) -> Suggestion destination 'newSale', but goal destination is 'newSale' -> omitted
    const afternoonInput = baseInput({ hour: 14 });
    const afternoonState = resolveHomeState(afternoonInput);
    expect(afternoonState.suggestions).toEqual([]);

    // Evening (hour = 20) -> Suggestion destination 'reports'
    const eveningInput = baseInput({ hour: 20 });
    const eveningState = resolveHomeState(eveningInput);
    expect(eveningState.suggestions).toEqual([
      { kind: 'reviewReports', destination: 'reports' },
    ]);
  });
});
