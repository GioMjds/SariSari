# Task 14: Update DashboardScreen.test.tsx mocks for new hook shape

> Parent Plan: [2026-08-01-home-tab-improv.md](../../plans/2026-08-01-home-tab-improv.md)
> Index: [00-task-index.md](./00-task-index.md)

## Goal

Extend the mocked `useHomeDashboardData` return so the existing tests still pass after the hook gained `goal`, `suggestions`, and `isError`. The numeric `profitMargin: 200` continues to pass through unchanged.

## Dependencies

- [06-07](./task-06-07-verify-and-commit.md) (the production hook must be in its new shape first)

## Files

- Modify: `tests/components/DashboardScreen.test.tsx`

## Steps

- [ ] **Step 1: Extend `setupDefaultMocks`**

In `tests/components/DashboardScreen.test.tsx`, locate `setupDefaultMocks` (around line 50). Update the mocked `useHomeDashboardData` return to include the new fields:

```ts
const setupDefaultMocks = (isLoading = false) => {
  (useHomeDashboardData as jest.Mock).mockReturnValue({
    stats: {
      todaySalesTotal: 1000,
      transactionCount: 5,
      profitMargin: 200,
      lowStockCount: 0,
      overdueCount: 0,
      overdueAmount: 0,
    },
    products: [{ id: 1, name: 'Item 1', quantity: 10, price: 50 }],
    recentSales: [],
    hourlySales: [],
    topProduct: { name: 'Item 1', unitsSold: 10 },
    alerts: [],
    alertCount: 0,
    goal: { kind: 'continueSelling', destination: 'newSale' },
    suggestions: [],
    isError: false,
    currentSession: { status: 'open', variance: null },
    isLoading,
    refreshing: false,
    refetchAll: jest.fn(),
  });
};
```

- [ ] **Step 2: Run the test**

Run: `npx jest tests/components/DashboardScreen.test.tsx`

Expected: PASS. The screen renders the new layout with all mocked data; existing assertions (`getByText('New Sale')`, `getByText(/TOTAL SALES TODAY/i)`) still pass because the hero and quick-actions still render.

- [ ] **Step 3: Commit**

```bash
git add tests/components/DashboardScreen.test.tsx
git commit -m "test(home): update dashboard screen mocks for new hook shape"
```

## Next

Proceed to [Task 15](./task-15-01-dev-server-up.md).