# Task 06-05: Compute isError from underlying query errors

> Parent Plan: [2026-08-01-home-tab-improv.md](../../plans/2026-08-01-home-tab-improv.md)
> Index: [00-task-index.md](./00-task-index.md)

## Goal

Expose a single `isError` boolean that is `true` if any of the underlying data queries (today stats, products, credit KPIs) failed. Empty data is NOT an error — only server failures are.

## Dependencies

- [06-04](./task-06-04-goal-suggestions.md)

## Files

- Modify: `hooks/useHomeDashboardData.ts`

## Steps

- [ ] **Step 1: Add the `isError` aggregation**

After the existing `isLoading` aggregation:

```ts
const isError =
  !!getTodayStatsQuery.error ||
  !!getAllProductsQuery.error ||
  (creditKpis === undefined && !creditKpisLoading);
```

`recentSales` returning an empty array is not an error; only the underlying server failures count.

## Commit

None yet — verification + commit happen in `task-06-07`.