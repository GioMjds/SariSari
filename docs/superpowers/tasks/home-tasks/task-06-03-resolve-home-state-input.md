# Task 06-03: Extract memoized HomeStateInput from hook deps

> Parent Plan: [2026-08-01-home-tab-improv.md](../../plans/2026-08-01-home-tab-improv.md)
> Index: [00-task-index.md](./00-task-index.md)

## Goal

Build a single memoized `HomeStateInput` object that both the upcoming `goal` and `suggestions` memos will share, instead of duplicating the input shape in two places.

## Dependencies

- [06-02](./task-06-02-profit-margin.md)

## Files

- Modify: `hooks/useHomeDashboardData.ts`

## Steps

- [ ] **Step 1: Add the memoized `HomeStateInput`**

Inside the hook body, after the `profitMargin` memo:

```ts
const homeStateInput = useMemo(
  () => ({
    productQuantities: (products ?? []).map((p: any) => p.quantity ?? 0),
    hasAnySales: (stats?.transaction_count ?? 0) > 0,
    overdueCount: creditKpis?.overdueCount ?? 0,
    cashSession: currentSession
      ? {
          status: (currentSession.status === 'closed' ? 'closed' : 'open') as
            | 'open'
            | 'closed',
          variance: currentSession.variance ?? null,
        }
      : null,
    hour: new Date().getHours(),
  }),
  [products, stats, creditKpis, currentSession],
);
```

Note: `new Date().getHours()` is read inside the memo factory. Since the memo recomputes only when its deps change, the `hour` will lag until one of the listed deps changes. That is acceptable for this screen (re-renders happen frequently from query updates).

## Commit

None yet — verification + commit happen in `task-06-07`.