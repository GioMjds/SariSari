# Task 06-02: Replace hardcoded profitMargin with useReportKPIs source

> Parent Plan: [2026-08-01-home-tab-improv.md](../../plans/2026-08-01-home-tab-improv.md)
> Index: [00-task-index.md](./00-task-index.md)

## Goal

Replace the hardcoded `profitMargin: 912` literal in the returned `stats` object with a real value sourced from `useReportKPIs(todayRange).data?.totalProfit`. Type changes from `number` to `number | null`.

## Dependencies

- [06-01](./task-06-01-imports-and-prereqs.md)

## Files

- Modify: `hooks/useHomeDashboardData.ts`

## Steps

- [ ] **Step 1: Import `useReportKPIs` explicitly**

Add to the imports:

```ts
import { useReportKPIs } from './useReports';
```

- [ ] **Step 2: Add the today-range memo + useReportKPIs call**

Inside the hook body, after the existing `useProducts` and `useSales` calls, add:

```ts
const todayRange = useMemo(() => getDateRangeFromType('today'), []);
const { data: todayKpisData } = useReportKPIs(todayRange);
const profitMargin: number | null = useMemo(() => {
  return todayKpisData?.totalProfit ?? null;
}, [todayKpisData]);
```

Drop any placeholder `useReports()` and `todayKpis` block — `useReportKPIs` is the canonical call.

- [ ] **Step 3: Replace the `profitMargin: 912` line**

In the returned `stats` object, replace:

```ts
profitMargin: 912,
```

with:

```ts
profitMargin,
```

## Commit

None yet — verification + commit happen in `task-06-07`.