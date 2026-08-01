# Task 06-06: Update useHomeDashboardData return shape

> Parent Plan: [2026-08-01-home-tab-improv.md](../../plans/2026-08-01-home-tab-improv.md)
> Index: [00-task-index.md](./00-task-index.md)

## Goal

Add `goal`, `suggestions`, and `isError` to the hook's returned object alongside the existing fields.

## Dependencies

- [06-05](./task-06-05-is-error.md)

## Files

- Modify: `hooks/useHomeDashboardData.ts`

## Steps

- [ ] **Step 1: Update the return object**

Replace the final `return { ... }` block with:

```ts
return {
  stats: {
    todaySalesTotal: stats?.total ?? 0,
    transactionCount: stats?.transaction_count ?? 0,
    profitMargin,
    lowStockCount: lowStockProducts.length,
    overdueCount: creditKpis?.overdueCount ?? 0,
    overdueAmount: creditKpis?.totalOverdueAmount ?? 0,
  },
  products: products ?? [],
  recentSales,
  hourlySales,
  topProduct,
  alerts,
  alertCount: alerts.length,
  goal,
  suggestions,
  isError,
  profile,
  currentSession,
  isLoading:
    statsLoading ||
    productsLoading ||
    sessionLoading ||
    profileLoading ||
    recentLoading ||
    creditKpisLoading ||
    customersLoading,
  refreshing,
  refetchAll,
};
```

## Commit

None yet — verification + commit happen in `task-06-07`.